<?php

namespace App\Http\Controllers\Admin;

use App\Exports\JadwalExport;
use App\Exports\JadwalTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\JadwalImport;
use App\Models\Jadwal;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use Illuminate\Validation\ValidationException;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class JadwalController extends Controller
{
    public function index(Request $request)
    {
        $pengaturan = PengaturanSekolah::current();
        $jamSlots   = $pengaturan->getJamSlots();
        $hariOrder  = ['Senin' => 0, 'Selasa' => 1, 'Rabu' => 2, 'Kamis' => 3, 'Jumat' => 4, 'Sabtu' => 5, 'Ahad' => 6];
        $hariAktif  = collect($pengaturan->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'])
                        ->sortBy(fn ($h) => $hariOrder[$h] ?? 99)
                        ->values()->all();
        $hariIni    = $this->hariIndonesia(now()->dayOfWeek);

        $rombelId   = $request->query('rombel_id');
        $hariFilter = in_array($request->query('hari'), $hariAktif) ? $request->query('hari') : null;

        $rombelList = Rombel::with('kelas')
            ->where('is_aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'kelas_id']);

        $jadwalList          = collect();
        $pembelajaranRombel  = collect();

        if ($rombelId) {
            $jadwalList = Jadwal::with([
                    'pembelajaran.mataPelajaran',
                    'pembelajaran.jurusan',
                    'pembelajaran.guru.user',
                ])
                ->whereHas('pembelajaran', fn ($q) => $q->where('rombel_id', $rombelId))
                ->orderByRaw("FIELD(hari, '" . implode("','", $hariAktif) . "')")
                ->orderBy('jam_ke')
                ->get();

            $pembelajaranRombel = Pembelajaran::with('mataPelajaran', 'jurusan', 'guru.user')
                ->where('rombel_id', $rombelId)
                ->where('is_aktif', true)
                ->get();
        }

        return Inertia::render('Admin/Jadwal/Index', [
            'jadwalList'           => $jadwalList,
            'rombelList'           => $rombelList,
            'pembelajaranRombel'   => $pembelajaranRombel,
            'jamSlots'             => $jamSlots,
            'istirahat'            => $pengaturan->istirahat ?? [],
            'hariList'             => $hariAktif,
            'hariIni'              => $hariIni,
            'selectedRombelId'     => $rombelId ? (int) $rombelId : null,
            'selectedHari'         => $hariFilter,
        ]);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'rows'                   => 'required|array',
            'rows.*.id'              => 'nullable|integer',
            'rows.*.hari'            => 'nullable|string',
            'rows.*.jam_ke'          => 'nullable|integer|min:0',
            'rows.*.pembelajaran_id' => 'nullable|exists:pembelajaran,id',
            'rows.*._delete'         => 'nullable|boolean',
        ]);

        // Validasi manual untuk row non-delete
        $saveErrors = [];
        foreach ($request->rows as $i => $row) {
            if (!empty($row['_delete'])) continue;
            if (empty($row['pembelajaran_id'])) $saveErrors["rows.{$i}.pembelajaran_id"] = 'Mata pelajaran wajib dipilih.';
            if (empty($row['hari']))             $saveErrors["rows.{$i}.hari"]            = 'Hari wajib diisi.';
            if (empty($row['jam_ke']))           $saveErrors["rows.{$i}.jam_ke"]          = 'JP wajib diisi.';
        }
        if (!empty($saveErrors)) return back()->withErrors($saveErrors);

        $pengaturan = PengaturanSekolah::current();
        $slots      = collect($pengaturan->getJamSlots())->keyBy('jam_ke');

        // Pre-load guru_id per pembelajaran untuk efisiensi
        $pembIds  = collect($request->rows)->pluck('pembelajaran_id')->unique()->filter();
        $guruMap  = Pembelajaran::whereIn('id', $pembIds)->pluck('guru_id', 'id');

        // Validasi konflik: guru yang sama tidak boleh di hari+jam yang sama
        $conflicts = [];
        foreach ($request->rows as $row) {
            if (!empty($row['_delete'])) continue;

            $guruId  = $guruMap[$row['pembelajaran_id']] ?? null;
            if (!$guruId) continue;

            $conflict = Jadwal::whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $guruId))
                ->where('hari', $row['hari'])
                ->where('jam_ke', $row['jam_ke'])
                ->when(!empty($row['id']), fn ($q) => $q->where('id', '!=', $row['id']))
                ->with('pembelajaran.guru.user')
                ->first();

            if ($conflict) {
                $namaGuru  = $conflict->pembelajaran?->guru?->user?->name ?? 'Guru';
                $conflicts[] = "{$namaGuru} sudah terjadwal di {$row['hari']} jam ke-{$row['jam_ke']}";
            }
        }

        if (!empty($conflicts)) {
            return back()->withErrors(['konflik' => array_unique($conflicts)]);
        }

        $saved   = 0;
        $deleted = 0;

        foreach ($request->rows as $row) {
            if (!empty($row['_delete'])) {
                if (!empty($row['id'])) {
                    Jadwal::find($row['id'])?->delete();
                    $deleted++;
                }
                continue;
            }

            $slot    = $slots[$row['jam_ke']] ?? null;
            $payload = [
                'pembelajaran_id' => $row['pembelajaran_id'],
                'hari'            => $row['hari'],
                'jam_ke'          => $row['jam_ke'],
                'jam_mulai'       => $slot['jam_mulai'] ?? '00:00',
                'jam_selesai'     => $slot['jam_selesai'] ?? '00:00',
                'is_aktif'        => true,
            ];

            if (!empty($row['id'])) {
                Jadwal::find($row['id'])?->update($payload);
            } else {
                Jadwal::create($payload);
            }
            $saved++;
        }

        return back()->with('success', "{$saved} jadwal disimpan" . ($deleted ? ", {$deleted} dihapus" : '') . '.');
    }

    public function export(Request $request)
    {
        $rombelId = $request->rombel_id ? (int) $request->rombel_id : null;
        return Excel::download(new JadwalExport($rombelId), 'jadwal-' . now()->format('Ymd') . '.xlsx');
    }

    public function template(Request $request)
    {
        $rombelId = $request->rombel_id ? (int) $request->rombel_id : null;
        $rombel   = $rombelId ? Rombel::find($rombelId) : null;
        $fn = $rombel
            ? 'template_jadwal_' . \Illuminate\Support\Str::slug($rombel->nama) . '.xlsx'
            : 'template_jadwal.xlsx';
        return Excel::download(new JadwalTemplateExport($rombelId), $fn);
    }

    public function import(Request $request)
    {
        $request->validate([
            'rombel_id' => 'required|exists:rombel,id',
            'file'      => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $rombelId = (int) $request->rombel_id;
        $import   = new JadwalImport($rombelId);
        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: ' . $e->getMessage()]);
        }

        $msg = "{$import->imported} jadwal berhasil diimport.";
        if ($import->skipped) $msg .= " {$import->skipped} baris dilewati.";
        return redirect('/admin/jadwal?rombel_id=' . $rombelId)
            ->with('success', $msg)
            ->with('import_errors', $import->errors ?: null);
    }

    public function destroy(Jadwal $jadwal)
    {
        $jadwal->delete();
        return back()->with('success', 'Jadwal berhasil dihapus.');
    }

    private function hariIndonesia(int $dayOfWeek): string
    {
        $map = [0 => 'Ahad', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'];
        return $map[$dayOfWeek] ?? 'Senin';
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\AbsensiTatausaha;
use App\Models\HariLibur;
use App\Models\Jadwal;
use App\Models\JurnalMengajar;
use App\Models\PengaturanSekolah;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HariLiburController extends Controller
{
    public function index(Request $request)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);

        $libur = HariLibur::whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bln)
            ->orderBy('tanggal')
            ->get();

        $sekolah  = PengaturanSekolah::current();
        $jamSlots = $sekolah->getJamSlots();

        return Inertia::render('Admin/HariLibur/Index', [
            'libur'    => $libur,
            'jamSlots' => $jamSlots,
            'filters'  => ['bulan' => $bulan],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tanggal'      => 'required|date|unique:hari_libur,tanggal',
            'nama'         => 'required|string|max:150',
            'keterangan'   => 'nullable|string',
            'jam_tertentu' => 'nullable|array',
            'jam_tertentu.*' => 'integer|min:1',
        ]);

        // Empty array → treat as all jam (null)
        if (isset($data['jam_tertentu']) && count($data['jam_tertentu']) === 0) {
            $data['jam_tertentu'] = null;
        }

        HariLibur::create($data);

        return back()->with('success', 'Hari libur berhasil ditambahkan.');
    }

    public function update(Request $request, HariLibur $hariLibur)
    {
        $data = $request->validate([
            'tanggal'      => 'required|date|unique:hari_libur,tanggal,' . $hariLibur->id,
            'nama'         => 'required|string|max:150',
            'keterangan'   => 'nullable|string',
            'jam_tertentu' => 'nullable|array',
            'jam_tertentu.*' => 'integer|min:1',
        ]);

        if (isset($data['jam_tertentu']) && count($data['jam_tertentu']) === 0) {
            $data['jam_tertentu'] = null;
        }

        $hariLibur->update($data);

        return back()->with('success', 'Hari libur berhasil diperbarui.');
    }

    public function destroy(HariLibur $hariLibur)
    {
        $hariLibur->delete();
        return back()->with('success', 'Hari libur berhasil dihapus.');
    }

    public function syncPreview(HariLibur $hariLibur)
    {
        $tanggal = $hariLibur->tanggal->format('Y-m-d');

        if ($hariLibur->jam_tertentu === null) {
            return response()->json([
                'piket'           => AbsensiPiket::where('tanggal', $tanggal)->count(),
                'jurnal'          => JurnalMengajar::where('tanggal', $tanggal)->count(),
                'absensi_guru'    => AbsensiGuru::where('tanggal', $tanggal)->count(),
                'absensi_tu'      => AbsensiTatausaha::where('tanggal', $tanggal)->count(),
                'mode'            => 'penuh',
            ]);
        }

        $jadwalIds = Jadwal::whereIn('jam_ke', $hariLibur->jam_tertentu)->pluck('id');
        $jurnalCount = JurnalMengajar::where('tanggal', $tanggal)->get()
            ->filter(fn ($j) => !empty(array_intersect($j->jadwal_ids ?? [], $jadwalIds->toArray())))
            ->count();

        return response()->json([
            'piket'  => AbsensiPiket::where('tanggal', $tanggal)->whereIn('jadwal_id', $jadwalIds)->count(),
            'jurnal' => $jurnalCount,
            'absensi_guru' => 0,
            'absensi_tu'   => 0,
            'mode'   => 'sebagian',
        ]);
    }

    public function sync(HariLibur $hariLibur)
    {
        $tanggal = $hariLibur->tanggal->format('Y-m-d');

        if ($hariLibur->jam_tertentu === null) {
            // Hari libur penuh — hapus semua record tanggal ini
            $cPiket  = AbsensiPiket::where('tanggal', $tanggal)->count();
            $cJurnal = JurnalMengajar::where('tanggal', $tanggal)->count();
            $cGuru   = AbsensiGuru::where('tanggal', $tanggal)->count();
            $cTu     = AbsensiTatausaha::where('tanggal', $tanggal)->count();

            AbsensiPiket::where('tanggal', $tanggal)->delete();
            JurnalMengajar::where('tanggal', $tanggal)->delete();
            AbsensiGuru::where('tanggal', $tanggal)->delete();
            AbsensiTatausaha::where('tanggal', $tanggal)->delete();

            $msg = "Sync selesai ({$hariLibur->nama}): {$cPiket} presensi piket, {$cJurnal} jurnal, {$cGuru} absensi guru, {$cTu} absensi TU dihapus.";
        } else {
            // Hari libur jam tertentu — hapus hanya JP yang libur
            $jadwalIds = Jadwal::whereIn('jam_ke', $hariLibur->jam_tertentu)->pluck('id');

            $cPiket = AbsensiPiket::where('tanggal', $tanggal)->whereIn('jadwal_id', $jadwalIds)->count();
            AbsensiPiket::where('tanggal', $tanggal)->whereIn('jadwal_id', $jadwalIds)->delete();

            $jurnalToDelete = JurnalMengajar::where('tanggal', $tanggal)->get()
                ->filter(fn ($j) => !empty(array_intersect($j->jadwal_ids ?? [], $jadwalIds->toArray())));
            $cJurnal = $jurnalToDelete->count();
            $jurnalToDelete->each->delete();

            $msg = "Sync selesai ({$hariLibur->nama}, JP " . implode(',', $hariLibur->jam_tertentu) . "): {$cPiket} presensi piket, {$cJurnal} jurnal dihapus.";
        }

        return back()->with('success', $msg);
    }
}

<?php

namespace App\Http\Controllers\Guru;

use App\Exports\NilaiJurnalExport;
use App\Http\Controllers\Controller;
use App\Models\JurnalMengajar;
use App\Models\Nilai;
use App\Models\NilaiJurnal;
use App\Models\Pembelajaran;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class NilaiController extends Controller
{
    private function guruId(): ?int
    {
        return request()->user()->guru?->id;
    }

    private function isAdmin(): bool
    {
        return request()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
    }

    public function index()
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();

        // Jika bukan admin dan tidak punya profil guru, tampilkan kosong
        if (!$isAdmin && !$guruId) {
            return Inertia::render('Guru/Nilai/Index', ['pembelajaran' => []]);
        }

        $pembelajaran = Pembelajaran::with('mataPelajaran', 'rombel')
            ->when(!$isAdmin, fn($q) => $q->where('guru_id', $guruId))
            ->where('is_aktif', true)
            ->get()
            ->map(function ($p) {
                $jurnalIds = JurnalMengajar::where('pembelajaran_id', $p->id)->pluck('id');
                return [
                    'id'             => $p->id,
                    'mata_pelajaran' => ['id' => $p->mataPelajaran?->id, 'nama' => $p->mataPelajaran?->nama, 'kkm' => $p->mataPelajaran?->kkm ?? 75],
                    'rombel'         => ['id' => $p->rombel?->id, 'nama' => $p->rombel?->nama],
                    'jurnal_count'   => $jurnalIds->count(),
                    'nilai_count'    => NilaiJurnal::whereIn('jurnal_mengajar_id', $jurnalIds)
                                            ->distinct('jurnal_mengajar_id')
                                            ->count('jurnal_mengajar_id'),
                ];
            });

        return Inertia::render('Guru/Nilai/Index', [
            'pembelajaran' => $pembelajaran,
        ]);
    }

    public function show(Pembelajaran $pembelajaran)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();
        abort_if(!$isAdmin && $pembelajaran->guru_id !== $guruId, 403);

        $jurnalIds = JurnalMengajar::where('pembelajaran_id', $pembelajaran->id)->pluck('id');

        $jurnalList = JurnalMengajar::with(['capaianPembelajaran'])
            ->where('pembelajaran_id', $pembelajaran->id)
            ->orderBy('tanggal')
            ->get()
            ->map(fn($j) => [
                'id'           => $j->id,
                'tanggal'      => $j->tanggal?->format('Y-m-d'),
                'pertemuan_ke' => $j->pertemuan_ke,
                'materi_pokok' => $j->materi_pokok,
                'capaian_pembelajaran' => $j->capaianPembelajaran->map(fn($cp) => [
                    'id'           => $cp->id,
                    'kode_lengkap' => $cp->kode_lengkap,
                    'capaian'      => $cp->capaian,
                ])->values(),
            ]);

        // Kelas gabung (jurusan_id null) → semua siswa di rombel
        // Kelas dipisah (jurusan_id diset) → hanya siswa dari jurusan tersebut
        $siswa = Siswa::where('rombel_id', $pembelajaran->rombel_id)
            ->where('status_siswa', 'Aktif')
            ->when($pembelajaran->jurusan_id, function ($q) use ($pembelajaran) {
                $q->where(function ($inner) use ($pembelajaran) {
                    $inner->where('jurusan_id', $pembelajaran->jurusan_id)
                          ->orWhereNull('jurusan_id');
                });
            })
            ->with('user')
            ->orderBy('id')
            ->get()
            ->map(fn($s) => [
                'id'   => $s->id,
                'nis'  => $s->nis,
                'nama' => $s->user?->name ?? '—',
            ]);

        $nilaiData = NilaiJurnal::whereIn('jurnal_mengajar_id', $jurnalIds)
            ->get(['jurnal_mengajar_id', 'siswa_id', 'capaian_pembelajaran_id', 'nilai', 'catatan']);

        return Inertia::render('Guru/Nilai/Show', [
            'pembelajaran' => $pembelajaran->load('mataPelajaran', 'rombel'),
            'jurnalList'   => $jurnalList,
            'siswa'        => $siswa,
            'nilaiData'    => $nilaiData,
        ]);
    }

    public function saveJurnal(Request $request, Pembelajaran $pembelajaran, JurnalMengajar $jurnal)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();
        abort_if(!$isAdmin && $pembelajaran->guru_id !== $guruId, 403);
        abort_if($jurnal->pembelajaran_id !== $pembelajaran->id, 403);

        $data = $request->validate([
            'nilai_list'                           => 'required|array',
            'nilai_list.*.siswa_id'                => 'required|exists:siswa,id',
            'nilai_list.*.capaian_pembelajaran_id' => 'required|exists:capaian_pembelajaran,id',
            'nilai_list.*.nilai'                   => 'nullable|numeric|min:0|max:100',
            'nilai_list.*.catatan'                 => 'nullable|string|max:255',
        ]);

        foreach ($data['nilai_list'] as $item) {
            $where = [
                'jurnal_mengajar_id'      => $jurnal->id,
                'siswa_id'                => $item['siswa_id'],
                'capaian_pembelajaran_id' => $item['capaian_pembelajaran_id'],
            ];

            if ($item['nilai'] === null || $item['nilai'] === '') {
                NilaiJurnal::where($where)->delete();
            } else {
                NilaiJurnal::updateOrCreate($where, [
                    'nilai'   => $item['nilai'],
                    'catatan' => $item['catatan'] ?? null,
                ]);
            }
        }

        return back()->with('success', 'Nilai berhasil disimpan.');
    }

    public function export(Pembelajaran $pembelajaran)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();
        abort_if(!$isAdmin && $pembelajaran->guru_id !== $guruId, 403);

        $mapel    = $pembelajaran->load('mataPelajaran', 'rombel')->mataPelajaran?->nama ?? 'Nilai';
        $rombel   = $pembelajaran->rombel?->nama ?? '';
        $filename = preg_replace('/[^A-Za-z0-9_\-.]/', '_', "Nilai_{$mapel}_{$rombel}_" . now()->format('Ymd') . '.xlsx');

        return Excel::download(new NilaiJurnalExport($pembelajaran), $filename);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'pembelajaran_id'       => 'required|exists:pembelajaran,id',
            'jenis_penilaian_id'    => 'required',
            'teknik_penilaian_id'   => 'nullable',
            'nama_penilaian'        => 'required|string',
            'tanggal'               => 'required|date',
            'nilai_list'            => 'required|array',
            'nilai_list.*.siswa_id' => 'required|exists:siswa,id',
            'nilai_list.*.nilai'    => 'required|numeric|min:0|max:100',
        ]);

        foreach ($data['nilai_list'] as $item) {
            Nilai::updateOrCreate(
                ['pembelajaran_id' => $data['pembelajaran_id'], 'siswa_id' => $item['siswa_id'], 'nama_penilaian' => $data['nama_penilaian']],
                ['jenis_penilaian_id' => $data['jenis_penilaian_id'], 'teknik_penilaian_id' => $data['teknik_penilaian_id'], 'tanggal' => $data['tanggal'], 'nilai' => $item['nilai'], 'nilai_maksimal' => 100]
            );
        }

        return back()->with('success', 'Nilai berhasil disimpan.');
    }
}

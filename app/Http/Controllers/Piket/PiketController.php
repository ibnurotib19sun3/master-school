<?php

namespace App\Http\Controllers\Piket;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\AbsensiTatausaha;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\Jadwal;
use App\Models\JurnalTatausaha;
use App\Models\JurnalMengajar;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use App\Models\TahunAjaran;
use App\Models\Tatausaha;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PiketController extends Controller
{
    private const HARI_MAP = [
        0 => 'Ahad', 1 => 'Senin', 2 => 'Selasa',
        3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu',
    ];

    private function baseData(): array
    {
        $hari         = self::HARI_MAP[now()->dayOfWeek];
        $tanggal      = today()->toDateString();
        $hariLibur    = HariLibur::where('tanggal', $tanggal)->first();
        $sekolah      = PengaturanSekolah::current();
        $hariAktif    = $sekolah->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        $isHariAktif  = in_array($hari, $hariAktif);
        $isLiburPenuh = $hariLibur && $hariLibur->jam_tertentu === null;

        return compact('hari', 'tanggal', 'hariLibur', 'isHariAktif', 'isLiburPenuh');
    }

    public function index()
    {
        [
            'hari'     => $hari,
            'tanggal'  => $tanggal,
            'hariLibur'=> $hariLibur,
        ] = $this->baseData();

        $jadwalRaw = Jadwal::with([
            'pembelajaran.mataPelajaran',
            'pembelajaran.rombel.kelas',
            'pembelajaran.guru.user',
        ])
        ->where('hari', $hari)
        ->where('is_aktif', true)
        ->orderBy('jam_mulai')
        ->get();

        $jadwal = $jadwalRaw->values()->map(function ($j) {
            $arr = $j->toArray();
            $arr['guru_nomor_wa'] = $j->pembelajaran?->guru?->nomor_wa;
            $arr['guru_nama']     = $j->pembelajaran?->guru?->user?->name;
            $arr['rombel_nama']   = $j->pembelajaran?->rombel?->nama;
            $arr['mapel_nama']    = $j->pembelajaran?->mataPelajaran?->nama;
            return $arr;
        });

        $jadwalIds       = collect($jadwal)->pluck('id');
        $pembelajaranIds = collect($jadwal)->pluck('pembelajaran_id');

        $piketRecords = AbsensiPiket::where('tanggal', $tanggal)
            ->whereIn('jadwal_id', $jadwalIds)
            ->get()
            ->keyBy('jadwal_id');

        // Keyed by jadwal_id (bukan pembelajaran_id) agar per-JP bisa dicek sendiri-sendiri
        $jurnalStatus = JurnalMengajar::where('tanggal', $tanggal)
            ->whereIn('pembelajaran_id', $pembelajaranIds)
            ->get(['jadwal_ids'])
            ->flatMap(fn ($j) => $j->jadwal_ids ?? [])
            ->unique()
            ->flip()
            ->map(fn () => true);

        // Hitung pembelajaran aktif yang belum punya jadwal sama sekali
        $tahunAktif = TahunAjaran::aktif();
        $pembelajaranTanpaJadwal = Pembelajaran::where('is_aktif', true)
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->whereDoesntHave('jadwal')
            ->count();

        return Inertia::render('Piket/Dashboard', [
            'jadwal'                  => $jadwal,
            'piketRecords'            => $piketRecords,
            'jurnalStatus'            => $jurnalStatus,
            'hari'                    => $hari,
            'tanggal'                 => $tanggal,
            'pembelajaranTanpaJadwal' => $pembelajaranTanpaJadwal,
            'hariLibur'               => $hariLibur,
        ]);
    }

    public function kehadiranTatausaha()
    {
        [
            'hari'         => $hari,
            'tanggal'      => $tanggal,
            'hariLibur'    => $hariLibur,
            'isHariAktif'  => $isHariAktif,
            'isLiburPenuh' => $isLiburPenuh,
        ] = $this->baseData();

        $tatausahaList = ($isHariAktif && !$isLiburPenuh)
            ? Tatausaha::with('user')->where('is_aktif', true)->get()
            : collect();

        $tatausahaIds = $tatausahaList->pluck('id');

        $absensiTatausaha = $tatausahaIds->isEmpty()
            ? collect()
            : AbsensiTatausaha::where('tanggal', $tanggal)
                ->whereIn('tatausaha_id', $tatausahaIds)
                ->get()
                ->keyBy('tatausaha_id');

        $jurnalTuHariIni = $tatausahaIds->isEmpty()
            ? collect()
            : JurnalTatausaha::where('tanggal', $tanggal)
                ->whereIn('tatausaha_id', $tatausahaIds)
                ->pluck('tatausaha_id')
                ->flip()
                ->map(fn () => true);

        return Inertia::render('Piket/KehadiranTatausaha', [
            'tatausahaList'    => $tatausahaList,
            'absensiTatausaha' => $absensiTatausaha,
            'jurnalTuHariIni'  => $jurnalTuHariIni,
            'tanggal'          => $tanggal,
            'hari'             => $hari,
            'hariLibur'        => $hariLibur,
        ]);
    }

    public function kehadiranManajemen()
    {
        [
            'hari'         => $hari,
            'tanggal'      => $tanggal,
            'hariLibur'    => $hariLibur,
            'isHariAktif'  => $isHariAktif,
            'isLiburPenuh' => $isLiburPenuh,
        ] = $this->baseData();

        $managementRoles = [
            'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
            'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
            'kepala_tatausaha', 'bendahara_sekolah',
        ];

        $manajemenList = ($isHariAktif && !$isLiburPenuh)
            ? Guru::with(['user.roles'])->where('is_aktif', true)
                ->whereHas('user.roles', fn ($q) => $q->whereIn('name', $managementRoles))
                ->get()
                ->map(fn ($g) => [
                    'id'       => $g->id,
                    'nama'     => $g->user?->name ?? '-',
                    'jabatan'  => $g->jabatan ?? [],
                    'nomor_wa' => $g->nomor_wa,
                    'avatar'   => $g->user?->avatar_url,
                ])
                ->sortBy('nama')
                ->values()
            : collect();

        $absensiManajemen = $manajemenList->isEmpty()
            ? collect()
            : AbsensiGuru::where('tanggal', $tanggal)
                ->whereIn('guru_id', $manajemenList->pluck('id'))
                ->get()
                ->keyBy('guru_id');

        return Inertia::render('Piket/KehadiranManajemen', [
            'manajemenList'    => $manajemenList,
            'absensiManajemen' => $absensiManajemen,
            'tanggal'          => $tanggal,
            'hari'             => $hari,
            'hariLibur'        => $hariLibur,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'jadwal_id'      => 'required|exists:jadwal,id',
            'tanggal'        => 'required|date',
            'status_guru'    => 'required|in:Hadir,Sakit,Izin,Alpha,Tugas_Sekolah',
            'keterangan'     => 'nullable|string|max:500',
            'tugas'          => 'nullable|string',
            'deadline_tugas' => 'nullable|date',
        ]);

        AbsensiPiket::updateOrCreate(
            ['jadwal_id' => $data['jadwal_id'], 'tanggal' => $data['tanggal']],
            [
                'status_guru'    => $data['status_guru'],
                'keterangan'     => $data['keterangan'] ?? null,
                'tugas'          => $data['tugas'] ?? null,
                'deadline_tugas' => $data['deadline_tugas'] ?? null,
                'dicatat_oleh'   => auth()->id(),
            ]
        );

        // Sync ke AbsensiGuru harian agar masuk laporan kehadiran
        $this->syncAbsensiGuruFromPiket($data['jadwal_id'], $data['tanggal'], $data['status_guru']);

        // Jika status berubah ke non-Hadir, hapus jurnal mengajar yang sudah diisi
        if ($data['status_guru'] !== 'Hadir') {
            $this->hapusJurnalJikaTidakHadir($data['jadwal_id'], $data['tanggal']);
        }

        return back()->with('success', 'Presensi guru berhasil disimpan.');
    }

    private function syncAbsensiGuruFromPiket(int $jadwalId, string $tanggal, string $statusPiket): void
    {
        $jadwal = Jadwal::with('pembelajaran')->find($jadwalId);
        $guruId = $jadwal?->pembelajaran?->guru_id;
        if (!$guruId) return;

        // Tugas_Sekolah = guru hadir (hanya tidak di kelas)
        $statusHarian = $statusPiket === 'Tugas_Sekolah' ? 'Hadir' : $statusPiket;

        $existing = AbsensiGuru::where('guru_id', $guruId)->where('tanggal', $tanggal)->first();

        if (!$existing) {
            AbsensiGuru::create([
                'guru_id'      => $guruId,
                'tanggal'      => $tanggal,
                'status'       => $statusHarian,
                'dicatat_oleh' => auth()->id(),
            ]);
        } elseif ($existing->status !== 'Hadir' && $statusHarian === 'Hadir') {
            // Upgrade: jika ada jadwal lain yang hadir, angkat status ke Hadir
            $existing->update(['status' => 'Hadir', 'dicatat_oleh' => auth()->id()]);
        }
        // Jika existing sudah Hadir, jangan downgrade meskipun JP ini Alpha/Sakit
    }

    private function hapusJurnalJikaTidakHadir(int $jadwalId, string $tanggal): void
    {
        $jadwal = Jadwal::find($jadwalId);
        if (! $jadwal) return;

        JurnalMengajar::where('tanggal', $tanggal)
            ->where('pembelajaran_id', $jadwal->pembelajaran_id)
            ->delete();
    }

    public function storeAbsensiGuru(Request $request)
    {
        $data = $request->validate([
            'guru_id'    => 'required|exists:guru,id',
            'status'     => 'required|in:Hadir,Sakit,Izin,Alpha,Tugas_Sekolah,Tidak_Hadir',
            'keterangan' => 'nullable|string|max:500',
        ]);

        AbsensiGuru::updateOrCreate(
            ['guru_id' => $data['guru_id'], 'tanggal' => today()->toDateString()],
            [
                'status'       => $data['status'],
                'keterangan'   => $data['keterangan'] ?? null,
                'dicatat_oleh' => auth()->id(),
            ]
        );

        return back()->with('success', 'Presensi guru harian berhasil disimpan.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AbsensiPiket;
use App\Models\Jadwal;
use App\Models\PengaturanSekolah;
use Inertia\Inertia;

class PublicJadwalController extends Controller
{
    private const HARI_MAP = [
        0 => 'Senin',
        1 => 'Senin',
        2 => 'Selasa',
        3 => 'Rabu',
        4 => 'Kamis',
        5 => 'Jumat',
        6 => 'Sabtu',
    ];

    private const HARI_URUT = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public function index()
    {
        $hariHariIni = self::HARI_MAP[now()->dayOfWeek];
        $today       = now()->toDateString();

        $jadwalRaw = Jadwal::with([
            'pembelajaran.mataPelajaran',
            'pembelajaran.rombel.kelas',
            'pembelajaran.jurusan',
            'pembelajaran.guru.user',
        ])
        ->where('is_aktif', true)
        ->orderBy('jam_ke')
        ->get();

        $piketMap = AbsensiPiket::whereIn('jadwal_id', $jadwalRaw->pluck('id'))
            ->where('tanggal', $today)
            ->get()
            ->keyBy('jadwal_id');

        $jadwalAll = $jadwalRaw->map(fn ($j) => [
            'id'             => $j->id,
            'hari'           => $j->hari,
            'jam_ke'         => $j->jam_ke,
            'jam_mulai'      => substr($j->jam_mulai, 0, 5),
            'jam_selesai'    => substr($j->jam_selesai, 0, 5),
            'mata_pelajaran' => $j->pembelajaran?->mataPelajaran?->nama ?? '–',
            'rombel_nama'    => $j->pembelajaran?->rombel?->nama ?? '–',
            'rombel'         => ($j->pembelajaran?->rombel?->nama ?? '–')
                             . ($j->pembelajaran?->jurusan ? ' | ' . $j->pembelajaran->jurusan->kode : ''),
            'guru'           => $j->pembelajaran?->guru?->user?->name ?? '–',
            'piket_status'   => $piketMap->get($j->id)?->status_guru ?? null,
            'piket_tugas'    => $piketMap->get($j->id)?->tugas ?? null,
            'piket_deadline' => $piketMap->get($j->id)?->deadline_tugas
                                ? substr((string) $piketMap->get($j->id)->deadline_tugas, 0, 10)
                                : null,
        ]);

        $hariDiData = $jadwalAll->pluck('hari')->unique()->all();
        $hariAktif  = collect(self::HARI_URUT)->filter(fn ($h) => in_array($h, $hariDiData))->values();

        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Public/JadwalPublik', [
            'jadwalAll'   => $jadwalAll->values(),
            'hariAktif'   => $hariAktif,
            'hariHariIni' => $hariHariIni,
            'tanggal'     => now()->locale('id')->isoFormat('dddd, D MMMM Y'),
            'namaSekolah' => $sekolah->nama_sekolah ?? 'Nama Sekolah',
            'logoSekolah' => $sekolah->logo_url,
            'istirahat'   => $sekolah->istirahat ?? [],
        ]);
    }
}

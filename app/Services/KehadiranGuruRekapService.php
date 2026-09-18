<?php

namespace App\Services;

use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\Guru;
use App\Models\HariLibur;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Sumber tunggal perhitungan rekap kehadiran guru bulanan (harian + per JP),
 * dipakai oleh Admin\LaporanController (halaman Kehadiran Guru) dan API eksternal
 * agar angka "% Hadir" selalu konsisten di kedua tempat.
 */
class KehadiranGuruRekapService
{
    private const HARI_MAP = ['Ahad' => 0, 'Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5, 'Sabtu' => 6];

    /**
     * @return Collection daftar rekap per guru untuk bulan (format "YYYY-MM") tertentu.
     */
    public function hitung(string $bulan, ?int $guruId = null): Collection
    {
        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));
        $to = Carbon::parse($tanggalSelesai);

        $guruList = Guru::with([
            'user',
            'pembelajaran' => fn ($q) => $q->where('is_aktif', true)->select('id', 'guru_id'),
            'pembelajaran.jadwal' => fn ($q) => $q->where('is_aktif', true)->select('id', 'pembelajaran_id', 'hari'),
        ])
        ->where('is_aktif', true)
        ->when($guruId, fn ($q) => $q->where('id', $guruId))
        ->get();

        // Saat semua guru ditampilkan, hanya sertakan yang punya jadwal aktif
        // agar guru tanpa jam mengajar tidak muncul di rekap JP
        if (!$guruId) {
            $guruList = $guruList->filter(
                fn ($g) => $g->pembelajaran->flatMap(fn ($p) => $p->jadwal)->isNotEmpty()
            );
        }

        $guruIds = $guruList->pluck('id');

        // Kecualikan hari libur penuh dari hitungan absensi
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // AbsensiGuru harian: hari hadir/sakit/izin/alpha per guru
        $absensiData = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('guru_id', $guruIds)
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->selectRaw('guru_id, status, COUNT(*) as jumlah')
            ->groupBy('guru_id', 'status')
            ->get()
            ->groupBy('guru_id');

        // JP per guru dari AbsensiPiket — hanya jadwal aktif agar konsisten dengan jam_terjadwal.
        // Filter DAYOFWEEK memastikan tanggal piket cocok dengan hari jadwal (cegah data salah input).
        $piketData = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereIn('pembelajaran.guru_id', $guruIds)
            ->where('pembelajaran.is_aktif', true)
            ->where('jadwal.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw('pembelajaran.guru_id as guru_id, absensi_piket.status_guru, COUNT(*) as jumlah')
            ->groupBy('pembelajaran.guru_id', 'absensi_piket.status_guru')
            ->get()
            ->groupBy('guru_id');

        // Kemunculan tiap hari-dalam-seminggu hingga hari ini (jangan hitung hari yg belum terjadi)
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();

        // Tanggal yang memiliki aktivitas piket — tanggal tanpa catatan piket sama sekali
        // dianggap libur tidak resmi dan tidak dihitung dalam jam terjadwal
        $activePiketDates = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('absensi_piket.tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->flip()->toArray();

        $firstPiket = count($activePiketDates) > 0 ? min(array_keys($activePiketDates)) : null;
        $firstAbsen = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal');
        $firstDate  = collect([$firstPiket, $firstAbsen])->filter()->sort()->first();
        $from = $firstDate ? Carbon::parse($firstDate)->startOfDay() : Carbon::parse($tanggalMulai);

        $today = Carbon::today();
        $kemunculanHari = [];
        for ($d = $from->copy(); $d->lte($effectiveTo); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            if (in_array($dateStr, $liburPenuh)) continue;
            // Hari Ahad selalu skip
            if ($d->isSunday()) continue;
            // Hari yang sudah lewat tapi tidak ada piket sama sekali → libur tidak resmi
            if ($d->lte($today) && !isset($activePiketDates[$dateStr])) continue;
            $kemunculanHari[$d->dayOfWeek] = ($kemunculanHari[$d->dayOfWeek] ?? 0) + 1;
        }

        // JP Pengganti — slot yang diisi oleh guru lain sebagai pengganti
        $piketPengganti = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->whereNotNull('absensi_piket.guru_pengganti_id')
            ->when($guruId,
                fn ($q) => $q->where('absensi_piket.guru_pengganti_id', $guruId),
                fn ($q) => $q->whereIn('absensi_piket.guru_pengganti_id', $guruIds)
            )
            ->where('jadwal.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw('absensi_piket.guru_pengganti_id as guru_id, COUNT(*) as jumlah')
            ->groupBy('absensi_piket.guru_pengganti_id')
            ->get()
            ->keyBy('guru_id');

        $rekap = $this->buildRekapGuru($guruList, $absensiData, $piketData, self::HARI_MAP, $kemunculanHari, $piketPengganti);

        // Jika tidak ada filter guru spesifik, hilangkan guru yang tidak punya
        // jam terjadwal di bulan ini (jadwal ada tapi harinya tidak terjadi bulan ini)
        if (!$guruId) {
            $rekap = $rekap->filter(fn ($r) => $r['jam_terjadwal'] > 0)->values();
        }

        return $rekap;
    }

    public function buildRekapGuru($guruList, $absensiData, $piketData, array $hariMap, array $kemunculanHari, $piketPengganti = null): Collection
    {
        return $guruList->map(function ($guru) use ($absensiData, $piketData, $hariMap, $kemunculanHari, $piketPengganti) {
            $data  = $absensiData->get($guru->id, collect());
            $hadir = (int) $data->where('status', 'Hadir')->sum('jumlah');
            $sakit = (int) $data->where('status', 'Sakit')->sum('jumlah');
            $izin  = (int) $data->where('status', 'Izin')->sum('jumlah');
            $alpha = (int) $data->where('status', 'Alpha')->sum('jumlah');
            $total = $hadir + $sakit + $izin + $alpha;

            // JP dari piket per status
            $piket          = $piketData->get($guru->id, collect());
            $jpHadir        = (int) $piket->where('status_guru', 'Hadir')->sum('jumlah');
            $jpTugasSekolah = (int) $piket->where('status_guru', 'Tugas_Sekolah')->sum('jumlah');
            $jpSakit        = (int) $piket->where('status_guru', 'Sakit')->sum('jumlah');
            $jpIzin         = (int) $piket->where('status_guru', 'Izin')->sum('jumlah');
            $jpAlpha        = (int) $piket->where('status_guru', 'Alpha')->sum('jumlah');

            // Jam terjadwal: jumlah JP dari jadwal aktif × kemunculan hari dalam bulan
            $jamTerjadwal = 0;
            foreach ($guru->pembelajaran as $p) {
                foreach ($p->jadwal as $jadwal) {
                    $dow = $hariMap[$jadwal->hari] ?? null;
                    if ($dow !== null) {
                        $jamTerjadwal += $kemunculanHari[$dow] ?? 0;
                    }
                }
            }

            // JP efektif: TS tidak dihitung mengajar maupun tidak hadir
            $jpEfektif = max(0, $jamTerjadwal - $jpTugasSekolah);

            // JP tidak hadir = komplemen dari jp_hadir (bukan jumlah S+I+A dari piket,
            // karena piket mungkin tidak merekam semua absensi — komplemen lebih akurat)
            $jpTidakHadir = max(0, $jpEfektif - $jpHadir);

            $jpPengganti = $piketPengganti
                ? (int)($piketPengganti->get($guru->id)?->jumlah ?? 0)
                : 0;

            return [
                'id'                 => $guru->id,
                'nama'               => $guru->nama_lengkap,
                'nip'                => $guru->nip ?? '-',
                'hadir'              => $hadir,
                'sakit'              => $sakit,
                'izin'               => $izin,
                'alpha'              => $alpha,
                'total'              => $total,
                'persen_hari'        => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
                'persen'             => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
                'jam_terjadwal'      => $jamTerjadwal,
                'jp_hadir'           => $jpHadir,
                'jp_pengganti'       => $jpPengganti,
                'jp_tugas_sekolah'   => $jpTugasSekolah,
                'jp_tidak_hadir'     => $jpTidakHadir,
                'jp_sakit'           => $jpSakit,
                'jp_izin'            => $jpIzin,
                'jp_alpha'           => $jpAlpha,
                'persen_mengajar'    => $jpEfektif > 0 ? min(100, round(($jpHadir / $jpEfektif) * 100, 1)) : 0,
                'persen_tidak_hadir' => $jpEfektif > 0 ? round(($jpTidakHadir / $jpEfektif) * 100, 1) : 0,
            ];
        })->values();
    }
}

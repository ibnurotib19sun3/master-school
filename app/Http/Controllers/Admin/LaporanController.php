<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\HariLibur;
use App\Models\AbsensiTatausaha;
use App\Exports\KehadiranGuruExport;
use App\Exports\KehadiranSiswaExport;
use App\Exports\KehadiranTatausahaExport;
use App\Models\Guru;
use App\Models\JurnalMengajar;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\JurnalTatausaha;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Tatausaha;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    private const MANAGEMENT_ROLES = [
        'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
        'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
        'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu',
    ];
    public function kehadiranSiswa(Request $request)
    {
        $bulan       = $request->get('bulan', now()->format('Y-m'));
        $rombelId    = $request->get('rombel_id');
        $tahunAjaranId = $request->get('tahun_ajaran_id');

        [$tahun, $bln] = explode('-', $bulan);
        $tanggalMulai  = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $query = Siswa::with('user', 'rombel')
            ->when($rombelId, fn ($q) => $q->where('rombel_id', $rombelId))
            ->where('status_siswa', 'Aktif');

        $siswaList = $query->get();

        $siswaIds = $siswaList->pluck('id');

        $absensiData = Absensi::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('siswa_id', $siswaIds)
            ->selectRaw('siswa_id, status, COUNT(*) as jumlah')
            ->groupBy('siswa_id', 'status')
            ->get()
            ->groupBy('siswa_id');

        $rekap = $siswaList->map(function ($siswa) use ($absensiData) {
            $data   = $absensiData->get($siswa->id, collect());
            $hadir  = $data->where('status', 'Hadir')->sum('jumlah');
            $sakit  = $data->where('status', 'Sakit')->sum('jumlah');
            $izin   = $data->where('status', 'Izin')->sum('jumlah');
            $alpha  = $data->where('status', 'Alpha')->sum('jumlah');
            $total  = $hadir + $sakit + $izin + $alpha;

            return [
                'id'        => $siswa->id,
                'nis'       => $siswa->nis,
                'nama'      => $siswa->user?->name ?? '-',
                'rombel'    => $siswa->rombel?->nama,
                'hadir'     => $hadir,
                'sakit'     => $sakit,
                'izin'      => $izin,
                'alpha'     => $alpha,
                'total'     => $total,
                'persen'    => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        });

        return Inertia::render('Admin/Laporan/KehadiranSiswa', [
            'rekap'       => $rekap,
            'rombel'      => Rombel::with('kelas')->where('is_aktif', true)->get(),
            'tahunAjaran' => TahunAjaran::all(),
            'filters'     => $request->only('bulan', 'rombel_id', 'tahun_ajaran_id'),
            'bulan'       => $bulan,
        ]);
    }

    public function kehadiranGuru(Request $request)
    {
        $bulan  = $request->input('bulan', now()->format('Y-m'));
        $guruId = $request->input('guru_id');

        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));
        $to   = Carbon::parse($tanggalSelesai);

        $guruList = Guru::with([
            'user',
            'pembelajaran' => fn ($q) => $q->where('is_aktif', true)->select('id', 'guru_id'),
            // Hanya jadwal aktif agar konsisten dengan piket query (yang juga difilter is_aktif)
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
        $hariMap = ['Ahad' => 0, 'Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5, 'Sabtu' => 6];
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

        // Detail per hari untuk tab Detail Harian
        $detailHarian = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->whereIn('guru_id', $guruIds)
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->with('guru.user')
            ->orderBy('tanggal')
            ->get();

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

        $rekap = $this->buildRekapGuru($guruList, $absensiData, $piketData, $hariMap, $kemunculanHari, $piketPengganti);

        // Jika tidak ada filter guru spesifik, hilangkan guru yang tidak punya
        // jam terjadwal di bulan ini (jadwal ada tapi harinya tidak terjadi bulan ini)
        if (!$guruId) {
            $rekap = $rekap->filter(fn ($r) => $r['jam_terjadwal'] > 0)->values();
        }

        return Inertia::render('Admin/Laporan/KehadiranGuru', array_merge([
            'rekap'        => $rekap,
            'detailHarian' => $detailHarian,
            'guru'         => Guru::with('user')->where('is_aktif', true)->get(),
            'filters'      => $request->only('bulan', 'guru_id'),
            'bulan'        => $bulan,
        ], $this->kopData()));
    }

    /**
     * Detail presensi piket harian per guru (JSON, untuk modal).
     */
    public function kehadiranGuruDetail(Request $request)
    {
        $guruId = $request->input('guru_id');
        $bulan  = $request->input('bulan', now()->format('Y-m'));

        if (!$guruId) {
            return response()->json([]);
        }

        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $rows = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->where('pembelajaran.guru_id', $guruId)
            ->where('pembelajaran.is_aktif', true)
            ->where('jadwal.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw(
                'absensi_piket.tanggal,
                 absensi_piket.status_guru,
                 absensi_piket.keterangan,
                 jadwal.jam_ke,
                 jadwal.jam_mulai,
                 jadwal.jam_selesai'
            )
            ->orderBy('absensi_piket.tanggal')
            ->orderBy('jadwal.jam_ke')
            ->get()
            ->groupBy('tanggal')
            ->map(fn ($slots) => $slots->values())
            ->sortKeys();

        return response()->json($rows);
    }

    private function kopData(): array
    {
        $sekolah = PengaturanSekolah::current();
        $kop     = PengaturanSurat::current();

        return [
            'sekolah' => [
                'kepala_sekolah_nama' => $sekolah->kepala_sekolah_nama,
                'nip_kepala'          => $sekolah->nip_kepala,
            ],
            'kop' => [
                'nama_instansi' => $kop->nama_instansi,
                'sub_nama'      => $kop->sub_nama,
                'yayasan_dinas' => $kop->yayasan_dinas,
                'alamat_kop'    => $kop->alamat_kop,
                'telepon_kop'   => $kop->telepon_kop,
                'website_kop'   => $kop->website_kop,
                'email_kop'     => $kop->email_kop,
                'npsn_kop'      => $kop->npsn_kop,
                'logo_url'      => $sekolah->logo_url, // logo dari PengaturanSekolah
            ],
        ];
    }

    private function buildRekapGuru($guruList, $absensiData, $piketData, array $hariMap, array $kemunculanHari, $piketPengganti = null): \Illuminate\Support\Collection
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

    public function kehadiranGuruSemester(Request $request)
    {
        $tahunAjaranList = TahunAjaran::orderByDesc('tanggal_mulai')->get();
        $taId        = $request->input('tahun_ajaran_id');
        $guruId      = $request->input('guru_id');
        $tahunAjaran = $taId
            ? $tahunAjaranList->firstWhere('id', $taId)
            : (TahunAjaran::aktif() ?? $tahunAjaranList->first());

        if (!$tahunAjaran) {
            return Inertia::render('Admin/Laporan/KehadiranGuruSemester', array_merge([
                'rekap'          => [],
                'guru'           => Guru::with('user')->where('is_aktif', true)->get(),
                'tahunAjaran'    => null,
                'tahunAjaranList'=> $tahunAjaranList,
                'filters'        => $request->only('tahun_ajaran_id', 'guru_id'),
            ], $this->kopData()));
        }

        $tanggalMulai   = $tahunAjaran->tanggal_mulai->format('Y-m-d');
        $tanggalSelesai = $tahunAjaran->tanggal_selesai->format('Y-m-d');
        $from = Carbon::parse($tanggalMulai);
        $to   = Carbon::parse($tanggalSelesai);

        $guruList = Guru::with([
            'user',
            'pembelajaran' => fn ($q) => $q->where('is_aktif', true)->select('id', 'guru_id'),
            'pembelajaran.jadwal' => fn ($q) => $q->where('is_aktif', true)->select('id', 'pembelajaran_id', 'hari'),
        ])
        ->where('is_aktif', true)
        ->when($guruId, fn ($q) => $q->where('id', $guruId))
        ->get();

        $guruIds    = $guruList->pluck('id');
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->all();

        $absensiData = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('guru_id', $guruIds)
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->selectRaw('guru_id, status, COUNT(*) as jumlah')
            ->groupBy('guru_id', 'status')->get()->groupBy('guru_id');

        $piketData = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereIn('pembelajaran.guru_id', $guruIds)
            ->where('pembelajaran.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw('pembelajaran.guru_id as guru_id, absensi_piket.status_guru, COUNT(*) as jumlah')
            ->groupBy('pembelajaran.guru_id', 'absensi_piket.status_guru')
            ->get()->groupBy('guru_id');

        $hariMap = ['Ahad' => 0, 'Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5, 'Sabtu' => 6];
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();

        $activePiketDatesSemester = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('absensi_piket.tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->flip()->toArray();
        $todaySemester = Carbon::today();

        $kemunculanHari = [];
        for ($d = $from->copy(); $d->lte($effectiveTo); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            if (in_array($dateStr, $liburPenuh)) continue;
            if ($d->isSunday()) continue;
            if ($d->lte($todaySemester) && !isset($activePiketDatesSemester[$dateStr])) continue;
            $kemunculanHari[$d->dayOfWeek] = ($kemunculanHari[$d->dayOfWeek] ?? 0) + 1;
        }

        $rekap = $this->buildRekapGuru($guruList, $absensiData, $piketData, $hariMap, $kemunculanHari);

        return Inertia::render('Admin/Laporan/KehadiranGuruSemester', array_merge([
            'rekap'          => $rekap,
            'guru'           => Guru::with('user')->where('is_aktif', true)->get(),
            'tahunAjaran'    => $tahunAjaran,
            'tahunAjaranList'=> $tahunAjaranList,
            'filters'        => $request->only('tahun_ajaran_id', 'guru_id'),
        ], $this->kopData()));
    }

    public function exportKehadiranGuruSemester(Request $request)
    {
        $taId        = $request->input('tahun_ajaran_id');
        $guruId      = $request->input('guru_id');
        $tahunAjaran = $taId ? TahunAjaran::find($taId) : TahunAjaran::aktif();

        abort_if(!$tahunAjaran, 404, 'Tahun ajaran tidak ditemukan.');

        $tanggalMulai   = $tahunAjaran->tanggal_mulai->format('Y-m-d');
        $tanggalSelesai = $tahunAjaran->tanggal_selesai->format('Y-m-d');
        $from = Carbon::parse($tanggalMulai);
        $to   = Carbon::parse($tanggalSelesai);

        $guruList = Guru::with([
            'user',
            'pembelajaran' => fn ($q) => $q->where('is_aktif', true)->select('id', 'guru_id'),
            'pembelajaran.jadwal' => fn ($q) => $q->where('is_aktif', true)->select('id', 'pembelajaran_id', 'hari'),
        ])
        ->where('is_aktif', true)
        ->when($guruId, fn ($q) => $q->where('id', $guruId))
        ->get();

        $guruIds    = $guruList->pluck('id');
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->all();

        $absensiData = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('guru_id', $guruIds)
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->selectRaw('guru_id, status, COUNT(*) as jumlah')
            ->groupBy('guru_id', 'status')->get()->groupBy('guru_id');

        $piketData = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereIn('pembelajaran.guru_id', $guruIds)
            ->where('pembelajaran.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw('pembelajaran.guru_id as guru_id, absensi_piket.status_guru, COUNT(*) as jumlah')
            ->groupBy('pembelajaran.guru_id', 'absensi_piket.status_guru')
            ->get()->groupBy('guru_id');

        $hariMap = ['Ahad' => 0, 'Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5, 'Sabtu' => 6];
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();
        $kemunculanHari = [];
        for ($d = $from->copy(); $d->lte($effectiveTo); $d->addDay()) {
            $kemunculanHari[$d->dayOfWeek] = ($kemunculanHari[$d->dayOfWeek] ?? 0) + 1;
        }

        $rekap = $this->buildRekapGuru($guruList, $absensiData, $piketData, $hariMap, $kemunculanHari);
        $label = "Smt{$tahunAjaran->semester} {$tahunAjaran->nama}";
        $fname = 'kehadiran-guru-' . preg_replace('/[^a-z0-9]+/', '-', strtolower($label)) . '.xlsx';

        return Excel::download(new KehadiranGuruExport($rekap, $label), $fname);
    }

    public function exportKehadiranGuru(Request $request)
    {
        $bulan  = $request->input('bulan', now()->format('Y-m'));
        $guruId = $request->input('guru_id');

        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));
        $to   = Carbon::parse($tanggalSelesai);

        $guruList = Guru::with([
            'user',
            'pembelajaran' => fn ($q) => $q->where('is_aktif', true)->select('id', 'guru_id'),
            'pembelajaran.jadwal' => fn ($q) => $q->where('is_aktif', true)->select('id', 'pembelajaran_id', 'hari'),
        ])
        ->where('is_aktif', true)
        ->when($guruId, fn ($q) => $q->where('id', $guruId))
        ->get();

        $guruIds    = $guruList->pluck('id');
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->all();

        $absensiData = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('guru_id', $guruIds)
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->selectRaw('guru_id, status, COUNT(*) as jumlah')
            ->groupBy('guru_id', 'status')->get()->groupBy('guru_id');

        $piketData = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])
            ->join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereIn('pembelajaran.guru_id', $guruIds)
            ->where('pembelajaran.is_aktif', true)
            ->whereRaw("DAYOFWEEK(absensi_piket.tanggal) = FIELD(jadwal.hari, 'Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")
            ->selectRaw('pembelajaran.guru_id as guru_id, absensi_piket.status_guru, COUNT(*) as jumlah')
            ->groupBy('pembelajaran.guru_id', 'absensi_piket.status_guru')
            ->get()->groupBy('guru_id');

        $hariMap = ['Ahad' => 0, 'Senin' => 1, 'Selasa' => 2, 'Rabu' => 3, 'Kamis' => 4, 'Jumat' => 5, 'Sabtu' => 6];
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();
        $firstPiket = AbsensiPiket::whereBetween('absensi_piket.tanggal', [$tanggalMulai, $tanggalSelesai])->min('absensi_piket.tanggal');
        $firstAbsen = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal');
        $firstDate  = collect([$firstPiket, $firstAbsen])->filter()->sort()->first();
        $from = $firstDate ? Carbon::parse($firstDate)->startOfDay() : Carbon::parse($tanggalMulai);
        $kemunculanHari = [];
        for ($d = $from->copy(); $d->lte($effectiveTo); $d->addDay()) {
            $kemunculanHari[$d->dayOfWeek] = ($kemunculanHari[$d->dayOfWeek] ?? 0) + 1;
        }

        $rekap = $this->buildRekapGuru($guruList, $absensiData, $piketData, $hariMap, $kemunculanHari);

        return Excel::download(new KehadiranGuruExport($rekap, $bulan), "kehadiran-guru-{$bulan}.xlsx");
    }

    public function exportKehadiranSiswa(Request $request)
    {
        $bulan    = $request->input('bulan', now()->format('Y-m'));
        $rombelId = $request->input('rombel_id');

        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $siswaList = Siswa::with('user', 'rombel')
            ->when($rombelId, fn ($q) => $q->where('rombel_id', $rombelId))
            ->where('status_siswa', 'Aktif')
            ->get();

        $siswaIds    = $siswaList->pluck('id');
        $absensiData = Absensi::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('siswa_id', $siswaIds)
            ->selectRaw('siswa_id, status, COUNT(*) as jumlah')
            ->groupBy('siswa_id', 'status')->get()->groupBy('siswa_id');

        $rekap = $siswaList->map(function ($siswa) use ($absensiData) {
            $data  = $absensiData->get($siswa->id, collect());
            $hadir = (int) $data->where('status', 'Hadir')->sum('jumlah');
            $sakit = (int) $data->where('status', 'Sakit')->sum('jumlah');
            $izin  = (int) $data->where('status', 'Izin')->sum('jumlah');
            $alpha = (int) $data->where('status', 'Alpha')->sum('jumlah');
            $total = $hadir + $sakit + $izin + $alpha;
            return [
                'nis'    => $siswa->nis,
                'nama'   => $siswa->user?->name ?? '-',
                'rombel' => $siswa->rombel?->nama ?? '-',
                'hadir'  => $hadir,
                'sakit'  => $sakit,
                'izin'   => $izin,
                'alpha'  => $alpha,
                'total'  => $total,
                'persen' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values();

        return Excel::download(new KehadiranSiswaExport($rekap, $bulan), "kehadiran-siswa-{$bulan}.xlsx");
    }

    public function exportKehadiranTatausaha(Request $request)
    {
        $bulan = $request->input('bulan', now()->format('Y-m'));
        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $tuList = Tatausaha::with('user')->where('is_aktif', true)->get();
        $tuIds  = $tuList->pluck('id');

        $absensiData = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('tatausaha_id', $tuIds)
            ->selectRaw('tatausaha_id, status, COUNT(*) as jumlah')
            ->groupBy('tatausaha_id', 'status')->get()->groupBy('tatausaha_id');

        $liburPenuhExport = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        $earliestTU = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal');
        $hkStart    = $earliestTU ? Carbon::parse($earliestTU) : Carbon::parse($tanggalMulai);
        $hkEnd      = Carbon::parse($tanggalSelesai);
        $today      = Carbon::today();
        if ($today->lt($hkEnd)) {
            $hkEnd = $today->copy();
        }
        $hariKerja = 0;
        for ($d = $hkStart->copy(); $d->lte($hkEnd); $d->addDay()) {
            if (!$d->isSunday() && !in_array($d->format('Y-m-d'), $liburPenuhExport)) {
                $hariKerja++;
            }
        }

        $rekap = $tuList->map(function ($tu) use ($absensiData, $hariKerja) {
            $data  = $absensiData->get($tu->id, collect());
            $hadir = (int) $data->where('status', 'Hadir')->sum('jumlah');
            $sakit = (int) $data->where('status', 'Sakit')->sum('jumlah');
            $izin  = (int) $data->where('status', 'Izin')->sum('jumlah');
            $alpha = (int) $data->where('status', 'Alpha')->sum('jumlah');
            $total = $hadir + $sakit + $izin + $alpha;
            return [
                'nama'       => $tu->nama_lengkap,
                'nip'        => $tu->nip ?? '-',
                'jabatan'    => $tu->jabatan ?? '-',
                'hadir'      => $hadir,
                'sakit'      => $sakit,
                'izin'       => $izin,
                'alpha'      => $alpha,
                'total'      => $total,
                'tidak_absen'=> max(0, $hariKerja - $total),
                'persen'     => $hariKerja > 0 ? round(($hadir / $hariKerja) * 100, 1) : 0,
            ];
        })->values();

        return Excel::download(new KehadiranTatausahaExport($rekap, $bulan, $hariKerja), "kehadiran-tatausaha-{$bulan}.xlsx");
    }

    public function keaktifanJurnal(Request $request)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $from        = Carbon::create($tahun, $bln, 1)->startOfDay();
        $to          = $from->copy()->endOfMonth();
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();

        // Guru aktif yang punya pembelajaran aktif + jadwal aktif
        $guruList = Guru::with('user')
            ->where('is_aktif', true)
            ->whereHas('pembelajaran', fn ($q) => $q->where('is_aktif', true)
                ->whereHas('jadwal', fn ($q2) => $q2->where('is_aktif', true))
            )
            ->get();

        // JP yang guru benar-benar HADIR (Hadir / Tugas_Sekolah) lewat piket
        // Join AbsensiPiket → Jadwal → Pembelajaran untuk dapat guru_id
        $piketHadir = AbsensiPiket::join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereBetween('absensi_piket.tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('absensi_piket.status_guru', ['Hadir'])
            ->select(
                'absensi_piket.jadwal_id',
                'absensi_piket.tanggal',
                'jadwal.pembelajaran_id',
                'pembelajaran.guru_id'
            )
            ->get();

        // Kelompokkan per guru: [(jadwal_id, pembelajaran_id, tanggal), ...]
        $piketByGuru = [];
        foreach ($piketHadir as $p) {
            $tgl = Carbon::parse($p->tanggal)->format('Y-m-d');
            $piketByGuru[$p->guru_id][] = [
                'jadwal_id'       => $p->jadwal_id,
                'pembelajaran_id' => $p->pembelajaran_id,
                'tanggal'         => $tgl,
            ];
        }

        // Jurnal terisi dalam periode: set (pembelajaran_id, tanggal, jadwal_id)
        $jurnalRows = JurnalMengajar::whereBetween('tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->select('pembelajaran_id', 'tanggal', 'jadwal_ids')
            ->get();

        $jurnalSet = [];
        foreach ($jurnalRows as $j) {
            $tgl = Carbon::parse($j->tanggal)->format('Y-m-d');
            foreach (($j->jadwal_ids ?? []) as $jid) {
                $jurnalSet[$j->pembelajaran_id][$tgl][$jid] = true;
            }
        }

        // Rekap per guru: JP Hadir sebagai penyebut, bukan JP terjadwal
        $rekap = $guruList->map(function ($guru) use ($piketByGuru, $jurnalSet) {
            $slots     = $piketByGuru[$guru->id] ?? [];
            $jamHadir  = count($slots);
            $jamTerisi = 0;

            foreach ($slots as $s) {
                if (isset($jurnalSet[$s['pembelajaran_id']][$s['tanggal']][$s['jadwal_id']])) {
                    $jamTerisi++;
                }
            }

            $jamKosong = max(0, $jamHadir - $jamTerisi);
            $persen    = $jamHadir > 0 ? round($jamTerisi / $jamHadir * 100, 1) : 0;

            return [
                'id'         => $guru->id,
                'nama'       => $guru->nama_lengkap,
                'nip'        => $guru->nip ?? '-',
                'jam_hadir'  => $jamHadir,
                'jam_terisi' => $jamTerisi,
                'jam_kosong' => $jamKosong,
                'persen'     => $persen,
            ];
        })->values();

        return Inertia::render('Admin/Laporan/KeaktifanJurnal', [
            'rekap'   => $rekap,
            'filters' => ['bulan' => $bulan],
            'bulan'   => $bulan,
        ]);
    }

    public function keaktifanJurnalDetail(Request $request, Guru $guru)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $from        = Carbon::create($tahun, $bln, 1)->startOfDay();
        $to          = $from->copy()->endOfMonth();
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();

        // Semua slot piket hadir guru ini dalam periode
        $piketSlots = AbsensiPiket::join('jadwal',      'absensi_piket.jadwal_id',     '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->join('mata_pelajaran', 'pembelajaran.mata_pelajaran_id', '=', 'mata_pelajaran.id')
            ->join('rombel', 'pembelajaran.rombel_id', '=', 'rombel.id')
            ->whereBetween('absensi_piket.tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->where('pembelajaran.guru_id', $guru->id)
            ->whereIn('absensi_piket.status_guru', ['Hadir'])
            ->select(
                'absensi_piket.tanggal',
                'absensi_piket.jadwal_id',
                'absensi_piket.status_guru',
                'jadwal.jam_ke',
                'jadwal.pembelajaran_id',
                \DB::raw('mata_pelajaran.nama as mata_pelajaran'),
                \DB::raw('rombel.nama as rombel')
            )
            ->orderBy('absensi_piket.tanggal')
            ->orderBy('jadwal.jam_ke')
            ->get();

        $pembelajaranIds = $piketSlots->pluck('pembelajaran_id')->unique()->values();

        // Jurnal untuk pembelajaran tersebut dalam periode
        $jurnalRows = JurnalMengajar::whereBetween('tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('pembelajaran_id', $pembelajaranIds)
            ->select('pembelajaran_id', 'tanggal', 'jadwal_ids', 'materi_pokok', 'pertemuan_ke')
            ->get();

        // Build lookup: [pembelajaran_id][tanggal][jadwal_id] = info
        $jurnalLookup = [];
        foreach ($jurnalRows as $j) {
            $tgl = Carbon::parse($j->tanggal)->format('Y-m-d');
            foreach (($j->jadwal_ids ?? []) as $jid) {
                $jurnalLookup[$j->pembelajaran_id][$tgl][$jid] = [
                    'materi_pokok' => $j->materi_pokok,
                    'pertemuan_ke' => $j->pertemuan_ke,
                ];
            }
        }

        $slots = $piketSlots->map(function ($p) use ($jurnalLookup) {
            $tgl    = Carbon::parse($p->tanggal)->format('Y-m-d');
            $pid    = $p->pembelajaran_id;
            $jid    = $p->jadwal_id;
            $info   = $jurnalLookup[$pid][$tgl][$jid] ?? null;
            return [
                'tanggal'       => $tgl,
                'jam_ke'        => $p->jam_ke,
                'status_guru'   => $p->status_guru,
                'mata_pelajaran'=> $p->mata_pelajaran,
                'rombel'        => $p->rombel,
                'terisi'        => $info !== null,
                'materi_pokok'  => $info['materi_pokok'] ?? null,
                'pertemuan_ke'  => $info['pertemuan_ke'] ?? null,
            ];
        });

        return Inertia::render('Admin/Laporan/KeaktifanJurnalDetail', [
            'guru'  => ['id' => $guru->id, 'nama' => $guru->nama_lengkap, 'nip' => $guru->nip ?? '-'],
            'slots' => $slots,
            'bulan' => $bulan,
        ]);
    }

    public function kehadiranTatausaha(Request $request)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        // Hitung hari kerja (Senin-Jumat): mulai dari absensi pertama tercatat,
        // tidak melebihi hari ini, agar bulan yang baru dimulai tidak merah semua
        $tuList = Tatausaha::with('user')->where('is_aktif', true)->get();
        $tuIds  = $tuList->pluck('id');

        $absensiData = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('tatausaha_id', $tuIds)
            ->selectRaw('tatausaha_id, status, COUNT(*) as jumlah')
            ->groupBy('tatausaha_id', 'status')
            ->get()
            ->groupBy('tatausaha_id');

        // Hari libur penuh (Jumat libur dan lainnya)
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // Mulai hitung dari tanggal absensi pertama agar bulan baru tidak merah semua
        $earliestTU    = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal');
        $hkStart       = $earliestTU ? Carbon::parse($earliestTU) : Carbon::parse($tanggalMulai);
        $hkEnd         = Carbon::parse($tanggalSelesai);
        $today         = Carbon::today();
        if ($today->lt($hkEnd)) {
            $hkEnd = $today->copy();
        }
        // Hitung Senin-Sabtu kecuali hari libur (Jumat jika masuk HariLibur, dsb.)
        $hariKerja = 0;
        for ($d = $hkStart->copy(); $d->lte($hkEnd); $d->addDay()) {
            if (!$d->isSunday() && !in_array($d->format('Y-m-d'), $liburPenuh)) {
                $hariKerja++;
            }
        }

        $rekap = $tuList->map(function ($tu) use ($absensiData, $hariKerja) {
            $data  = $absensiData->get($tu->id, collect());
            $hadir = $data->where('status', 'Hadir')->sum('jumlah');
            $sakit = $data->where('status', 'Sakit')->sum('jumlah');
            $izin  = $data->where('status', 'Izin')->sum('jumlah');
            $alpha = $data->where('status', 'Alpha')->sum('jumlah');
            $total = $hadir + $sakit + $izin + $alpha;

            return [
                'id'         => $tu->id,
                'nama'       => $tu->nama_lengkap,
                'nip'        => $tu->nip ?? '-',
                'jabatan'    => $tu->jabatan ?? '-',
                'hari_kerja' => $hariKerja,
                'hadir'      => $hadir,
                'sakit'      => $sakit,
                'izin'       => $izin,
                'alpha'      => $alpha,
                'total'      => $total,
                'tidak_absen'=> max(0, $hariKerja - $total),
                'persen'     => $hariKerja > 0 ? round(($hadir / $hariKerja) * 100, 1) : 0,
            ];
        });

        return Inertia::render('Admin/Laporan/KehadiranTatausaha', array_merge([
            'rekap'    => $rekap->values(),
            'filters'  => ['bulan' => $bulan],
            'bulan'    => $bulan,
            'hariKerja'=> $hariKerja,
        ], $this->kopData()));
    }

    public function keaktifanJurnalTatausaha(Request $request)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $from = Carbon::create($tahun, $bln, 1)->startOfDay();
        $to   = $from->copy()->endOfMonth();

        $tuList = Tatausaha::with('user')->where('is_aktif', true)->get();
        $tuIds  = $tuList->pluck('id');

        // Presensi Hadir per TU dalam periode
        $hadirPerTU = AbsensiTatausaha::whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
            ->whereIn('tatausaha_id', $tuIds)
            ->where('status', 'Hadir')
            ->selectRaw('tatausaha_id, COUNT(*) as jumlah')
            ->groupBy('tatausaha_id')
            ->pluck('jumlah', 'tatausaha_id');

        // Jurnal per TU dalam periode
        $jurnalPerTU = JurnalTatausaha::whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
            ->whereIn('tatausaha_id', $tuIds)
            ->selectRaw('tatausaha_id, COUNT(*) as jumlah')
            ->groupBy('tatausaha_id')
            ->pluck('jumlah', 'tatausaha_id');

        // Hitung hari kerja: mulai dari absensi pertama, tidak melebihi hari ini
        $liburPenuhJurnal = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        $earliestTU = AbsensiTatausaha::whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])->min('tanggal');
        $hkStart    = $earliestTU ? Carbon::parse($earliestTU) : $from->copy();
        $hkEnd      = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();
        $hariKerja  = 0;
        for ($d = $hkStart->copy(); $d->lte($hkEnd); $d->addDay()) {
            if (!$d->isSunday() && !in_array($d->format('Y-m-d'), $liburPenuhJurnal)) {
                $hariKerja++;
            }
        }

        $rekap = $tuList->map(function ($tu) use ($hadirPerTU, $jurnalPerTU, $hariKerja) {
            $hadirCount  = $hadirPerTU[$tu->id] ?? 0;
            $jurnalCount = $jurnalPerTU[$tu->id] ?? 0;
            $kosong      = max(0, $hadirCount - $jurnalCount);
            $persen      = $hadirCount > 0 ? round(($jurnalCount / $hadirCount) * 100, 1) : 0;

            return [
                'id'          => $tu->id,
                'nama'        => $tu->nama_lengkap,
                'nip'         => $tu->nip ?? '-',
                'jabatan'     => $tu->jabatan ?? '-',
                'hari_hadir'  => $hadirCount,
                'jurnal_terisi'  => $jurnalCount,
                'jurnal_kosong'  => $kosong,
                'persen'      => $persen,
            ];
        });

        return Inertia::render('Admin/Laporan/KeaktifanJurnalTatausaha', [
            'rekap'    => $rekap->values(),
            'filters'  => ['bulan' => $bulan],
            'bulan'    => $bulan,
            'hariKerja'=> $hariKerja,
        ]);
    }

    public function keaktifanJurnalTatausahaDetail(Request $request, Tatausaha $tatausaha)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $from        = Carbon::create($tahun, $bln, 1)->startOfDay();
        $to          = $from->copy()->endOfMonth();
        $effectiveTo = $to->gt(Carbon::today()) ? Carbon::today() : $to->copy();

        // Semua hari hadir TU dalam periode
        $hadirRows = AbsensiTatausaha::whereBetween('tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->where('tatausaha_id', $tatausaha->id)
            ->where('status', 'Hadir')
            ->orderBy('tanggal')
            ->get(['tanggal']);

        $tanggalList = $hadirRows->map(fn ($r) => Carbon::parse($r->tanggal)->format('Y-m-d'))->unique()->values();

        // Jurnal TU dalam periode
        $jurnalMap = JurnalTatausaha::whereBetween('tanggal', [$from->toDateString(), $effectiveTo->toDateString()])
            ->where('tatausaha_id', $tatausaha->id)
            ->get(['tanggal', 'kegiatan'])
            ->keyBy(fn ($j) => Carbon::parse($j->tanggal)->format('Y-m-d'));

        $slots = $tanggalList->map(fn ($tgl) => [
            'tanggal' => $tgl,
            'terisi'  => $jurnalMap->has($tgl),
            'kegiatan'=> $jurnalMap[$tgl]->kegiatan ?? null,
        ]);

        return Inertia::render('Admin/Laporan/KeaktifanJurnalTatausahaDetail', [
            'tatausaha' => ['id' => $tatausaha->id, 'nama' => $tatausaha->nama_lengkap, 'jabatan' => $tatausaha->jabatan ?? '-', 'nip' => $tatausaha->nip ?? '-'],
            'slots'     => $slots->values(),
            'bulan'     => $bulan,
        ]);
    }

    public function kehadiranManajemen(Request $request)
    {
        $bulan = $request->get('bulan', now()->format('Y-m'));
        [$tahun, $bln] = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $manajemenList = Guru::with(['user.roles'])
            ->where('is_aktif', true)
            ->whereHas('user.roles', fn ($q) => $q->whereIn('name', self::MANAGEMENT_ROLES))
            ->get();
        $guruIds = $manajemenList->pluck('id');

        // Target tetap: 20 hari kerja per bulan
        $hariKerja   = 20;
        $absensiHingga = Carbon::today()->lt(Carbon::parse($tanggalSelesai))
            ? Carbon::today()->toDateString()
            : $tanggalSelesai;

        $absensiData = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $absensiHingga])
            ->whereIn('guru_id', $guruIds)
            ->selectRaw('guru_id, status, COUNT(*) as jumlah')
            ->groupBy('guru_id', 'status')
            ->get()
            ->groupBy('guru_id');

        $jabatanPrimary = function (Guru $guru): string {
            $map = [
                'kepala_sekolah'              => 'Kepala Sekolah',
                'kepala_tatausaha'            => 'Kepala Tata Usaha',
                'wakasek_kurikulum'           => 'Wakasek Kurikulum',
                'wakasek_kesiswaan'           => 'Wakasek Kesiswaan',
                'wakasek_sarpras'             => 'Wakasek Sarpras',
                'wakasek_humas'               => 'Wakasek Humas',
                'bendahara_sekolah'           => 'Bendahara Sekolah',
                'tim_penjamin_mutu'           => 'Tim Penjamin Mutu',
                'kepala_konsentrasi_keahlian' => 'Kepala Konsentrasi Keahlian',
            ];
            foreach ($map as $role => $label) {
                if ($guru->user?->hasRole($role)) return $label;
            }
            return '-';
        };

        $rekap = $manajemenList->map(function ($guru) use ($absensiData, $hariKerja, $jabatanPrimary) {
            $data         = $absensiData->get($guru->id, collect());
            $hadir        = (int) $data->where('status', 'Hadir')->sum('jumlah');
            $tugasSekolah = (int) $data->where('status', 'Tugas_Sekolah')->sum('jumlah');
            $tidakHadir   = (int) $data->whereIn('status', ['Sakit', 'Izin', 'Alpha', 'Tidak_Hadir'])->sum('jumlah');
            $total        = $hadir + $tugasSekolah + $tidakHadir;

            return [
                'id'            => $guru->id,
                'nama'          => $guru->nama_lengkap,
                'nip'           => $guru->nip ?? '-',
                'jabatan'       => $jabatanPrimary($guru),
                'hari_kerja'    => $hariKerja,
                'hadir'         => $hadir,
                'tugas_sekolah' => $tugasSekolah,
                'tidak_hadir'   => $tidakHadir,
                'total'         => $total,
                'tidak_absen'   => max(0, $hariKerja - $total),
                'persen'        => min(100, round(($hadir + $tugasSekolah) / $hariKerja * 100, 1)),
            ];
        })->sortBy('nama')->values();

        return Inertia::render('Admin/Laporan/KehadiranManajemen', array_merge([
            'rekap'     => $rekap,
            'filters'   => ['bulan' => $bulan],
            'bulan'     => $bulan,
            'hariKerja' => $hariKerja,
        ], $this->kopData()));
    }

    public function storeAbsensiGuru(Request $request)
    {
        $data = $request->validate([
            'guru_id'    => 'required|exists:guru,id',
            'tanggal'    => 'required|date',
            'status'     => 'required|in:Hadir,Sakit,Izin,Alpha,Tugas_Sekolah',
            'jam_masuk'  => 'nullable|date_format:H:i',
            'jam_keluar' => 'nullable|date_format:H:i',
            'keterangan' => 'nullable|string',
        ]);

        AbsensiGuru::updateOrCreate(
            ['guru_id' => $data['guru_id'], 'tanggal' => $data['tanggal']],
            array_merge($data, ['dicatat_oleh' => auth()->id()])
        );

        return back()->with('success', 'Absensi guru berhasil disimpan.');
    }
}

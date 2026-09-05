<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\JurnalMengajar;
use App\Models\KpiGuru;
use App\Models\KpiIndikator;
use App\Models\KpiPengaturan;
use App\Models\KpiTatausaha;
use App\Models\TahunAjaran;
use App\Models\Tatausaha;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KpiController extends Controller
{
    public const MANAGEMENT_ROLES = [
        'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
        'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
        'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu',
    ];

    public function index(Request $request)
    {
        $this->ensureIndikator();

        // Ambil semua guru aktif lalu pisahkan per tipe
        $allGuru    = Guru::with('user.roles')->where('is_aktif', true)->orderBy('id')->get();
        $guruBiasa  = $allGuru->filter(fn ($g) => !$this->isManajemen($g))->values();
        $guruMgmt   = $allGuru->filter(fn ($g) => $this->isManajemen($g))->values();

        $tahunAjaran = TahunAjaran::all();
        $pengaturan  = KpiPengaturan::map();

        // Rekap berdasarkan tab yang diminta
        $tipe = $request->tipe ?? 'biasa';
        $rekap = KpiGuru::with(['guru.user', 'indikator'])
            ->where('tipe_guru', $tipe)
            ->when($request->bulan,   fn ($q) => $q->where('bulan', $request->bulan))
            ->when($request->guru_id, fn ($q) => $q->where('guru_id', $request->guru_id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/KPI/Index', [
            'guruBiasa'   => $guruBiasa,
            'guruMgmt'    => $guruMgmt,
            'tahunAjaran' => $tahunAjaran,
            'pengaturan'  => $pengaturan,
            'rekap'       => $rekap,
            'filters'     => $request->only('bulan', 'guru_id', 'tipe'),
        ]);
    }

    // ── Hitung per guru (JSON) ────────────────────────────────────────────────
    public function hitung(Request $request)
    {
        $request->validate([
            'guru_id' => 'required|exists:guru,id',
            'bulan'   => 'required|date_format:Y-m',
        ]);

        $guruId = (int) $request->guru_id;
        [$tahun, $bln] = explode('-', $request->bulan);
        $start = Carbon::createFromDate($tahun, $bln, 1)->startOfMonth();
        $end   = Carbon::createFromDate($tahun, $bln, 1)->endOfMonth();

        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // ── Keaktifan Guru ──────────────────────────────────────────────────
        $absensi      = AbsensiGuru::where('guru_id', $guruId)
            ->whereBetween('tanggal', [$start, $end])
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->get();
        $totalAbsensi = $absensi->count();
        $totalHadir   = $absensi->where('status', 'Hadir')->count();
        $persenGuru   = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

        // ── Keaktifan Jurnal ────────────────────────────────────────────────
        $effectiveTo = $end->gt(Carbon::today()) ? Carbon::today() : $end->copy();

        $piketSlots = AbsensiPiket::join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereBetween('absensi_piket.tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('absensi_piket.status_guru', ['Hadir', 'Tugas_Sekolah'])
            ->where('pembelajaran.guru_id', $guruId)
            ->where('pembelajaran.is_aktif', true)
            ->select('absensi_piket.jadwal_id', 'absensi_piket.tanggal', 'jadwal.pembelajaran_id')
            ->get();

        $jamHadir = $piketSlots->count();
        $pembIds  = $piketSlots->pluck('pembelajaran_id')->unique()->values()->all();

        $jurnalRows = JurnalMengajar::whereBetween('tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('pembelajaran_id', $pembIds)
            ->select('pembelajaran_id', 'tanggal', 'jadwal_ids')
            ->get();

        $jurnalSet = [];
        foreach ($jurnalRows as $j) {
            $tgl = Carbon::parse($j->tanggal)->format('Y-m-d');
            foreach (($j->jadwal_ids ?? []) as $jid) {
                $jurnalSet[$j->pembelajaran_id][$tgl][$jid] = true;
            }
        }

        $jamTerisi = 0;
        foreach ($piketSlots as $slot) {
            $tgl = Carbon::parse($slot->tanggal)->format('Y-m-d');
            if (isset($jurnalSet[$slot->pembelajaran_id][$tgl][$slot->jadwal_id])) {
                $jamTerisi++;
            }
        }

        $persenJurnal = $jamHadir > 0 ? round($jamTerisi / $jamHadir * 100, 1) : 0;

        // ── Deteksi manajemen ────────────────────────────────────────────────
        $guruModel   = Guru::with('user.roles')->find($guruId);
        $isManajemen = $this->isManajemen($guruModel);

        $persenManajemen = null;
        $detailManajemen = null;
        if ($isManajemen) {
            $hariKerja       = 20;
            $persenManajemen = min(100, round($totalHadir / $hariKerja * 100, 1));
            $detailManajemen = ['hadir' => $totalHadir, 'hari_kerja' => $hariKerja];
        }

        // ── Cek sudah disimpan ───────────────────────────────────────────────
        $existing = KpiGuru::where('guru_id', $guruId)->where('bulan', $request->bulan)->get();
        $sudahDisimpan = $existing->isNotEmpty();

        // Deteksi apakah bobot berubah sejak terakhir disimpan
        $bobotBerubah = false;
        if ($sudahDisimpan) {
            $pengaturan = KpiPengaturan::map();
            $tipe       = $isManajemen ? 'manajemen' : 'biasa';
            foreach ($existing as $row) {
                $kode    = $row->indikator?->kode;
                $newBobot = match ($kode) {
                    'KEAKTIFAN_GURU'        => $isManajemen ? ($pengaturan['MGT_GURU'] ?? 40)      : ($pengaturan['BIASA_GURU'] ?? 50),
                    'KEAKTIFAN_JURNAL'      => $isManajemen ? ($pengaturan['MGT_JURNAL'] ?? 30)    : ($pengaturan['BIASA_JURNAL'] ?? 50),
                    'KEAKTIFAN_MANAJEMEN_GURU' => $pengaturan['MGT_MANAJEMEN'] ?? 30,
                    default                 => $row->bobot_snapshot,
                };
                if (abs((float)$row->bobot_snapshot - $newBobot) > 0.01) {
                    $bobotBerubah = true;
                    break;
                }
            }
        }

        return response()->json([
            'persen_guru'      => $persenGuru,
            'persen_jurnal'    => $persenJurnal,
            'persen_manajemen' => $persenManajemen,
            'is_manajemen'     => $isManajemen,
            'detail_guru'      => ['hadir' => $totalHadir, 'total' => $totalAbsensi],
            'detail_jurnal'    => ['terisi' => $jamTerisi, 'hadir' => $jamHadir],
            'detail_manajemen' => $detailManajemen,
            'sudah_disimpan'   => $sudahDisimpan,
            'bobot_berubah'    => $bobotBerubah,
        ]);
    }

    // ── Simpan KPI ────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'guru_id'          => 'required|exists:guru,id',
            'bulan'            => 'required|date_format:Y-m',
            'tahun_ajaran_id'  => 'required|exists:tahun_ajaran,id',
            'persen_guru'      => 'required|numeric|min:0|max:100',
            'persen_jurnal'    => 'required|numeric|min:0|max:100',
            'persen_manajemen' => 'nullable|numeric|min:0|max:100',
            'catatan'          => 'nullable|string',
            'force_update'     => 'boolean',
        ]);

        $sudahAda = KpiGuru::where('guru_id', $data['guru_id'])
            ->where('bulan', $data['bulan'])
            ->exists();

        if ($sudahAda && !($data['force_update'] ?? false)) {
            return back()->withErrors(['bulan' => 'KPI sudah tersimpan. Aktifkan "Simpan Ulang" untuk menimpa.']);
        }

        $pengaturan  = KpiPengaturan::map();
        $isManajemen = isset($data['persen_manajemen']) && $data['persen_manajemen'] !== null;
        $tipeGuru    = $isManajemen ? 'manajemen' : 'biasa';

        $indikatorGuru   = KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->firstOrFail();
        $indikatorJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->firstOrFail();

        $bobotGuru   = $isManajemen ? ($pengaturan['MGT_GURU'] ?? 40) : ($pengaturan['BIASA_GURU'] ?? 50);
        $bobotJurnal = $isManajemen ? ($pengaturan['MGT_JURNAL'] ?? 30) : ($pengaturan['BIASA_JURNAL'] ?? 50);

        // Validasi total bobot = 100
        if ($isManajemen) {
            $bobotMgmt = $pengaturan['MGT_MANAJEMEN'] ?? 30;
            if (abs($bobotGuru + $bobotJurnal + $bobotMgmt - 100) > 0.01) {
                return back()->withErrors(['bobot' => 'Total bobot manajemen harus 100%.']);
            }
        } else {
            if (abs($bobotGuru + $bobotJurnal - 100) > 0.01) {
                return back()->withErrors(['bobot' => 'Total bobot guru biasa harus 100%.']);
            }
        }

        // Hapus data lama jika force_update
        if ($sudahAda && ($data['force_update'] ?? false)) {
            KpiGuru::where('guru_id', $data['guru_id'])->where('bulan', $data['bulan'])->delete();
        }

        $base = [
            'guru_id'         => $data['guru_id'],
            'tipe_guru'       => $tipeGuru,
            'bulan'           => $data['bulan'],
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'catatan'         => $data['catatan'] ?? null,
            'dinilai_oleh'    => auth()->id(),
        ];

        KpiGuru::create($base + [
            'kpi_indikator_id' => $indikatorGuru->id,
            'persen'           => $data['persen_guru'],
            'bobot_snapshot'   => $bobotGuru,
            'nilai'            => round($data['persen_guru'] * $bobotGuru / 100, 2),
        ]);

        KpiGuru::create($base + [
            'kpi_indikator_id' => $indikatorJurnal->id,
            'persen'           => $data['persen_jurnal'],
            'bobot_snapshot'   => $bobotJurnal,
            'nilai'            => round($data['persen_jurnal'] * $bobotJurnal / 100, 2),
        ]);

        if ($isManajemen) {
            $indikatorMgr = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->firstOrFail();
            KpiGuru::create($base + [
                'kpi_indikator_id' => $indikatorMgr->id,
                'persen'           => $data['persen_manajemen'],
                'bobot_snapshot'   => $pengaturan['MGT_MANAJEMEN'] ?? 30,
                'nilai'            => round($data['persen_manajemen'] * ($pengaturan['MGT_MANAJEMEN'] ?? 30) / 100, 2),
            ]);
        }

        return back()->with('success', $sudahAda ? 'KPI berhasil disimpan ulang.' : 'KPI berhasil disimpan.');
    }

    // ── Hitung batch semua guru ────────────────────────────────────────────────
    public function hitungBatch(Request $request)
    {
        $data = $request->validate([
            'bulan'           => 'required|date_format:Y-m',
            'tipe'            => 'required|in:biasa,manajemen',
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'force_update'    => 'boolean',
        ]);

        $allGuru    = Guru::with('user.roles')->where('is_aktif', true)->get();
        $guruList   = $data['tipe'] === 'manajemen'
            ? $allGuru->filter(fn ($g) => $this->isManajemen($g))
            : $allGuru->filter(fn ($g) => !$this->isManajemen($g));

        [$tahun, $bln] = explode('-', $data['bulan']);
        $start = Carbon::createFromDate($tahun, $bln, 1)->startOfMonth();
        $end   = Carbon::createFromDate($tahun, $bln, 1)->endOfMonth();

        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        $pengaturan = KpiPengaturan::map();
        $saved = 0;
        $skipped = 0;

        foreach ($guruList as $guru) {
            $sudahAda = KpiGuru::where('guru_id', $guru->id)->where('bulan', $data['bulan'])->exists();
            if ($sudahAda && !($data['force_update'] ?? false)) {
                $skipped++;
                continue;
            }

            [$persenGuru, $persenJurnal, $persenManajemen] = $this->hitungPersenGuru(
                $guru->id, $start, $end, $liburPenuh
            );

            $isManajemen = $this->isManajemen($guru);
            $tipeGuru    = $isManajemen ? 'manajemen' : 'biasa';
            $bobotGuru   = $isManajemen ? ($pengaturan['MGT_GURU'] ?? 40)   : ($pengaturan['BIASA_GURU'] ?? 50);
            $bobotJurnal = $isManajemen ? ($pengaturan['MGT_JURNAL'] ?? 30) : ($pengaturan['BIASA_JURNAL'] ?? 50);

            if ($sudahAda) {
                KpiGuru::where('guru_id', $guru->id)->where('bulan', $data['bulan'])->delete();
            }

            $base = [
                'guru_id'         => $guru->id,
                'tipe_guru'       => $tipeGuru,
                'bulan'           => $data['bulan'],
                'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                'dinilai_oleh'    => auth()->id(),
            ];

            $indGuru   = KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->first();
            $indJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->first();

            if ($indGuru) KpiGuru::create($base + [
                'kpi_indikator_id' => $indGuru->id,
                'persen'           => $persenGuru,
                'bobot_snapshot'   => $bobotGuru,
                'nilai'            => round($persenGuru * $bobotGuru / 100, 2),
            ]);

            if ($indJurnal) KpiGuru::create($base + [
                'kpi_indikator_id' => $indJurnal->id,
                'persen'           => $persenJurnal,
                'bobot_snapshot'   => $bobotJurnal,
                'nilai'            => round($persenJurnal * $bobotJurnal / 100, 2),
            ]);

            if ($isManajemen && $persenManajemen !== null) {
                $indMgr   = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->first();
                $bobotMgr = $pengaturan['MGT_MANAJEMEN'] ?? 30;
                if ($indMgr) KpiGuru::create($base + [
                    'kpi_indikator_id' => $indMgr->id,
                    'persen'           => $persenManajemen,
                    'bobot_snapshot'   => $bobotMgr,
                    'nilai'            => round($persenManajemen * $bobotMgr / 100, 2),
                ]);
            }

            $saved++;
        }

        $msg = "KPI berhasil dihitung: {$saved} guru";
        if ($skipped > 0) $msg .= ", {$skipped} dilewati (sudah ada)";
        return back()->with('success', $msg . '.');
    }

    // ── Update bobot ──────────────────────────────────────────────────────────
    public function updateBobot(Request $request)
    {
        $tipe = $request->validate(['tipe' => 'required|in:biasa,manajemen'])['tipe'];

        if ($tipe === 'biasa') {
            $data = $request->validate([
                'bobot_guru'   => 'required|numeric|min:0|max:100',
                'bobot_jurnal' => 'required|numeric|min:0|max:100',
            ]);
            if (abs($data['bobot_guru'] + $data['bobot_jurnal'] - 100) > 0.01) {
                return back()->withErrors(['bobot' => 'Total bobot Guru Biasa harus 100%.']);
            }
            KpiPengaturan::updateOrCreate(['kode' => 'BIASA_GURU'],   ['bobot' => $data['bobot_guru']]);
            KpiPengaturan::updateOrCreate(['kode' => 'BIASA_JURNAL'], ['bobot' => $data['bobot_jurnal']]);
        } else {
            $data = $request->validate([
                'bobot_guru'      => 'required|numeric|min:0|max:100',
                'bobot_jurnal'    => 'required|numeric|min:0|max:100',
                'bobot_manajemen' => 'required|numeric|min:0|max:100',
            ]);
            if (abs($data['bobot_guru'] + $data['bobot_jurnal'] + $data['bobot_manajemen'] - 100) > 0.01) {
                return back()->withErrors(['bobot' => 'Total bobot Guru Manajemen harus 100%.']);
            }
            KpiPengaturan::updateOrCreate(['kode' => 'MGT_GURU'],       ['bobot' => $data['bobot_guru']]);
            KpiPengaturan::updateOrCreate(['kode' => 'MGT_JURNAL'],     ['bobot' => $data['bobot_jurnal']]);
            KpiPengaturan::updateOrCreate(['kode' => 'MGT_MANAJEMEN'],  ['bobot' => $data['bobot_manajemen']]);
        }

        // Recalculate semua kpi_guru yang sudah disimpan dengan bobot terbaru
        if ($request->boolean('recalculate', false)) {
            $this->recalculateAllKpi($tipe);
        }

        return back()->with('success', 'Bobot KPI berhasil diperbarui.');
    }

    // ── Ranking ────────────────────────────────────────────────────────────────
    public function ranking(Request $request)
    {
        $bulan       = $request->bulan ?? now()->format('Y-m');
        $tahunAjaran = TahunAjaran::all();

        // Ranking guru: group by guru, sum nilai, sort desc
        $rankingGuru = KpiGuru::with(['guru.user'])
            ->where('bulan', $bulan)
            ->get()
            ->groupBy('guru_id')
            ->map(function ($items, $guruId) {
                $guru       = $items->first()?->guru;
                $nilaiAkhir = round($items->sum('nilai'), 2);
                $tipe       = $items->first()?->tipe_guru ?? 'biasa';
                return [
                    'guru_id'    => $guruId,
                    'nama'       => $guru?->user?->name ?? '—',
                    'tipe'       => $tipe,
                    'nilai'      => $nilaiAkhir,
                    'indikator'  => $items->map(fn ($i) => [
                        'nama'   => $i->indikator?->nama,
                        'persen' => $i->persen,
                        'bobot'  => $i->bobot_snapshot,
                        'nilai'  => $i->nilai,
                    ])->values(),
                ];
            })
            ->sortByDesc('nilai')
            ->values()
            ->map(fn ($r, $idx) => array_merge($r, ['rank' => $idx + 1]));

        // Ranking tatausaha
        $rankingTu = KpiTatausaha::with(['tatausaha.user'])
            ->where('bulan', $bulan)
            ->get()
            ->groupBy('tatausaha_id')
            ->map(function ($items, $tuId) {
                $tu         = $items->first()?->tatausaha;
                $nilaiAkhir = round($items->sum('nilai'), 2);
                return [
                    'tatausaha_id' => $tuId,
                    'nama'         => $tu?->user?->name ?? '—',
                    'nilai'        => $nilaiAkhir,
                    'indikator'    => $items->map(fn ($i) => [
                        'nama'   => $i->indikator?->nama,
                        'persen' => $i->persen,
                        'bobot'  => $i->bobot_snapshot,
                        'nilai'  => $i->nilai,
                    ])->values(),
                ];
            })
            ->sortByDesc('nilai')
            ->values()
            ->map(fn ($r, $idx) => array_merge($r, ['rank' => $idx + 1]));

        $bulanList = KpiGuru::select('bulan')->distinct()->orderByDesc('bulan')->pluck('bulan');

        // ── Ranking Akhir (rata-rata semua bulan) ──────────────────────────
        $allGuruKpi = KpiGuru::with(['guru.user'])->get()
            ->groupBy('guru_id')
            ->map(function ($rows, $guruId) {
                $guru  = $rows->first()?->guru;
                $tipe  = $rows->first()?->tipe_guru ?? 'biasa';
                // Nilai per bulan lalu rata-rata
                $byBulan   = $rows->groupBy('bulan')
                    ->map(fn ($b) => $b->sum('nilai'));
                $jumlahBulan = $byBulan->count();
                $rata        = $jumlahBulan > 0 ? round($byBulan->sum() / $jumlahBulan, 2) : 0;
                return [
                    'guru_id'    => $guruId,
                    'nama'       => $guru?->user?->name ?? '—',
                    'tipe'       => $tipe,
                    'nilai'      => $rata,
                    'jumlah_bulan' => $jumlahBulan,
                ];
            })
            ->sortByDesc('nilai')
            ->values()
            ->map(fn ($r, $idx) => array_merge($r, ['rank' => $idx + 1]));

        $allTuKpi = KpiTatausaha::with(['tatausaha.user'])->get()
            ->groupBy('tatausaha_id')
            ->map(function ($rows, $tuId) {
                $tu      = $rows->first()?->tatausaha;
                $byBulan = $rows->groupBy('bulan')->map(fn ($b) => $b->sum('nilai'));
                $jumlah  = $byBulan->count();
                $rata    = $jumlah > 0 ? round($byBulan->sum() / $jumlah, 2) : 0;
                return [
                    'tatausaha_id' => $tuId,
                    'nama'         => $tu?->user?->name ?? '—',
                    'nilai'        => $rata,
                    'jumlah_bulan' => $jumlah,
                ];
            })
            ->sortByDesc('nilai')
            ->values()
            ->map(fn ($r, $idx) => array_merge($r, ['rank' => $idx + 1]));

        return Inertia::render('Admin/KPI/Ranking', [
            'rankingGuru'     => $rankingGuru->values(),
            'rankingTu'       => $rankingTu->values(),
            'rankingAkhirGuru' => $allGuruKpi->values(),
            'rankingAkhirTu'   => $allTuKpi->values(),
            'bulan'           => $bulan,
            'bulanList'       => $bulanList,
            'tahunAjaran'     => $tahunAjaran,
        ]);
    }

    // ── Laporan untuk guru sendiri ─────────────────────────────────────────────
    public function guruIndex()
    {
        $guruId = auth()->user()->guru?->id;

        if (!$guruId) {
            return Inertia::render('Guru/KPI/Index', ['rekap' => []]);
        }

        $rekap = KpiGuru::with(['indikator', 'tahunAjaran'])
            ->where('guru_id', $guruId)
            ->orderByDesc('bulan')
            ->get()
            ->groupBy('bulan')
            ->map(function ($items, $bulan) {
                $guruItem      = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_GURU');
                $jurnalItem    = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_JURNAL');
                $manajemenItem = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_MANAJEMEN_GURU');
                return [
                    'bulan'            => $bulan,
                    'nilai_akhir'      => round($items->sum('nilai'), 2),
                    'persen_guru'      => $guruItem?->persen,
                    'persen_jurnal'    => $jurnalItem?->persen,
                    'persen_manajemen' => $manajemenItem?->persen,
                    'bobot_guru'       => $guruItem?->bobot_snapshot,
                    'bobot_jurnal'     => $jurnalItem?->bobot_snapshot,
                    'bobot_manajemen'  => $manajemenItem?->bobot_snapshot,
                    'catatan'          => $guruItem?->catatan ?? $jurnalItem?->catatan,
                    'tahun_ajaran'     => $guruItem?->tahunAjaran
                        ? ($guruItem->tahunAjaran->nama . ' – ' . $guruItem->tahunAjaran->semester)
                        : null,
                    'dinilai_pada'     => $guruItem?->updated_at,
                ];
            })
            ->values();

        return Inertia::render('Guru/KPI/Index', ['rekap' => $rekap]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    public function isManajemen(?Guru $guru): bool
    {
        if (!$guru || !$guru->user) return false;
        return collect(self::MANAGEMENT_ROLES)->some(fn ($r) => $guru->user->hasRole($r));
    }

    private function hitungPersenGuru(int $guruId, Carbon $start, Carbon $end, array $liburPenuh): array
    {
        $absensi      = AbsensiGuru::where('guru_id', $guruId)
            ->whereBetween('tanggal', [$start, $end])
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->get();
        $totalAbsensi = $absensi->count();
        $totalHadir   = $absensi->where('status', 'Hadir')->count();
        $persenGuru   = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

        $effectiveTo = $end->gt(Carbon::today()) ? Carbon::today() : $end->copy();
        $piketSlots  = AbsensiPiket::join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereBetween('absensi_piket.tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('absensi_piket.status_guru', ['Hadir', 'Tugas_Sekolah'])
            ->where('pembelajaran.guru_id', $guruId)
            ->where('pembelajaran.is_aktif', true)
            ->select('absensi_piket.jadwal_id', 'absensi_piket.tanggal', 'jadwal.pembelajaran_id')
            ->get();

        $jamHadir  = $piketSlots->count();
        $pembIds   = $piketSlots->pluck('pembelajaran_id')->unique()->values()->all();
        $jurnalRows = JurnalMengajar::whereBetween('tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('pembelajaran_id', $pembIds)
            ->select('pembelajaran_id', 'tanggal', 'jadwal_ids')
            ->get();

        $jurnalSet = [];
        foreach ($jurnalRows as $j) {
            $tgl = Carbon::parse($j->tanggal)->format('Y-m-d');
            foreach (($j->jadwal_ids ?? []) as $jid) {
                $jurnalSet[$j->pembelajaran_id][$tgl][$jid] = true;
            }
        }

        $jamTerisi = 0;
        foreach ($piketSlots as $slot) {
            $tgl = Carbon::parse($slot->tanggal)->format('Y-m-d');
            if (isset($jurnalSet[$slot->pembelajaran_id][$tgl][$slot->jadwal_id])) {
                $jamTerisi++;
            }
        }

        $persenJurnal    = $jamHadir > 0 ? round($jamTerisi / $jamHadir * 100, 1) : 0;
        $persenManajemen = min(100, round($totalHadir / 20 * 100, 1));

        return [$persenGuru, $persenJurnal, $persenManajemen];
    }

    private function recalculateAllKpi(string $tipe): void
    {
        $pengaturan = KpiPengaturan::map();
        $codeGuru   = KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->value('id');
        $codeJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->value('id');
        $codeMgmt   = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->value('id');

        if ($tipe === 'biasa') {
            if ($codeGuru) {
                KpiGuru::where('tipe_guru', 'biasa')->where('kpi_indikator_id', $codeGuru)->each(function ($r) use ($pengaturan) {
                    $b = $pengaturan['BIASA_GURU'] ?? 50;
                    $r->update(['bobot_snapshot' => $b, 'nilai' => round($r->persen * $b / 100, 2)]);
                });
            }
            if ($codeJurnal) {
                KpiGuru::where('tipe_guru', 'biasa')->where('kpi_indikator_id', $codeJurnal)->each(function ($r) use ($pengaturan) {
                    $b = $pengaturan['BIASA_JURNAL'] ?? 50;
                    $r->update(['bobot_snapshot' => $b, 'nilai' => round($r->persen * $b / 100, 2)]);
                });
            }
        } else {
            if ($codeGuru) {
                KpiGuru::where('tipe_guru', 'manajemen')->where('kpi_indikator_id', $codeGuru)->each(function ($r) use ($pengaturan) {
                    $b = $pengaturan['MGT_GURU'] ?? 40;
                    $r->update(['bobot_snapshot' => $b, 'nilai' => round($r->persen * $b / 100, 2)]);
                });
            }
            if ($codeJurnal) {
                KpiGuru::where('tipe_guru', 'manajemen')->where('kpi_indikator_id', $codeJurnal)->each(function ($r) use ($pengaturan) {
                    $b = $pengaturan['MGT_JURNAL'] ?? 30;
                    $r->update(['bobot_snapshot' => $b, 'nilai' => round($r->persen * $b / 100, 2)]);
                });
            }
            if ($codeMgmt) {
                KpiGuru::where('tipe_guru', 'manajemen')->where('kpi_indikator_id', $codeMgmt)->each(function ($r) use ($pengaturan) {
                    $b = $pengaturan['MGT_MANAJEMEN'] ?? 30;
                    $r->update(['bobot_snapshot' => $b, 'nilai' => round($r->persen * $b / 100, 2)]);
                });
            }
        }
    }

    private function ensureIndikator(): void
    {
        foreach ([
            ['kode' => 'KEAKTIFAN_GURU',          'nama' => 'Keaktifan Guru',             'kategori' => 'Kedisiplinan', 'bobot' => 50],
            ['kode' => 'KEAKTIFAN_JURNAL',         'nama' => 'Keaktifan Jurnal Mengajar',  'kategori' => 'Pengajaran',   'bobot' => 50],
            ['kode' => 'KEAKTIFAN_MANAJEMEN_GURU', 'nama' => 'Kehadiran Manajemen',        'kategori' => 'Kedisiplinan', 'bobot' => 0],
        ] as $row) {
            KpiIndikator::firstOrCreate(['kode' => $row['kode']], array_merge($row, ['target' => 100, 'is_aktif' => true, 'deskripsi' => '']));
        }
    }
}

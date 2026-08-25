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
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KpiController extends Controller
{
    private const MANAGEMENT_ROLES = [
        'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
        'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
        'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu',
    ];

    public function index(Request $request)
    {
        $this->ensureIndikator();

        $indikator = KpiIndikator::whereIn('kode', ['KEAKTIFAN_GURU', 'KEAKTIFAN_JURNAL', 'KEAKTIFAN_MANAJEMEN_GURU'])
            ->orderBy('kode')
            ->get();

        $guruList    = Guru::with('user')->where('is_aktif', true)->orderBy('id')->get();
        $tahunAjaran = TahunAjaran::all();

        $rekap = KpiGuru::with(['guru.user', 'indikator'])
            ->when($request->bulan, fn ($q) => $q->where('bulan', $request->bulan))
            ->when($request->guru_id, fn ($q) => $q->where('guru_id', $request->guru_id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/KPI/Index', [
            'indikator'   => $indikator,
            'guruList'    => $guruList,
            'tahunAjaran' => $tahunAjaran,
            'rekap'       => $rekap,
            'filters'     => $request->only('bulan', 'guru_id'),
        ]);
    }

    // Hitung presentase dua indikator untuk guru + bulan tertentu (JSON)
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

        // Preload hari libur bulan ini
        $hariLiburMap = HariLibur::whereBetween('tanggal', [$start, $end])
            ->get(['tanggal', 'jam_tertentu'])
            ->keyBy(fn ($h) => $h->tanggal->format('Y-m-d'));

        // Tanggal libur penuh (jam_tertentu = null) untuk filter absensi
        $liburPenuh = $hariLiburMap->filter(fn ($h) => $h->jam_tertentu === null)
            ->keys()->all();

        // ── Keaktifan Guru ─────────────────────────────────────
        $absensi = AbsensiGuru::where('guru_id', $guruId)
            ->whereBetween('tanggal', [$start, $end])
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->get();
        $totalAbsensi = $absensi->count();
        $totalHadir   = $absensi->where('status', 'Hadir')->count();
        $persenGuru   = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

        // ── Keaktifan Jurnal Mengajar (sinkron dengan Laporan Keaktifan Jurnal) ──
        $effectiveTo = $end->gt(Carbon::today()) ? Carbon::today() : $end->copy();

        // JP yang guru benar-benar HADIR lewat piket (Hadir / Tugas_Sekolah)
        $piketSlots = AbsensiPiket::join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
            ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
            ->whereBetween('absensi_piket.tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
            ->whereIn('absensi_piket.status_guru', ['Hadir', 'Tugas_Sekolah'])
            ->where('pembelajaran.guru_id', $guruId)
            ->where('pembelajaran.is_aktif', true)
            ->select('absensi_piket.jadwal_id', 'absensi_piket.tanggal', 'jadwal.pembelajaran_id')
            ->get();

        $jamHadir  = $piketSlots->count();
        $pembIds   = $piketSlots->pluck('pembelajaran_id')->unique()->values()->all();

        // Jurnal terisi: set (pembelajaran_id, tanggal, jadwal_id)
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

        // Cek apakah guru juga punya jabatan manajemen
        $guruModel   = Guru::with('user.roles')->find($guruId);
        $isManajemen = $guruModel?->user !== null
            && collect(self::MANAGEMENT_ROLES)->some(fn ($r) => $guruModel->user->hasRole($r));

        $persenManajemen = null;
        $detailManajemen = null;

        if ($isManajemen) {
            $hariKerja       = 20; // target tetap 20 hari kerja per bulan
            $persenManajemen = min(100, round($totalHadir / $hariKerja * 100, 1));
            $detailManajemen = ['hadir' => $totalHadir, 'hari_kerja' => $hariKerja];
        }

        $sudahDisimpan = KpiGuru::where('guru_id', $guruId)
            ->where('bulan', $request->bulan)
            ->exists();

        return response()->json([
            'persen_guru'      => $persenGuru,
            'persen_jurnal'    => $persenJurnal,
            'persen_manajemen' => $persenManajemen,
            'is_manajemen'     => $isManajemen,
            'detail_guru'      => ['hadir' => $totalHadir, 'total' => $totalAbsensi],
            'detail_jurnal'    => ['terisi' => $jamTerisi, 'hadir' => $jamHadir],
            'detail_manajemen' => $detailManajemen,
            'sudah_disimpan'   => $sudahDisimpan,
        ]);
    }

    // Simpan KPI hasil perhitungan (hanya boleh sekali per guru per bulan)
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
        ]);

        $sudahAda = KpiGuru::where('guru_id', $data['guru_id'])
            ->where('bulan', $data['bulan'])
            ->exists();

        if ($sudahAda) {
            return back()->withErrors(['bulan' => 'KPI untuk guru dan bulan ini sudah tersimpan dan tidak dapat diubah.']);
        }

        $indikatorGuru   = KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->firstOrFail();
        $indikatorJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->firstOrFail();

        foreach ([
            [$indikatorGuru,   $data['persen_guru']],
            [$indikatorJurnal, $data['persen_jurnal']],
        ] as [$ind, $persen]) {
            KpiGuru::create([
                'guru_id'          => $data['guru_id'],
                'bulan'            => $data['bulan'],
                'kpi_indikator_id' => $ind->id,
                'tahun_ajaran_id'  => $data['tahun_ajaran_id'],
                'persen'           => $persen,
                'bobot_snapshot'   => $ind->bobot,
                'nilai'            => round($persen * $ind->bobot / 100, 2),
                'catatan'          => $data['catatan'] ?? null,
                'dinilai_oleh'     => auth()->id(),
            ]);
        }

        if (isset($data['persen_manajemen']) && $data['persen_manajemen'] !== null) {
            $indikatorMgr = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->firstOrFail();
            KpiGuru::create([
                'guru_id'          => $data['guru_id'],
                'bulan'            => $data['bulan'],
                'kpi_indikator_id' => $indikatorMgr->id,
                'tahun_ajaran_id'  => $data['tahun_ajaran_id'],
                'persen'           => $data['persen_manajemen'],
                'bobot_snapshot'   => $indikatorMgr->bobot,
                'nilai'            => round($data['persen_manajemen'] * $indikatorMgr->bobot / 100, 2),
                'catatan'          => $data['catatan'] ?? null,
                'dinilai_oleh'     => auth()->id(),
            ]);
        }

        return back()->with('success', 'KPI berhasil disimpan.');
    }

    // Laporan KPI untuk guru sendiri
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
                $guruItem    = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_GURU');
                $jurnalItem  = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_JURNAL');
                $manajemanItem = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_MANAJEMEN_GURU');
                return [
                    'bulan'             => $bulan,
                    'nilai_akhir'       => round($items->sum('nilai'), 2),
                    'persen_guru'       => $guruItem?->persen,
                    'persen_jurnal'     => $jurnalItem?->persen,
                    'persen_manajemen'  => $manajemanItem?->persen,
                    'bobot_guru'        => $guruItem?->bobot_snapshot,
                    'bobot_jurnal'      => $jurnalItem?->bobot_snapshot,
                    'bobot_manajemen'   => $manajemanItem?->bobot_snapshot,
                    'catatan'           => $guruItem?->catatan ?? $jurnalItem?->catatan,
                    'tahun_ajaran'      => $guruItem?->tahunAjaran
                        ? ($guruItem->tahunAjaran->nama . ' – ' . $guruItem->tahunAjaran->semester)
                        : null,
                    'dinilai_pada'      => $guruItem?->updated_at,
                ];
            })
            ->values();

        return Inertia::render('Guru/KPI/Index', ['rekap' => $rekap]);
    }

    // Update bobot tiga indikator
    public function updateBobot(Request $request)
    {
        $data = $request->validate([
            'bobot_guru'      => 'required|numeric|min:0|max:100',
            'bobot_jurnal'    => 'required|numeric|min:0|max:100',
            'bobot_manajemen' => 'required|numeric|min:0|max:100',
        ]);

        if (abs(($data['bobot_guru'] + $data['bobot_jurnal'] + $data['bobot_manajemen']) - 100) > 0.01) {
            return back()->withErrors(['bobot' => 'Total bobot harus 100.']);
        }

        KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->update(['bobot' => $data['bobot_guru']]);
        KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->update(['bobot' => $data['bobot_jurnal']]);
        KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->update(['bobot' => $data['bobot_manajemen']]);

        return back()->with('success', 'Bobot KPI berhasil diperbarui.');
    }

    private function ensureIndikator(): void
    {
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_GURU'],
            [
                'nama'      => 'Keaktifan Guru',
                'deskripsi' => 'Persentase kehadiran guru berdasarkan data presensi harian',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_JURNAL'],
            [
                'nama'      => 'Keaktifan Jurnal Mengajar',
                'deskripsi' => 'Persentase JP terjadwal yang sudah diisi jurnal mengajar',
                'kategori'  => 'Pengajaran',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_MANAJEMEN_GURU'],
            [
                'nama'      => 'Kehadiran Manajemen',
                'deskripsi' => 'Persentase kehadiran guru dalam jabatan manajemen berdasarkan hari kerja',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 0.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
    }
}

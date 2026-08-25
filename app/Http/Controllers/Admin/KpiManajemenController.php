<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\JurnalPimpinan;
use App\Models\KpiIndikator;
use App\Models\KpiManajemen;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KpiManajemenController extends Controller
{
    private const MANAGEMENT_ROLES = [
        'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
        'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
        'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu',
    ];

    private function manajemenQuery()
    {
        return Guru::with('user')->where('is_aktif', true)
            ->whereHas('user.roles', fn ($q) => $q->whereIn('name', self::MANAGEMENT_ROLES));
    }

    public function index(Request $request)
    {
        $this->ensureIndikator();

        $indikator = KpiIndikator::whereIn('kode', ['KEAKTIFAN_MANAJEMEN', 'KEAKTIFAN_JURNAL_MANAJEMEN'])
            ->orderBy('kode')
            ->get();

        $manajemenList = $this->manajemenQuery()->orderBy('id')->get();
        $tahunAjaran   = TahunAjaran::all();

        $rekap = KpiManajemen::with(['guru.user', 'indikator'])
            ->when($request->bulan,   fn ($q) => $q->where('bulan', $request->bulan))
            ->when($request->guru_id, fn ($q) => $q->where('guru_id', $request->guru_id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/KPI/ManajemenIndex', [
            'indikator'     => $indikator,
            'manajemenList' => $manajemenList,
            'tahunAjaran'   => $tahunAjaran,
            'rekap'         => $rekap,
            'filters'       => $request->only('bulan', 'guru_id'),
        ]);
    }

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

        // Hari libur penuh
        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // Hari kerja: Mon-Sat minus hari libur penuh, tidak melebihi hari ini
        $effectiveEnd = $end->gt(Carbon::today()) ? Carbon::today() : $end->copy();
        $earliestAbsen = AbsensiGuru::where('guru_id', $guruId)
            ->whereBetween('tanggal', [$start, $end])
            ->min('tanggal');
        $hkStart = $earliestAbsen ? Carbon::parse($earliestAbsen) : $start->copy();
        $hariKerja = 0;
        for ($d = $hkStart->copy(); $d->lte($effectiveEnd); $d->addDay()) {
            if (!$d->isSunday() && !in_array($d->format('Y-m-d'), $liburPenuh)) {
                $hariKerja++;
            }
        }

        // ── Keaktifan Kehadiran ──────────────────────────────────
        $absensi = AbsensiGuru::where('guru_id', $guruId)
            ->whereBetween('tanggal', [$start, $end])
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->get();
        $totalHadir = $absensi->where('status', 'Hadir')->count();
        $persenHadir = $hariKerja > 0 ? round($totalHadir / $hariKerja * 100, 1) : 0;

        // ── Keaktifan Jurnal Pimpinan ────────────────────────────
        $guru   = Guru::with('user')->find($guruId);
        $userId = $guru?->user_id;

        $hariHadir = $absensi->where('status', 'Hadir')
            ->pluck('tanggal')
            ->map(fn ($t) => is_string($t) ? $t : $t->format('Y-m-d'))
            ->unique()
            ->all();

        $jurnalTerisi = 0;
        if ($userId && count($hariHadir) > 0) {
            $jurnalDates = JurnalPimpinan::where('user_id', $userId)
                ->whereBetween('tanggal', [$start, $end])
                ->pluck('tanggal')
                ->map(fn ($t) => is_string($t) ? $t : $t->format('Y-m-d'))
                ->unique()
                ->all();
            $jurnalTerisi = count(array_intersect($hariHadir, $jurnalDates));
        }
        $persenJurnal = $totalHadir > 0 ? round($jurnalTerisi / $totalHadir * 100, 1) : 0;

        $sudahDisimpan = KpiManajemen::where('guru_id', $guruId)
            ->where('bulan', $request->bulan)
            ->exists();

        return response()->json([
            'persen_hadir'   => $persenHadir,
            'persen_jurnal'  => $persenJurnal,
            'detail_hadir'   => ['hadir' => $totalHadir, 'hari_kerja' => $hariKerja],
            'detail_jurnal'  => ['terisi' => $jurnalTerisi, 'terjadwal' => $totalHadir],
            'sudah_disimpan' => $sudahDisimpan,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guru_id'         => 'required|exists:guru,id',
            'bulan'           => 'required|date_format:Y-m',
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'persen_hadir'    => 'required|numeric|min:0|max:100',
            'persen_jurnal'   => 'required|numeric|min:0|max:100',
            'catatan'         => 'nullable|string',
        ]);

        $sudahAda = KpiManajemen::where('guru_id', $data['guru_id'])
            ->where('bulan', $data['bulan'])
            ->exists();

        if ($sudahAda) {
            return back()->withErrors(['bulan' => 'KPI untuk manajemen dan bulan ini sudah tersimpan.']);
        }

        $indikatorHadir  = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN')->firstOrFail();
        $indikatorJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_MANAJEMEN')->firstOrFail();

        foreach ([
            [$indikatorHadir,  $data['persen_hadir']],
            [$indikatorJurnal, $data['persen_jurnal']],
        ] as [$ind, $persen]) {
            KpiManajemen::create([
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

        return back()->with('success', 'KPI Manajemen berhasil disimpan.');
    }

    public function updateBobot(Request $request)
    {
        $data = $request->validate([
            'bobot_hadir'  => 'required|numeric|min:0|max:100',
            'bobot_jurnal' => 'required|numeric|min:0|max:100',
        ]);

        if (abs(($data['bobot_hadir'] + $data['bobot_jurnal']) - 100) > 0.01) {
            return back()->withErrors(['bobot' => 'Total bobot harus 100.']);
        }

        KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN')->update(['bobot' => $data['bobot_hadir']]);
        KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_MANAJEMEN')->update(['bobot' => $data['bobot_jurnal']]);

        return back()->with('success', 'Bobot KPI berhasil diperbarui.');
    }

    public function pimpinanIndex()
    {
        $user   = auth()->user();
        $guruId = $user->guru?->id;

        if (!$guruId) {
            return Inertia::render('Pimpinan/KPI/Index', ['rekap' => [], 'jabatan' => 'Pimpinan']);
        }

        $jabatanMap = [
            'kepala_sekolah'              => 'Kepala Sekolah',
            'kepala_tatausaha'            => 'Kepala Tata Usaha',
            'wakasek_kurikulum'           => 'Wakasek Kurikulum',
            'wakasek_kesiswaan'           => 'Wakasek Kesiswaan',
            'wakasek_sarpras'             => 'Wakasek Sarana Prasarana',
            'wakasek_humas'               => 'Wakasek Humas',
            'bendahara_sekolah'           => 'Bendahara Sekolah',
            'tim_penjamin_mutu'           => 'Tim Penjamin Mutu',
            'kepala_konsentrasi_keahlian' => 'Kepala Konsentrasi Keahlian',
        ];
        $jabatan = 'Pimpinan';
        foreach ($jabatanMap as $role => $label) {
            if ($user->hasRole($role)) { $jabatan = $label; break; }
        }

        $rekap = KpiManajemen::with(['indikator', 'tahunAjaran'])
            ->where('guru_id', $guruId)
            ->orderByDesc('bulan')
            ->get()
            ->groupBy('bulan')
            ->map(function ($items, $bulan) {
                $hadirItem  = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_MANAJEMEN');
                $jurnalItem = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_JURNAL_MANAJEMEN');
                return [
                    'bulan'          => $bulan,
                    'nilai_akhir'    => round($items->sum('nilai'), 2),
                    'persen_hadir'   => $hadirItem?->persen,
                    'persen_jurnal'  => $jurnalItem?->persen,
                    'bobot_hadir'    => $hadirItem?->bobot_snapshot,
                    'bobot_jurnal'   => $jurnalItem?->bobot_snapshot,
                    'catatan'        => $hadirItem?->catatan ?? $jurnalItem?->catatan,
                    'tahun_ajaran'   => $hadirItem?->tahunAjaran
                        ? ($hadirItem->tahunAjaran->nama . ' – ' . $hadirItem->tahunAjaran->semester)
                        : null,
                    'dinilai_pada'   => $hadirItem?->updated_at,
                ];
            })
            ->values();

        return Inertia::render('Pimpinan/KPI/Index', [
            'rekap'   => $rekap,
            'jabatan' => $jabatan,
        ]);
    }

    private function ensureIndikator(): void
    {
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_MANAJEMEN'],
            [
                'nama'      => 'Keaktifan Kehadiran Manajemen',
                'deskripsi' => 'Persentase kehadiran pejabat manajemen berdasarkan hari kerja',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_JURNAL_MANAJEMEN'],
            [
                'nama'      => 'Keaktifan Jurnal Manajemen',
                'deskripsi' => 'Persentase hari hadir yang sudah diisi jurnal pimpinan',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
    }
}

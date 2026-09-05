<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiTatausaha;
use App\Models\HariLibur;
use App\Models\JurnalTatausaha;
use App\Models\KpiIndikator;
use App\Models\KpiTatausaha;
use App\Models\Tatausaha;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KpiTatausahaController extends Controller
{
    public function index(Request $request)
    {
        $this->ensureIndikator();

        $indikator = KpiIndikator::whereIn('kode', ['KEAKTIFAN_TU', 'KEAKTIFAN_JURNAL_TU'])
            ->orderBy('kode')
            ->get();

        $tuList      = Tatausaha::with('user')->where('is_aktif', true)->orderBy('id')->get();
        $tahunAjaran = TahunAjaran::all();

        $rekap = KpiTatausaha::with(['tatausaha.user', 'indikator'])
            ->when($request->bulan,       fn ($q) => $q->where('bulan', $request->bulan))
            ->when($request->tatausaha_id, fn ($q) => $q->where('tatausaha_id', $request->tatausaha_id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/KPI/TatausahaIndex', [
            'indikator'   => $indikator,
            'tuList'      => $tuList,
            'tahunAjaran' => $tahunAjaran,
            'pengaturan'  => \App\Models\KpiPengaturan::map(),
            'rekap'       => $rekap,
            'filters'     => $request->only('bulan', 'tatausaha_id'),
        ]);
    }

    public function hitung(Request $request)
    {
        $request->validate([
            'tatausaha_id' => 'required|exists:tatausaha,id',
            'bulan'        => 'required|date_format:Y-m',
        ]);

        $tuId = (int) $request->tatausaha_id;
        [$tahun, $bln] = explode('-', $request->bulan);
        $start = Carbon::createFromDate($tahun, $bln, 1)->startOfMonth();
        $end   = Carbon::createFromDate($tahun, $bln, 1)->endOfMonth();

        // Preload hari libur penuh
        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // ── Keaktifan Kehadiran ──────────────────────────────────
        $absensi      = AbsensiTatausaha::where('tatausaha_id', $tuId)
            ->whereBetween('tanggal', [$start, $end])
            ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
            ->get();
        $totalAbsensi = $absensi->count();
        $totalHadir   = $absensi->where('status', 'Hadir')->count();
        $persenTu     = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

        // ── Keaktifan Jurnal TU ──────────────────────────────────
        // Hari hadir = dasar; jurnal harus diisi pada hari yang hadir
        $hariHadir = $absensi->where('status', 'Hadir')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->unique()
            ->all();

        $jurnal = JurnalTatausaha::where('tatausaha_id', $tuId)
            ->whereBetween('tanggal', [$start, $end])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->unique()
            ->all();

        $jurnal_terisi = count(array_intersect($hariHadir, $jurnal));
        $persenJurnal  = $totalHadir > 0 ? round($jurnal_terisi / $totalHadir * 100, 1) : 0;

        $existing      = KpiTatausaha::where('tatausaha_id', $tuId)->where('bulan', $request->bulan)->get();
        $sudahDisimpan = $existing->isNotEmpty();

        $bobotBerubah = false;
        if ($sudahDisimpan) {
            $pengaturan  = \App\Models\KpiPengaturan::map();
            $bobotTu     = $pengaturan['TU_KEAKTIFAN'] ?? 50;
            $bobotJurnal = $pengaturan['TU_JURNAL'] ?? 50;
            foreach ($existing as $row) {
                $kode     = $row->indikator?->kode;
                $newBobot = match ($kode) {
                    'KEAKTIFAN_TU'       => $bobotTu,
                    'KEAKTIFAN_JURNAL_TU' => $bobotJurnal,
                    default              => $row->bobot_snapshot,
                };
                if (abs((float)$row->bobot_snapshot - $newBobot) > 0.01) {
                    $bobotBerubah = true;
                    break;
                }
            }
        }

        return response()->json([
            'persen_tu'      => $persenTu,
            'persen_jurnal'  => $persenJurnal,
            'detail_tu'      => ['hadir' => $totalHadir, 'total' => $totalAbsensi],
            'detail_jurnal'  => ['terisi' => $jurnal_terisi, 'terjadwal' => $totalHadir],
            'sudah_disimpan' => $sudahDisimpan,
            'bobot_berubah'  => $bobotBerubah,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tatausaha_id'    => 'required|exists:tatausaha,id',
            'bulan'           => 'required|date_format:Y-m',
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'persen_tu'       => 'required|numeric|min:0|max:100',
            'persen_jurnal'   => 'required|numeric|min:0|max:100',
            'catatan'         => 'nullable|string',
            'force_update'    => 'boolean',
        ]);

        $sudahAda = KpiTatausaha::where('tatausaha_id', $data['tatausaha_id'])
            ->where('bulan', $data['bulan'])
            ->exists();

        if ($sudahAda && !($data['force_update'] ?? false)) {
            return back()->withErrors(['bulan' => 'KPI sudah tersimpan. Aktifkan "Simpan Ulang" untuk menimpa.']);
        }

        $pengaturan      = \App\Models\KpiPengaturan::map();
        $bobotTu         = $pengaturan['TU_KEAKTIFAN'] ?? 50;
        $bobotJurnal     = $pengaturan['TU_JURNAL'] ?? 50;

        if (abs($bobotTu + $bobotJurnal - 100) > 0.01) {
            return back()->withErrors(['bobot' => 'Total bobot Tata Usaha harus 100%.']);
        }

        if ($sudahAda) {
            KpiTatausaha::where('tatausaha_id', $data['tatausaha_id'])->where('bulan', $data['bulan'])->delete();
        }

        $indikatorTu     = KpiIndikator::where('kode', 'KEAKTIFAN_TU')->firstOrFail();
        $indikatorJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_TU')->firstOrFail();

        foreach ([
            [$indikatorTu, $data['persen_tu'], $bobotTu],
            [$indikatorJurnal, $data['persen_jurnal'], $bobotJurnal],
        ] as [$ind, $persen, $bobot]) {
            KpiTatausaha::create([
                'tatausaha_id'     => $data['tatausaha_id'],
                'bulan'            => $data['bulan'],
                'kpi_indikator_id' => $ind->id,
                'tahun_ajaran_id'  => $data['tahun_ajaran_id'],
                'persen'           => $persen,
                'bobot_snapshot'   => $bobot,
                'nilai'            => round($persen * $bobot / 100, 2),
                'catatan'          => $data['catatan'] ?? null,
                'dinilai_oleh'     => auth()->id(),
            ]);
        }

        return back()->with('success', $sudahAda ? 'KPI berhasil disimpan ulang.' : 'KPI Tata Usaha berhasil disimpan.');
    }

    public function hitungBatch(Request $request)
    {
        $data = $request->validate([
            'bulan'           => 'required|date_format:Y-m',
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'force_update'    => 'boolean',
        ]);

        $tuList = Tatausaha::where('is_aktif', true)->get();
        [$tahun, $bln] = explode('-', $data['bulan']);
        $start = Carbon::createFromDate($tahun, $bln, 1)->startOfMonth();
        $end   = Carbon::createFromDate($tahun, $bln, 1)->endOfMonth();

        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        $pengaturan  = \App\Models\KpiPengaturan::map();
        $bobotTu     = $pengaturan['TU_KEAKTIFAN'] ?? 50;
        $bobotJurnal = $pengaturan['TU_JURNAL'] ?? 50;
        $indTu       = KpiIndikator::where('kode', 'KEAKTIFAN_TU')->first();
        $indJurnal   = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_TU')->first();

        $saved = 0; $skipped = 0;
        foreach ($tuList as $tu) {
            $sudahAda = KpiTatausaha::where('tatausaha_id', $tu->id)->where('bulan', $data['bulan'])->exists();
            if ($sudahAda && !($data['force_update'] ?? false)) { $skipped++; continue; }

            $absensi      = \App\Models\AbsensiTatausaha::where('tatausaha_id', $tu->id)
                ->whereBetween('tanggal', [$start, $end])
                ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
                ->get();
            $totalHadir   = $absensi->where('status', 'Hadir')->count();
            $totalAbsensi = $absensi->count();
            $persenTu     = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

            $hariHadir = $absensi->where('status', 'Hadir')->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->unique()->all();
            $jurnal    = \App\Models\JurnalTatausaha::where('tatausaha_id', $tu->id)->whereBetween('tanggal', [$start, $end])->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->unique()->all();
            $terisi       = count(array_intersect($hariHadir, $jurnal));
            $persenJurnal = $totalHadir > 0 ? round($terisi / $totalHadir * 100, 1) : 0;

            if ($sudahAda) KpiTatausaha::where('tatausaha_id', $tu->id)->where('bulan', $data['bulan'])->delete();

            $base = ['tatausaha_id' => $tu->id, 'bulan' => $data['bulan'], 'tahun_ajaran_id' => $data['tahun_ajaran_id'], 'dinilai_oleh' => auth()->id()];
            if ($indTu)     KpiTatausaha::create($base + ['kpi_indikator_id' => $indTu->id,     'persen' => $persenTu,     'bobot_snapshot' => $bobotTu,     'nilai' => round($persenTu * $bobotTu / 100, 2)]);
            if ($indJurnal) KpiTatausaha::create($base + ['kpi_indikator_id' => $indJurnal->id, 'persen' => $persenJurnal, 'bobot_snapshot' => $bobotJurnal, 'nilai' => round($persenJurnal * $bobotJurnal / 100, 2)]);
            $saved++;
        }

        $msg = "KPI berhasil dihitung: {$saved} tatausaha";
        if ($skipped > 0) $msg .= ", {$skipped} dilewati (sudah ada)";
        return back()->with('success', $msg . '.');
    }

    public function updateBobot(Request $request)
    {
        $data = $request->validate([
            'bobot_tu'     => 'required|numeric|min:0|max:100',
            'bobot_jurnal' => 'required|numeric|min:0|max:100',
        ]);

        if (abs(($data['bobot_tu'] + $data['bobot_jurnal']) - 100) > 0.01) {
            return back()->withErrors(['bobot' => 'Total bobot harus 100%.']);
        }

        \App\Models\KpiPengaturan::updateOrCreate(['kode' => 'TU_KEAKTIFAN'], ['bobot' => $data['bobot_tu']]);
        \App\Models\KpiPengaturan::updateOrCreate(['kode' => 'TU_JURNAL'],    ['bobot' => $data['bobot_jurnal']]);

        if ($request->boolean('recalculate', false)) {
            $codeTu     = KpiIndikator::where('kode', 'KEAKTIFAN_TU')->value('id');
            $codeJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_TU')->value('id');
            if ($codeTu)     KpiTatausaha::where('kpi_indikator_id', $codeTu)->each(fn ($r) => $r->update(['bobot_snapshot' => $data['bobot_tu'], 'nilai' => round($r->persen * $data['bobot_tu'] / 100, 2)]));
            if ($codeJurnal) KpiTatausaha::where('kpi_indikator_id', $codeJurnal)->each(fn ($r) => $r->update(['bobot_snapshot' => $data['bobot_jurnal'], 'nilai' => round($r->persen * $data['bobot_jurnal'] / 100, 2)]));
        }

        return back()->with('success', 'Bobot KPI berhasil diperbarui.');
    }

    public function tuIndex()
    {
        $tuId = auth()->user()->tatausaha?->id;

        if (!$tuId) {
            return Inertia::render('TataUsaha/KPI/Index', ['rekap' => []]);
        }

        $rekap = KpiTatausaha::with(['indikator', 'tahunAjaran'])
            ->where('tatausaha_id', $tuId)
            ->orderByDesc('bulan')
            ->get()
            ->groupBy('bulan')
            ->map(function ($items, $bulan) {
                $tuItem     = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_TU');
                $jurnalItem = $items->first(fn ($i) => $i->indikator?->kode === 'KEAKTIFAN_JURNAL_TU');
                return [
                    'bulan'         => $bulan,
                    'nilai_akhir'   => round($items->sum('nilai'), 2),
                    'persen_tu'     => $tuItem?->persen,
                    'persen_jurnal' => $jurnalItem?->persen,
                    'bobot_tu'      => $tuItem?->bobot_snapshot,
                    'bobot_jurnal'  => $jurnalItem?->bobot_snapshot,
                    'catatan'       => $tuItem?->catatan ?? $jurnalItem?->catatan,
                    'tahun_ajaran'  => $tuItem?->tahunAjaran
                        ? ($tuItem->tahunAjaran->nama . ' – ' . $tuItem->tahunAjaran->semester)
                        : null,
                    'dinilai_pada'  => $tuItem?->updated_at,
                ];
            })
            ->values();

        return Inertia::render('TataUsaha/KPI/Index', ['rekap' => $rekap]);
    }

    private function ensureIndikator(): void
    {
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_TU'],
            [
                'nama'      => 'Keaktifan Tata Usaha',
                'deskripsi' => 'Persentase kehadiran tata usaha berdasarkan data presensi harian',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
        KpiIndikator::firstOrCreate(
            ['kode' => 'KEAKTIFAN_JURNAL_TU'],
            [
                'nama'      => 'Keaktifan Jurnal Tata Usaha',
                'deskripsi' => 'Persentase hari hadir yang sudah diisi jurnal karyawan',
                'kategori'  => 'Kedisiplinan',
                'bobot'     => 50.00,
                'target'    => 100,
                'is_aktif'  => true,
            ]
        );
    }
}

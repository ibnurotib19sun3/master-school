<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\KpiController;
use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\AbsensiTatausaha;
use App\Models\Guru;
use App\Models\HariLibur;
use App\Models\JurnalMengajar;
use App\Models\JurnalTatausaha;
use App\Models\KpiGuru;
use App\Models\KpiIndikator;
use App\Models\KpiPengaturan;
use App\Models\KpiTatausaha;
use App\Models\TahunAjaran;
use App\Models\Tatausaha;
use Carbon\Carbon;
use Illuminate\Console\Command;

class HitungKpiBulanan extends Command
{
    protected $signature   = 'kpi:hitung-bulanan {--bulan= : Bulan format Y-m (default: bulan lalu)} {--force : Timpa data yang sudah ada}';
    protected $description = 'Hitung KPI otomatis untuk semua guru dan tata usaha aktif';

    public function handle(): void
    {
        $bulan = $this->option('bulan')
            ?? Carbon::now()->subMonth()->format('Y-m');

        $force = $this->option('force');

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();
        if (!$tahunAjaran) {
            $this->error('Tidak ada tahun ajaran aktif.');
            return;
        }

        $this->info("Menghitung KPI bulan: {$bulan}");
        [$tahun, $bln] = explode('-', $bulan);
        $start = Carbon::createFromDate($tahun, $bln, 1)->startOfMonth();
        $end   = Carbon::createFromDate($tahun, $bln, 1)->endOfMonth();

        $liburPenuh = HariLibur::whereBetween('tanggal', [$start, $end])
            ->whereNull('jam_tertentu')
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        $pengaturan = KpiPengaturan::map();
        $kpiCtrl    = new KpiController();

        // ── Guru ──────────────────────────────────────────────────────────
        $allGuru   = Guru::with('user.roles')->where('is_aktif', true)->get();
        $indGuru   = KpiIndikator::where('kode', 'KEAKTIFAN_GURU')->first();
        $indJurnal = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL')->first();
        $indMgmt   = KpiIndikator::where('kode', 'KEAKTIFAN_MANAJEMEN_GURU')->first();

        $guruSaved = 0; $guruSkipped = 0;
        foreach ($allGuru as $guru) {
            $sudahAda = KpiGuru::where('guru_id', $guru->id)->where('bulan', $bulan)->exists();
            if ($sudahAda && !$force) { $guruSkipped++; continue; }

            $isManajemen = $kpiCtrl->isManajemen($guru);
            $tipeGuru    = $isManajemen ? 'manajemen' : 'biasa';
            $bobotGuru   = $isManajemen ? ($pengaturan['MGT_GURU'] ?? 40)   : ($pengaturan['BIASA_GURU'] ?? 50);
            $bobotJurnal = $isManajemen ? ($pengaturan['MGT_JURNAL'] ?? 30) : ($pengaturan['BIASA_JURNAL'] ?? 50);

            // Hitung absensi
            $absensi      = AbsensiGuru::where('guru_id', $guru->id)
                ->whereBetween('tanggal', [$start, $end])
                ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
                ->get();
            $totalAbsensi = $absensi->count();
            $totalHadir   = $absensi->where('status', 'Hadir')->count();
            $persenGuru   = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

            // Hitung jurnal
            $effectiveTo = $end->gt(Carbon::today()) ? Carbon::today() : $end->copy();
            $piketSlots  = AbsensiPiket::join('jadwal', 'absensi_piket.jadwal_id', '=', 'jadwal.id')
                ->join('pembelajaran', 'jadwal.pembelajaran_id', '=', 'pembelajaran.id')
                ->whereBetween('absensi_piket.tanggal', [$start->toDateString(), $effectiveTo->toDateString()])
                ->whereIn('absensi_piket.status_guru', ['Hadir', 'Tugas_Sekolah'])
                ->where('pembelajaran.guru_id', $guru->id)
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
                if (isset($jurnalSet[$slot->pembelajaran_id][$tgl][$slot->jadwal_id])) $jamTerisi++;
            }
            $persenJurnal = $jamHadir > 0 ? round($jamTerisi / $jamHadir * 100, 1) : 0;

            if ($sudahAda) KpiGuru::where('guru_id', $guru->id)->where('bulan', $bulan)->delete();

            $base = ['guru_id' => $guru->id, 'tipe_guru' => $tipeGuru, 'bulan' => $bulan, 'tahun_ajaran_id' => $tahunAjaran->id, 'catatan' => 'Dihitung otomatis akhir bulan'];

            if ($indGuru)   KpiGuru::create($base + ['kpi_indikator_id' => $indGuru->id,   'persen' => $persenGuru,   'bobot_snapshot' => $bobotGuru,   'nilai' => round($persenGuru * $bobotGuru / 100, 2)]);
            if ($indJurnal) KpiGuru::create($base + ['kpi_indikator_id' => $indJurnal->id, 'persen' => $persenJurnal, 'bobot_snapshot' => $bobotJurnal, 'nilai' => round($persenJurnal * $bobotJurnal / 100, 2)]);

            if ($isManajemen && $indMgmt) {
                $bobotMgmt   = $pengaturan['MGT_MANAJEMEN'] ?? 30;
                $persenMgmt  = min(100, round($totalHadir / 20 * 100, 1));
                KpiGuru::create($base + ['kpi_indikator_id' => $indMgmt->id, 'persen' => $persenMgmt, 'bobot_snapshot' => $bobotMgmt, 'nilai' => round($persenMgmt * $bobotMgmt / 100, 2)]);
            }

            $guruSaved++;
        }

        $this->info("Guru: {$guruSaved} disimpan, {$guruSkipped} dilewati.");

        // ── Tatausaha ──────────────────────────────────────────────────────
        $tuList      = Tatausaha::where('is_aktif', true)->get();
        $indTu       = KpiIndikator::where('kode', 'KEAKTIFAN_TU')->first();
        $indJurnalTu = KpiIndikator::where('kode', 'KEAKTIFAN_JURNAL_TU')->first();
        $bobotTu     = $pengaturan['TU_KEAKTIFAN'] ?? 50;
        $bobotJrnlTu = $pengaturan['TU_JURNAL'] ?? 50;

        $tuSaved = 0; $tuSkipped = 0;
        foreach ($tuList as $tu) {
            $sudahAda = KpiTatausaha::where('tatausaha_id', $tu->id)->where('bulan', $bulan)->exists();
            if ($sudahAda && !$force) { $tuSkipped++; continue; }

            $absensi      = AbsensiTatausaha::where('tatausaha_id', $tu->id)
                ->whereBetween('tanggal', [$start, $end])
                ->when(count($liburPenuh) > 0, fn ($q) => $q->whereNotIn('tanggal', $liburPenuh))
                ->get();
            $totalHadir   = $absensi->where('status', 'Hadir')->count();
            $totalAbsensi = $absensi->count();
            $persenTu     = $totalAbsensi > 0 ? round($totalHadir / $totalAbsensi * 100, 1) : 0;

            $hariHadir    = $absensi->where('status', 'Hadir')->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->unique()->all();
            $jurnal       = JurnalTatausaha::where('tatausaha_id', $tu->id)->whereBetween('tanggal', [$start, $end])->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'))->unique()->all();
            $terisi       = count(array_intersect($hariHadir, $jurnal));
            $persenJurnal = $totalHadir > 0 ? round($terisi / $totalHadir * 100, 1) : 0;

            if ($sudahAda) KpiTatausaha::where('tatausaha_id', $tu->id)->where('bulan', $bulan)->delete();

            $base = ['tatausaha_id' => $tu->id, 'bulan' => $bulan, 'tahun_ajaran_id' => $tahunAjaran->id, 'catatan' => 'Dihitung otomatis akhir bulan'];
            if ($indTu)       KpiTatausaha::create($base + ['kpi_indikator_id' => $indTu->id,       'persen' => $persenTu,     'bobot_snapshot' => $bobotTu,     'nilai' => round($persenTu * $bobotTu / 100, 2)]);
            if ($indJurnalTu) KpiTatausaha::create($base + ['kpi_indikator_id' => $indJurnalTu->id, 'persen' => $persenJurnal, 'bobot_snapshot' => $bobotJrnlTu, 'nilai' => round($persenJurnal * $bobotJrnlTu / 100, 2)]);
            $tuSaved++;
        }

        $this->info("Tatausaha: {$tuSaved} disimpan, {$tuSkipped} dilewati.");
        $this->info('Selesai.');
    }
}

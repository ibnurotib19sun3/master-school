<?php

namespace App\Services;

use App\Models\AbsensiGuru;
use App\Models\AbsensiPiket;
use App\Models\AbsensiTatausaha;
use App\Models\HariLibur;
use App\Models\JurnalTatausaha;
use App\Models\PengaturanSekolah;
use App\Models\Tatausaha;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Sumber tunggal perhitungan rekap kehadiran tata usaha bulanan, dipakai oleh
 * Admin\LaporanController (halaman Kehadiran Tata Usaha) dan API eksternal
 * agar angka "% Hadir" selalu konsisten di kedua tempat.
 *
 * Rumus: persen = hadir / hari_kerja (bukan hadir / total tercatat), karena hari
 * tanpa catatan absensi sama sekali dihitung sebagai "tidak_absen" yang menurunkan persentase.
 * Hari tanpa aktivitas sama sekali otomatis dianggap libur dan tidak dihitung sebagai hari kerja.
 */
class KehadiranTatausahaRekapService
{
    public function hitung(string $bulan, ?int $tatausahaId = null): Collection
    {
        [$tahun, $bln]  = explode('-', $bulan);
        $tanggalMulai   = "{$tahun}-{$bln}-01";
        $tanggalSelesai = date('Y-m-t', strtotime($tanggalMulai));

        $tuList = Tatausaha::with('user')
            ->where('is_aktif', true)
            ->when($tatausahaId, fn ($q) => $q->where('id', $tatausahaId))
            ->get();
        $tuIds = $tuList->pluck('id');

        $absensiData = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('tatausaha_id', $tuIds)
            ->get()
            ->groupBy('tatausaha_id');

        $jurnalData = JurnalTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->whereIn('tatausaha_id', $tuIds)
            ->get()
            ->groupBy('tatausaha_id');

        // Hari libur penuh (Jumat libur dan lainnya)
        $liburPenuh = HariLibur::whereNull('jam_tertentu')
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->pluck('tanggal')
            ->map(fn ($t) => $t->format('Y-m-d'))
            ->all();

        // Mulai hitung dari tanggal absensi / jurnal pertama agar bulan baru tidak merah semua
        $earliest = collect([
            AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal'),
            JurnalTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal'),
        ])->filter()->sort()->first();

        $hkStart = $earliest ? Carbon::parse($earliest) : Carbon::parse($tanggalMulai);
        $hkEnd   = Carbon::parse($tanggalSelesai);
        $today   = Carbon::today();
        if ($today->lt($hkEnd)) {
            $hkEnd = $today->copy();
        }

        // Tanggal dengan minimal 1 catatan aktivitas TU, Jurnal TU, Piket, atau Guru.
        // Tanggal tanpa aktivitas sama sekali otomatis dianggap libur dan TIDAK dihitung sebagai hari kerja.
        $datesAbsensi = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->toArray();

        $datesJurnal = JurnalTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->toArray();

        $datesPiket = AbsensiPiket::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->toArray();

        $datesGuru = AbsensiGuru::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->distinct()->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))
            ->toArray();

        $activeDates = array_flip(array_unique(array_merge($datesAbsensi, $datesJurnal, $datesPiket, $datesGuru)));

        // Nama hari aktif sekolah ini
        $hariAktif = PengaturanSekolah::current()->hari_aktif
            ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        $namaHariByIndex = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        $hariKerja = 0;
        for ($d = $hkStart->copy(); $d->lte($hkEnd); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            if (!in_array($namaHariByIndex[$d->dayOfWeek], $hariAktif, true)) continue;
            if (in_array($dateStr, $liburPenuh)) continue;
            if ($d->lte($today) && !isset($activeDates[$dateStr])) continue;
            $hariKerja++;
        }

        return $tuList->map(function ($tu) use ($absensiData, $jurnalData, $hariKerja) {
            $staffAbsensi = $absensiData->get($tu->id, collect());
            $staffJurnal  = $jurnalData->get($tu->id, collect());

            $hadirDates = $staffAbsensi->where('status', 'Hadir')->pluck('tanggal')->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))->toArray();
            $jurnalDates = $staffJurnal->pluck('tanggal')->map(fn ($t) => Carbon::parse($t)->format('Y-m-d'))->toArray();
            $effectiveHadir = array_unique(array_merge($hadirDates, $jurnalDates));

            $hadir = count($effectiveHadir);
            $sakit = (int) $staffAbsensi->where('status', 'Sakit')->count();
            $izin  = (int) $staffAbsensi->where('status', 'Izin')->count();
            $alpha = (int) $staffAbsensi->where('status', 'Alpha')->count();
            $total = $hadir + $sakit + $izin + $alpha;

            return [
                'id'          => $tu->id,
                'nama'        => $tu->nama_lengkap,
                'nip'         => $tu->nip ?? '-',
                'nipy'        => $tu->nip ?? '-',
                'jabatan'     => $tu->jabatan ?? '-',
                'hari_kerja'  => $hariKerja,
                'hadir'       => $hadir,
                'sakit'       => $sakit,
                'izin'        => $izin,
                'alpha'       => $alpha,
                'total'       => $total,
                'tidak_absen' => max(0, $hariKerja - $total),
                'persen'      => $hariKerja > 0 ? round(($hadir / $hariKerja) * 100, 1) : 0,
            ];
        })->values();
    }
}

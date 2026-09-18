<?php

namespace App\Services;

use App\Models\AbsensiTatausaha;
use App\Models\HariLibur;
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
        $earliestTU = AbsensiTatausaha::whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])->min('tanggal');
        $hkStart    = $earliestTU ? Carbon::parse($earliestTU) : Carbon::parse($tanggalMulai);
        $hkEnd      = Carbon::parse($tanggalSelesai);
        $today      = Carbon::today();
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

        return $tuList->map(function ($tu) use ($absensiData, $hariKerja) {
            $data  = $absensiData->get($tu->id, collect());
            $hadir = (int) $data->where('status', 'Hadir')->sum('jumlah');
            $sakit = (int) $data->where('status', 'Sakit')->sum('jumlah');
            $izin  = (int) $data->where('status', 'Izin')->sum('jumlah');
            $alpha = (int) $data->where('status', 'Alpha')->sum('jumlah');
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

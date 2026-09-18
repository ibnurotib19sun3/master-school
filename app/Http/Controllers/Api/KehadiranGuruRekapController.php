<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Services\KehadiranGuruRekapService;
use Illuminate\Http\Request;

/**
 * Rekap bulanan kehadiran guru — sumber data & rumus sama persis dengan
 * kolom "% Hadir" di Admin > Laporan > Kehadiran Guru (lihat KehadiranGuruRekapService).
 */
class KehadiranGuruRekapController extends Controller
{
    public function index(Request $request, KehadiranGuruRekapService $service)
    {
        $bulan = $request->input('bulan', now()->format('Y-m'));

        $guruId = null;
        if ($request->filled('nip')) {
            $guruId = Guru::where('nip', $request->input('nip'))->value('id');
            if (!$guruId) {
                return response()->json(['bulan' => $bulan, 'data' => []]);
            }
        }

        $rekap = $service->hitung($bulan, $guruId);

        return response()->json([
            'bulan' => $bulan,
            'data'  => $rekap,
        ]);
    }
}

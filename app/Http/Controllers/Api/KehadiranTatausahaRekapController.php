<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tatausaha;
use App\Services\KehadiranTatausahaRekapService;
use Illuminate\Http\Request;

/**
 * Rekap bulanan kehadiran tata usaha — sumber data & rumus sama persis dengan
 * kolom "% Hadir" di Admin > Laporan > Kehadiran Tata Usaha (lihat KehadiranTatausahaRekapService).
 */
class KehadiranTatausahaRekapController extends Controller
{
    public function index(Request $request, KehadiranTatausahaRekapService $service)
    {
        $bulan = $request->input('bulan', now()->format('Y-m'));

        $tatausahaId = null;
        $nip = $request->input('nip', $request->input('nipy'));
        if ($nip) {
            $tatausahaId = Tatausaha::where('nip', $nip)->value('id');
            if (!$tatausahaId) {
                return response()->json(['bulan' => $bulan, 'data' => []]);
            }
        }

        $rekap = $service->hitung($bulan, $tatausahaId);

        return response()->json([
            'bulan' => $bulan,
            'data'  => $rekap,
        ]);
    }
}

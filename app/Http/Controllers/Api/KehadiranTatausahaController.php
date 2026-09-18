<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiTatausaha;
use Illuminate\Http\Request;

class KehadiranTatausahaController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100) ?: 25;

        $query = AbsensiTatausaha::query()->with('tatausaha.user:id,name');

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->input('tanggal'));
        } elseif ($request->filled('tanggal_awal') || $request->filled('tanggal_akhir')) {
            $awal  = $request->input('tanggal_awal', $request->input('tanggal_akhir'));
            $akhir = $request->input('tanggal_akhir', $request->input('tanggal_awal'));
            $query->whereBetween('tanggal', [$awal, $akhir]);
        } else {
            $query->whereDate('tanggal', now()->toDateString());
        }

        // "nip" / "nipy" merujuk ke kolom nip pada tabel tatausaha (NIPY = Nomor Induk Pegawai Yayasan).
        $nip = $request->input('nip', $request->input('nipy'));
        if ($nip) {
            $query->whereHas('tatausaha', fn ($q) => $q->where('nip', $nip));
        } elseif ($request->filled('tatausaha_id')) {
            $query->where('tatausaha_id', $request->input('tatausaha_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $data = $query->orderByDesc('tanggal')->paginate($perPage)->withQueryString();

        $data->getCollection()->transform(fn (AbsensiTatausaha $a) => [
            'id'              => $a->id,
            'tatausaha_id'    => $a->tatausaha_id,
            'nipy'            => $a->tatausaha?->nip,
            'nama_tatausaha'  => $a->tatausaha?->nama_lengkap,
            'tanggal'         => $a->tanggal->format('Y-m-d'),
            'status'          => $a->status,
            'keterangan'      => $a->keterangan,
        ]);

        return response()->json($data);
    }
}

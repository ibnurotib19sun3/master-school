<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use Illuminate\Http\Request;

class KehadiranGuruController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100) ?: 25;

        $query = AbsensiGuru::query()->with('guru.user:id,name');

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->input('tanggal'));
        } elseif ($request->filled('tanggal_awal') || $request->filled('tanggal_akhir')) {
            $awal  = $request->input('tanggal_awal', $request->input('tanggal_akhir'));
            $akhir = $request->input('tanggal_akhir', $request->input('tanggal_awal'));
            $query->whereBetween('tanggal', [$awal, $akhir]);
        } else {
            $query->whereDate('tanggal', now()->toDateString());
        }

        if ($request->filled('nip')) {
            $query->whereHas('guru', fn ($q) => $q->where('nip', $request->input('nip')));
        } elseif ($request->filled('guru_id')) {
            $query->where('guru_id', $request->input('guru_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $data = $query->orderByDesc('tanggal')->paginate($perPage)->withQueryString();

        $data->getCollection()->transform(fn (AbsensiGuru $a) => [
            'id'         => $a->id,
            'guru_id'    => $a->guru_id,
            'nip'        => $a->guru?->nip,
            'nama_guru'  => $a->guru?->nama_lengkap,
            'tanggal'    => $a->tanggal->format('Y-m-d'),
            'status'     => $a->status,
            'jam_masuk'  => $a->jam_masuk,
            'jam_keluar' => $a->jam_keluar,
            'keterangan' => $a->keterangan,
        ]);

        return response()->json($data);
    }
}

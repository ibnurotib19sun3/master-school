<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiPiket;
use Illuminate\Http\Request;

/**
 * Kehadiran guru per jam pelajaran (JP) — bersumber dari absensi piket/BK,
 * berbeda granularitas dengan /api/v1/kehadiran-guru yang berbasis harian.
 */
class KehadiranGuruJpController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100) ?: 25;

        $query = AbsensiPiket::query()->with([
            'jadwal.pembelajaran.guru',
            'jadwal.pembelajaran.mataPelajaran:id,nama',
            'jadwal.pembelajaran.rombel:id,nama',
            'guruPengganti',
        ]);

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
            $nip = $request->input('nip');
            $query->whereHas('jadwal.pembelajaran.guru', fn ($q) => $q->where('nip', $nip));
        }

        if ($request->filled('status')) {
            $query->where('status_guru', $request->input('status'));
        }

        $data = $query->orderByDesc('tanggal')->orderBy('id')->paginate($perPage)->withQueryString();

        $data->getCollection()->transform(function (AbsensiPiket $a) {
            $guru = $a->jadwal?->pembelajaran?->guru;

            return [
                'id'              => $a->id,
                'nip'             => $guru?->nip,
                'nama_guru'       => $guru?->nama_lengkap,
                'tanggal'         => $a->tanggal->format('Y-m-d'),
                'jam_ke'          => $a->jadwal?->jam_ke,
                'mata_pelajaran'  => $a->jadwal?->pembelajaran?->mataPelajaran?->nama,
                'rombel'          => $a->jadwal?->pembelajaran?->rombel?->nama,
                'status_guru'     => $a->status_guru,
                'guru_pengganti'  => $a->guruPengganti?->nama_lengkap,
                'keterangan'      => $a->keterangan,
            ];
        });

        return response()->json($data);
    }
}

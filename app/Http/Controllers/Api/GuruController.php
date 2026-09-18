<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use Illuminate\Http\Request;

class GuruController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100) ?: 25;

        $query = Guru::query()->with('user:id,name,email');

        if ($request->filled('is_aktif')) {
            $query->where('is_aktif', $request->boolean('is_aktif'));
        } else {
            $query->where('is_aktif', true);
        }

        if ($request->filled('jabatan')) {
            $query->whereJsonContains('jabatan', $request->input('jabatan'));
        }

        if ($request->filled('nip')) {
            $query->where('nip', $request->input('nip'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('nip', 'like', "%{$s}%")
                    ->orWhere('nuptk', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$s}%"));
            });
        }

        $gurus = $query->orderBy('id')->paginate($perPage)->withQueryString();

        $gurus->getCollection()->transform(fn (Guru $g) => [
            'id'                  => $g->id,
            'nip'                 => $g->nip,
            'nuptk'               => $g->nuptk,
            'nama'                => $g->user?->name,
            'gelar_depan'         => $g->gelar_depan,
            'gelar_belakang'      => $g->gelar_belakang,
            'nama_lengkap'        => $g->nama_lengkap,
            'email'               => $g->user?->email,
            'jabatan'             => $g->jabatan,
            'status_kepegawaian'  => $g->status_kepegawaian,
            'pendidikan_terakhir' => $g->pendidikan_terakhir,
            'bidang_studi'        => $g->bidang_studi,
            'tanggal_masuk'       => $g->tanggal_masuk?->format('Y-m-d'),
            'nomor_wa'            => $g->nomor_wa,
            'is_aktif'            => $g->is_aktif,
        ]);

        return response()->json($gurus);
    }
}

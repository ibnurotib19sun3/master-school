<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tatausaha;
use Illuminate\Http\Request;

class TatausahaController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100) ?: 25;

        $query = Tatausaha::query()->with('user:id,name,email');

        if ($request->filled('is_aktif')) {
            $query->where('is_aktif', $request->boolean('is_aktif'));
        } else {
            $query->where('is_aktif', true);
        }

        // Kolom "nip" di tabel tatausaha adalah NIPY (Nomor Induk Pegawai Yayasan) untuk staf non-guru.
        $nip = $request->input('nip', $request->input('nipy'));
        if ($nip) {
            $query->where('nip', $nip);
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('nip', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$s}%"));
            });
        }

        $list = $query->orderBy('id')->paginate($perPage)->withQueryString();

        $list->getCollection()->transform(fn (Tatausaha $t) => [
            'id'                  => $t->id,
            'nip'                 => $t->nip,
            'nipy'                => $t->nip,
            'nama'                => $t->user?->name,
            'gelar_depan'         => $t->gelar_depan,
            'gelar_belakang'      => $t->gelar_belakang,
            'nama_lengkap'        => $t->nama_lengkap,
            'email'               => $t->user?->email,
            'jabatan'             => $t->jabatan,
            'status_kepegawaian'  => $t->status_kepegawaian,
            'pendidikan_terakhir' => $t->pendidikan_terakhir,
            'tanggal_masuk'       => $t->tanggal_masuk?->format('Y-m-d'),
            'nomor_wa'            => $t->nomor_wa,
            'is_aktif'            => $t->is_aktif,
        ]);

        return response()->json($list);
    }
}

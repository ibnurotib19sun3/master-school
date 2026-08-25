<?php

namespace App\Http\Controllers;

use App\Models\BukuTamu;
use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\PengaturanSekolah;
use App\Models\Tatausaha;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BukuTamuController extends Controller
{
    public function index()
    {
        $mapelById = MataPelajaran::pluck('nama', 'id')->all();

        $guru = Guru::with('user')
            ->where('is_aktif', true)
            ->get()
            ->map(fn ($g) => [
                'key'     => 'guru_' . $g->id,
                'id'      => $g->id,
                'tipe'    => 'guru',
                'nama'    => $g->nama_lengkap,
                'jabatan' => array_values(array_filter(array_merge(
                    $g->jabatan ?? [],
                    !empty($g->bidang_studi)
                        ? ['Guru ' . implode(', ', array_filter(array_map(fn ($id) => $mapelById[$id] ?? null, (array) $g->bidang_studi)))]
                        : [],
                ))),
                'avatar'  => $g->user?->avatar_url ?? null,
            ]);

        $tatausaha = Tatausaha::with('user')
            ->where('is_aktif', true)
            ->get()
            ->map(fn ($tu) => [
                'key'     => 'tu_' . $tu->id,
                'id'      => $tu->id,
                'tipe'    => 'tatausaha',
                'nama'    => trim(($tu->gelar_depan ? $tu->gelar_depan . ' ' : '') . $tu->user?->name . ($tu->gelar_belakang ? ', ' . $tu->gelar_belakang : '')),
                'jabatan' => $tu->jabatan ? [$tu->jabatan] : ['Tata Usaha'],
                'avatar'  => $tu->user?->avatar_url ?? null,
            ]);

        $staf = $guru->concat($tatausaha)->values();

        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Public/BukuTamu', [
            'staf'        => $staf,
            'namaSekolah' => $sekolah->nama_sekolah ?? 'Nama Sekolah',
            'logoSekolah' => $sekolah->logo_url,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_tamu'           => 'required|string|max:100',
            'instansi'            => 'nullable|string|max:100',
            'nomor_hp'            => 'nullable|string|max:20',
            'keperluan'           => 'required|string|max:500',
            'yang_dituju_tipe'    => 'required|in:guru,tatausaha,lainnya',
            'yang_dituju_id'      => 'nullable|integer',
            'yang_dituju_nama'    => 'required|string|max:100',
            'yang_dituju_jabatan' => 'nullable|string|max:100',
        ]);

        BukuTamu::create(array_merge($data, [
            'tanggal'   => now()->toDateString(),
            'jam_masuk' => now()->format('H:i:s'),
            'status'    => 'menunggu',
        ]));

        return back()->with('success', 'Terima kasih! Data kunjungan Anda telah tercatat.');
    }
}

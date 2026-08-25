<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuatSuratController extends Controller
{
    public function index()
    {
        $sekolah = PengaturanSekolah::current();

        // Saran nomor urut berikutnya
        $count  = SuratKeluar::whereYear('tgl_keluar', now()->year)->count();
        $nextNo = str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        return Inertia::render('TataUsaha/Surat/BuatSurat', [
            'sekolah' => array_merge(
                $sekolah->only([
                    'nama_sekolah', 'yayasan_dinas', 'npsn', 'alamat', 'kecamatan', 'kota',
                    'telepon', 'email_sekolah', 'website', 'kepala_sekolah_nama', 'nip_kepala',
                ]),
                ['logo_url' => $sekolah->logo_url]
            ),
            'today'  => now()->toDateString(),
            'nextNo' => $nextNo,
        ]);
    }

    public function simpan(Request $request)
    {
        $data = $request->validate([
            'nomor_surat' => 'required|string|max:100',
            'perihal'     => 'required|string|max:255',
            'tujuan'      => 'required|string|max:255',
            'tgl_surat'   => 'required|date',
            'tgl_keluar'  => 'required|date',
            'kategori'    => 'required|string|max:100',
            'status'      => 'required|in:Draft,Terkirim',
            'keterangan'  => 'nullable|string',
        ]);

        SuratKeluar::create([...$data, 'dibuat_oleh' => auth()->id()]);
        return redirect('/tatausaha/surat-keluar')->with('success', 'Surat berhasil disimpan ke arsip surat keluar.');
    }
}

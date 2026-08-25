<?php

namespace App\Http\Controllers;

use App\Models\PengaturanSekolah;
use App\Models\SuratMasuk;
use Inertia\Inertia;

class SuratMasukVerifikasiController extends Controller
{
    public function index(string $kode)
    {
        $surat = SuratMasuk::with('pembuat:id,name')
            ->where('kode_ref', $kode)
            ->first();

        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Public/VerifikasiSuratMasuk', [
            'kode'        => $kode,
            'valid'       => (bool) $surat,
            'surat'       => $surat ? [
                'nomor_surat'  => $surat->nomor_surat,
                'perihal'      => $surat->perihal,
                'pengirim'     => $surat->pengirim,
                'tgl_surat'    => $surat->tgl_surat?->translatedFormat('d F Y'),
                'tgl_diterima' => $surat->tgl_diterima?->translatedFormat('d F Y'),
                'kategori'     => $surat->kategori,
                'disposisi'    => $surat->disposisi,
                'keterangan'   => $surat->keterangan,
                'file_url'     => $surat->file_url,
                'dibuat_oleh'  => $surat->pembuat?->name,
            ] : null,
            'namaSekolah' => $sekolah->nama_sekolah ?? 'Nama Sekolah',
            'logoSekolah' => $sekolah->logo_url,
        ]);
    }
}

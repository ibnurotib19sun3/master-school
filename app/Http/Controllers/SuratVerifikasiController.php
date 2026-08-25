<?php

namespace App\Http\Controllers;

use App\Models\PengaturanSekolah;
use App\Models\SuratKeluar;
use Inertia\Inertia;

class SuratVerifikasiController extends Controller
{
    public function index(string $kode)
    {
        $surat = SuratKeluar::with(['pembuat:id,name', 'ttePenandatangan:id,name'])
            ->where('kode_tte', $kode)
            ->first();

        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Public/VerifikasiSurat', [
            'kode'   => $kode,
            'valid'  => (bool) $surat,
            'surat'  => $surat ? [
                'nomor_surat'   => $surat->nomor_surat,
                'perihal'       => $surat->perihal,
                'tujuan'        => $surat->tujuan,
                'tgl_surat'     => $surat->tgl_surat?->translatedFormat('d F Y'),
                'tgl_keluar'    => $surat->tgl_keluar?->translatedFormat('d F Y'),
                'kategori'      => $surat->kategori,
                'status'        => $surat->status,
                'keterangan'    => $surat->keterangan,
                'file_url'      => $surat->file_url,
                'tte_at'        => $surat->tte_at?->translatedFormat('d F Y, H:i'),
                'tte_oleh_nama' => $surat->ttePenandatangan?->name,
                'dibuat_oleh'   => $surat->pembuat?->name,
            ] : null,
            'namaSekolah' => $sekolah->nama_sekolah ?? 'Nama Sekolah',
            'logoSekolah' => $sekolah->logo_url,
        ]);
    }
}

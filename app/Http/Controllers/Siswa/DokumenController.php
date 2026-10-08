<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\DokumenJenis;
use App\Models\DokumenSiswa;
use Inertia\Inertia;

class DokumenController extends Controller
{
    public function index()
    {
        $siswa = auth()->user()->siswa;
        abort_if(!$siswa, 403);

        $jenisList = DokumenJenis::where('is_aktif', true)->orderBy('urutan')->orderBy('nama')->get();
        $dokumen   = DokumenSiswa::where('siswa_id', $siswa->id)->get()->keyBy('dokumen_jenis_id');

        return Inertia::render('Siswa/Dokumen/Index', [
            'jenisList' => $jenisList,
            'dokumen'   => $dokumen,
        ]);
    }
}

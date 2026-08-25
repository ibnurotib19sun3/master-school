<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KodeDepartemen;
use App\Models\KodeJenisSurat;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengaturanSuratController extends Controller
{
    public function index()
    {
        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Admin/PengaturanSurat/Index', [
            'pengaturan'      => PengaturanSurat::current(),
            'sekolah'         => array_merge(
                $sekolah->only([
                    'nama_sekolah', 'yayasan_dinas', 'npsn', 'alamat', 'kecamatan', 'kota',
                    'telepon', 'email_sekolah', 'website', 'kepala_sekolah_nama', 'nip_kepala',
                ]),
                ['logo_url' => $sekolah->logo_url]
            ),
            'kode_departemen' => KodeDepartemen::orderBy('urutan')->get(),
            'kode_jenis'      => KodeJenisSurat::orderBy('urutan')->get(),
        ]);
    }

    public function updateKop(Request $request)
    {
        $data = $request->validate([
            'nama_instansi' => 'nullable|string|max:200',
            'sub_nama'      => 'nullable|string|max:200',
            'yayasan_dinas' => 'nullable|string|max:200',
            'alamat_kop'    => 'nullable|string',
            'telepon_kop'   => 'nullable|string|max:50',
            'website_kop'   => 'nullable|string|max:200',
            'email_kop'     => 'nullable|email|max:200',
            'npsn_kop'      => 'nullable|string|max:20',
        ]);
        PengaturanSurat::current()->update($data);
        return back()->with('success', 'KOP surat berhasil disimpan.');
    }

    public function updateFormat(Request $request)
    {
        $data = $request->validate([
            'separator'       => 'required|string|max:5',
            'prefix_kode'     => 'nullable|string|max:100',
            'format_bagian'   => 'required|array|min:1',
            'format_bagian.*' => 'string|in:prefix,seq,kode_jenis,kode_dept,kode_jenis_dept,kode_dept_jenis,bulan_romawi,tahun',
        ]);
        PengaturanSurat::current()->update($data);
        return back()->with('success', 'Format nomor surat berhasil disimpan.');
    }

    /* ── Kode Departemen ── */
    public function storeDept(Request $request)
    {
        $data   = $request->validate(['nama' => 'required|string|max:100', 'kode' => 'required|string|max:20']);
        $urutan = (int) KodeDepartemen::max('urutan') + 1;
        KodeDepartemen::create([...$data, 'urutan' => $urutan]);
        return back()->with('success', 'Kode departemen ditambahkan.');
    }

    public function updateDept(Request $request, KodeDepartemen $dept)
    {
        $dept->update($request->validate([
            'nama'  => 'required|string|max:100',
            'kode'  => 'required|string|max:20',
            'aktif' => 'boolean',
        ]));
        return back()->with('success', 'Kode departemen diperbarui.');
    }

    public function destroyDept(KodeDepartemen $dept)
    {
        $dept->delete();
        return back()->with('success', 'Kode departemen dihapus.');
    }

    /* ── Kode Jenis Surat ── */
    public function storeJenis(Request $request)
    {
        $data   = $request->validate(['nama' => 'required|string|max:100', 'kode' => 'required|string|max:20']);
        $urutan = (int) KodeJenisSurat::max('urutan') + 1;
        KodeJenisSurat::create([...$data, 'urutan' => $urutan]);
        return back()->with('success', 'Kode jenis surat ditambahkan.');
    }

    public function updateJenis(Request $request, KodeJenisSurat $jenis)
    {
        $jenis->update($request->validate([
            'nama'  => 'required|string|max:100',
            'kode'  => 'required|string|max:20',
            'aktif' => 'boolean',
        ]));
        return back()->with('success', 'Kode jenis surat diperbarui.');
    }

    public function destroyJenis(KodeJenisSurat $jenis)
    {
        $jenis->delete();
        return back()->with('success', 'Kode jenis surat dihapus.');
    }
}

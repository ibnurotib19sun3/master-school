<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\KodeDepartemen;
use App\Models\KodeJenisSurat;
use App\Models\PengaturanSurat;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SuratKeluarController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratKeluar::with('pembuat:id,name')
            ->when($request->search,   fn ($q) => $q
                ->where('nomor_surat', 'like', "%{$request->search}%")
                ->orWhere('perihal',   'like', "%{$request->search}%")
                ->orWhere('tujuan',    'like', "%{$request->search}%"))
            ->when($request->status,   fn ($q) => $q->where('status',   $request->status))
            ->when($request->kategori, fn ($q) => $q->where('kategori', $request->kategori))
            ->when($request->tahun,    fn ($q) => $q->whereYear('tgl_keluar', $request->tahun))
            ->latest('tgl_keluar');

        $ps = PengaturanSurat::current();

        return Inertia::render('TataUsaha/Surat/KeluarIndex', [
            'surat'          => $query->paginate(20)->withQueryString(),
            'filters'        => $request->only('search', 'status', 'kategori', 'tahun'),
            'kode_departemen'=> KodeDepartemen::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'kode_jenis'     => KodeJenisSurat::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'format_nomor'   => [
                'separator'    => $ps->separator,
                'format_bagian'=> $ps->format_bagian,
                'prefix_kode'  => $ps->prefix_kode,
            ],
            'next_seq'       => SuratKeluar::whereYear('tgl_keluar', now()->year)->count() + 1,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_surat' => 'required|string|max:150',
            'perihal'     => 'nullable|string|max:255',
            'tujuan'      => 'nullable|string|max:255',
            'tgl_surat'   => 'required|date',
            'tgl_keluar'  => 'required|date',
            'kategori'    => 'required|string|max:100',
            'status'      => 'required|in:Draft,Terkirim',
            'keterangan'  => 'nullable|string',
            'file_surat'  => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            $data['file_surat'] = $request->file('file_surat')->store('surat/keluar', 'public');
        }

        SuratKeluar::create([...$data, 'dibuat_oleh' => auth()->id()]);
        return back()->with('success', 'Surat keluar berhasil disimpan.');
    }

    public function update(Request $request, SuratKeluar $suratKeluar)
    {
        $data = $request->validate([
            'nomor_surat' => 'required|string|max:150',
            'perihal'     => 'nullable|string|max:255',
            'tujuan'      => 'nullable|string|max:255',
            'tgl_surat'   => 'required|date',
            'tgl_keluar'  => 'required|date',
            'kategori'    => 'required|string|max:100',
            'status'      => 'required|in:Draft,Terkirim',
            'keterangan'  => 'nullable|string',
            'file_surat'  => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            if ($suratKeluar->file_surat) Storage::disk('public')->delete($suratKeluar->file_surat);
            $data['file_surat'] = $request->file('file_surat')->store('surat/keluar', 'public');
        } else {
            unset($data['file_surat']);
        }

        $suratKeluar->update($data);
        return back()->with('success', 'Surat keluar berhasil diperbarui.');
    }

    public function destroy(SuratKeluar $suratKeluar)
    {
        if ($suratKeluar->file_surat) Storage::disk('public')->delete($suratKeluar->file_surat);
        $suratKeluar->delete();
        return back()->with('success', 'Surat keluar berhasil dihapus.');
    }
}

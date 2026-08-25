<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use App\Models\SuratMasuk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SuratMasukController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratMasuk::with('pembuat:id,name')
            ->when($request->search, fn ($q) => $q
                ->where('nomor_surat', 'like', "%{$request->search}%")
                ->orWhere('perihal', 'like', "%{$request->search}%")
                ->orWhere('pengirim', 'like', "%{$request->search}%"))
            ->when($request->disposisi, fn ($q) => $q->where('disposisi', $request->disposisi))
            ->when($request->kategori,  fn ($q) => $q->where('kategori', $request->kategori))
            ->when($request->tahun,     fn ($q) => $q->whereYear('tgl_diterima', $request->tahun))
            ->latest('tgl_diterima');

        $sekolah = PengaturanSekolah::current();

        return Inertia::render('TataUsaha/Surat/MasukIndex', [
            'surat'        => $query->paginate(20)->withQueryString()->through(fn ($s) => [
                'id'           => $s->id,
                'nomor_surat'  => $s->nomor_surat,
                'perihal'      => $s->perihal,
                'pengirim'     => $s->pengirim,
                'tgl_surat'    => $s->tgl_surat?->toDateString(),
                'tgl_diterima' => $s->tgl_diterima?->toDateString(),
                'kategori'     => $s->kategori,
                'disposisi'    => $s->disposisi,
                'keterangan'   => $s->keterangan,
                'file_surat'   => $s->file_surat,
                'file_url'     => $s->file_url,
                'kode_ref'     => $s->kode_ref,
                'verifikasi_url' => $s->kode_ref ? route('surat-masuk.verifikasi', $s->kode_ref) : null,
                'dibuat_oleh'  => $s->pembuat?->name,
            ]),
            'filters'      => $request->only('search', 'disposisi', 'kategori', 'tahun'),
            'namaSekolah'  => $sekolah->nama_sekolah ?? 'Nama Sekolah',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_surat'  => 'required|string|max:100',
            'perihal'      => 'required|string|max:255',
            'pengirim'     => 'required|string|max:255',
            'tgl_surat'    => 'required|date',
            'tgl_diterima' => 'required|date',
            'kategori'     => 'required|string|max:100',
            'disposisi'    => 'required|in:Diarsip,Diproses,Diteruskan',
            'keterangan'   => 'nullable|string',
            'file_surat'   => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            $data['file_surat'] = $request->file('file_surat')->store('surat/masuk', 'public');
        }

        SuratMasuk::create([...$data, 'dibuat_oleh' => auth()->id(), 'kode_ref' => $this->generateKode()]);
        return back()->with('success', 'Surat masuk berhasil disimpan.');
    }

    public function update(Request $request, SuratMasuk $suratMasuk)
    {
        $data = $request->validate([
            'nomor_surat'  => 'required|string|max:100',
            'perihal'      => 'required|string|max:255',
            'pengirim'     => 'required|string|max:255',
            'tgl_surat'    => 'required|date',
            'tgl_diterima' => 'required|date',
            'kategori'     => 'required|string|max:100',
            'disposisi'    => 'required|in:Diarsip,Diproses,Diteruskan',
            'keterangan'   => 'nullable|string',
            'file_surat'   => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            if ($suratMasuk->file_surat) Storage::disk('public')->delete($suratMasuk->file_surat);
            $data['file_surat'] = $request->file('file_surat')->store('surat/masuk', 'public');
        } else {
            unset($data['file_surat']);
        }

        $suratMasuk->update($data);
        return back()->with('success', 'Surat masuk berhasil diperbarui.');
    }

    public function destroy(SuratMasuk $suratMasuk)
    {
        if ($suratMasuk->file_surat) Storage::disk('public')->delete($suratMasuk->file_surat);
        $suratMasuk->delete();
        return back()->with('success', 'Surat masuk berhasil dihapus.');
    }

    public function generateQr(SuratMasuk $suratMasuk)
    {
        if (! $suratMasuk->kode_ref) {
            $suratMasuk->update(['kode_ref' => $this->generateKode()]);
        }
        return back()->with('success', 'QR code berhasil dibuat.');
    }

    private function generateKode(): string
    {
        do {
            $kode = strtoupper(Str::random(6) . '-' . Str::random(6) . '-' . Str::random(4));
        } while (SuratMasuk::where('kode_ref', $kode)->exists());

        return $kode;
    }
}

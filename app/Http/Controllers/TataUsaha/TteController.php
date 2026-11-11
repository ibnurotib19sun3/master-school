<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\KodeDepartemen;
use App\Models\KodeJenisSurat;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TteController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratKeluar::with(['pembuat:id,name', 'ttePenandatangan:id,name'])
            ->when($request->search, fn ($q) => $q
                ->where('nomor_surat', 'like', "%{$request->search}%")
                ->orWhere('perihal',   'like', "%{$request->search}%")
                ->orWhere('tujuan',    'like', "%{$request->search}%"))
            ->when($request->status_tte, function ($q) use ($request) {
                if ($request->status_tte === 'sudah') $q->whereNotNull('kode_tte');
                if ($request->status_tte === 'belum') $q->whereNull('kode_tte');
            })
            ->when($request->tahun, fn ($q) => $q->whereYear('tgl_keluar', $request->tahun))
            ->latest('tgl_keluar');

        $surat = $query->paginate(20)->withQueryString();

        return Inertia::render('TataUsaha/Surat/TteIndex', [
            'surat'   => $surat->through(fn ($s) => $this->mapSurat($s)),
            'filters' => $request->only('search', 'status_tte', 'tahun'),
        ]);
    }

    public function tandatangani(SuratKeluar $suratKeluar)
    {
        $user = auth()->user();
        if (! $user->hasRole('kepala_sekolah')) {
            abort(403, 'Hanya Kepala Sekolah yang dapat menandatangani surat secara elektronik.');
        }

        if ($suratKeluar->kode_tte) {
            return back()->withErrors(['tte' => 'Surat ini sudah ditandatangani.']);
        }

        $kode = strtoupper(Str::random(6) . '-' . Str::random(6) . '-' . Str::random(4));

        $suratKeluar->update([
            'kode_tte' => $kode,
            'tte_at'   => now(),
            'tte_oleh' => auth()->id(),
        ]);

        return back()->with('success', 'Surat berhasil ditandatangani secara elektronik.');
    }

    public function batalTte(SuratKeluar $suratKeluar)
    {
        if ($suratKeluar->file_tte) {
            Storage::disk('public')->delete($suratKeluar->file_tte);
        }

        $suratKeluar->update([
            'kode_tte' => null,
            'tte_at'   => null,
            'tte_oleh' => null,
            'file_tte' => null,
        ]);

        return back()->with('success', 'TTE berhasil dibatalkan.');
    }

    public function simpanDokumenTte(Request $request, SuratKeluar $suratKeluar)
    {
        $request->validate([
            'file_tte' => 'required|file|mimes:pdf|max:25600',
        ]);

        if ($suratKeluar->file_tte) {
            Storage::disk('public')->delete($suratKeluar->file_tte);
        }

        $path = $request->file('file_tte')->store('surat/tte', 'public');
        $suratKeluar->update(['file_tte' => $path]);

        return response()->json([
            'success'      => true,
            'message'      => 'Dokumen hasil TTE berhasil disimpan.',
            'file_tte_url' => '/storage/' . $path,
        ]);
    }

    private function mapSurat(SuratKeluar $s): array
    {
        return [
            'id'              => $s->id,
            'nomor_surat'     => $s->nomor_surat,
            'perihal'         => $s->perihal,
            'tujuan'          => $s->tujuan,
            'tgl_surat'       => $s->tgl_surat?->toDateString(),
            'tgl_keluar'      => $s->tgl_keluar?->toDateString(),
            'kategori'        => $s->kategori,
            'status'          => $s->status,
            'file_url'        => $s->file_url,
            'file_tte_url'    => $s->file_tte_url,
            'kode_tte'        => $s->kode_tte,
            'tte_at'          => $s->tte_at?->format('d/m/Y H:i'),
            'tte_oleh_nama'   => $s->ttePenandatangan?->name,
            'verifikasi_url'  => $s->kode_tte ? route('surat.verifikasi', $s->kode_tte) : null,
        ];
    }
}

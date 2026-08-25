<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\PengumpulanItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PengumpulanController extends Controller
{
    public function index()
    {
        $guruId = auth()->user()->guru?->id;

        if (!$guruId) {
            return Inertia::render('Guru/Pengumpulan/Index', ['items' => []]);
        }

        $items = PengumpulanItem::with([
            'pengumpulan:id,judul,deskripsi,batas_waktu,is_aktif',
            'pembelajaran.mataPelajaran:id,nama',
            'pembelajaran.rombel:id,nama',
        ])
        ->whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $guruId))
        ->whereHas('pengumpulan', fn ($q) => $q->where('is_aktif', true))
        ->get()
        ->map(function ($item) {
            $batas        = $item->pengumpulan?->batas_waktu;
            $item->status = !$item->file_path
                ? (now() > $batas ? 'Terlambat' : 'Belum')
                : ($item->tgl_upload <= $batas ? 'Tepat Waktu' : 'Terlambat');
            return $item;
        })
        ->sortBy(fn ($item) => $item->pengumpulan?->batas_waktu)
        ->values();

        return Inertia::render('Guru/Pengumpulan/Index', ['items' => $items]);
    }

    public function upload(Request $request, PengumpulanItem $item)
    {
        $guruId = auth()->user()->guru?->id;

        // Pastikan item milik guru ini
        abort_if($item->pembelajaran?->guru_id !== $guruId, 403);

        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip|max:20480',
        ]);

        if ($item->file_path) {
            Storage::disk('public')->delete($item->file_path);
        }

        $item->load('pembelajaran.mataPelajaran', 'pembelajaran.rombel', 'pembelajaran.guru.user');

        $slug = fn (string $s) => preg_replace('/[^a-z0-9]+/', '_', strtolower($s));

        $guruNama   = $item->pembelajaran?->guru?->user?->name ?? 'guru';
        $mapelNama  = $item->pembelajaran?->mataPelajaran?->nama ?? 'mapel';
        $rombelNama = $item->pembelajaran?->rombel?->nama ?? 'kelas';
        $ext        = strtolower($request->file('file')->getClientOriginalExtension());
        $timestamp  = now()->format('Ymd_His');
        $filename   = $slug($guruNama) . '_' . $slug($mapelNama) . '_' . $slug($rombelNama) . '_' . $timestamp . '.' . $ext;

        $item->update([
            'file_path'  => $request->file('file')->storeAs('pengumpulan', $filename, 'public'),
            'tgl_upload' => now(),
        ]);

        return back()->with('success', 'File berhasil diunggah.');
    }

    public function deleteFile(PengumpulanItem $item)
    {
        $guruId = auth()->user()->guru?->id;
        abort_if($item->pembelajaran?->guru_id !== $guruId, 403);

        if ($item->file_path) {
            Storage::disk('public')->delete($item->file_path);
            $item->update(['file_path' => null, 'tgl_upload' => null]);
        }

        return back()->with('success', 'File berhasil dihapus.');
    }
}

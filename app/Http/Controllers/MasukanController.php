<?php

namespace App\Http\Controllers;

use App\Models\Masukan;
use App\Models\MasukanBalasan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasukanController extends Controller
{
    /** Semua user terautentikasi bisa kirim masukan */
    public function store(Request $request)
    {
        $request->validate([
            'kategori' => 'required|in:Saran,Bug/Error,Pertanyaan,Lainnya',
            'judul'    => 'required|string|max:200',
            'isi'      => 'required|string|max:2000',
        ]);

        Masukan::create([
            'user_id'  => auth()->id(),
            'kategori' => $request->kategori,
            'judul'    => $request->judul,
            'isi'      => $request->isi,
            'status'   => 'Baru',
        ]);

        return back()->with('success', 'Masukan berhasil dikirim. Terima kasih!');
    }

    /** Semua user: riwayat masukan milik sendiri */
    public function riwayat()
    {
        $masukan = Masukan::with(['balasan.user:id,name'])
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate(20);

        $counts = [
            'total'           => Masukan::where('user_id', auth()->id())->count(),
            'menunggu'        => Masukan::where('user_id', auth()->id())->where('status', 'Baru')->count(),
            'diproses'        => Masukan::where('user_id', auth()->id())->where('status', 'Dibaca')->count(),
            'ditindaklanjuti' => Masukan::where('user_id', auth()->id())->where('status', 'Ditindaklanjuti')->count(),
        ];

        return Inertia::render('Masukan/Riwayat', compact('masukan', 'counts'));
    }

    /** User: tambah balasan ke masukan milik sendiri */
    public function storeBalasan(Request $request, Masukan $masukan)
    {
        if ($masukan->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'isi' => 'required|string|max:1000',
        ]);

        $masukan->balasan()->create([
            'user_id'  => auth()->id(),
            'isi'      => $request->isi,
            'is_admin' => false,
        ]);

        return back()->with('success', 'Balasan berhasil dikirim.');
    }

    /** Super admin: daftar semua masukan */
    public function index(Request $request)
    {
        $masukan = Masukan::with(['user:id,name,email', 'balasan.user:id,name'])
            ->when($request->kategori, fn ($q) => $q->where('kategori', $request->kategori))
            ->when($request->status,   fn ($q) => $q->where('status',   $request->status))
            ->when($request->search,   fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('judul', 'like', "%{$request->search}%")
                   ->orWhere('isi',   'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $counts = [
            'total'            => Masukan::count(),
            'baru'             => Masukan::where('status', 'Baru')->count(),
            'dibaca'           => Masukan::where('status', 'Dibaca')->count(),
            'ditindaklanjuti'  => Masukan::where('status', 'Ditindaklanjuti')->count(),
        ];

        return Inertia::render('Admin/Masukan/Index', [
            'masukan' => $masukan,
            'counts'  => $counts,
            'filters' => $request->only('kategori', 'status', 'search'),
        ]);
    }

    /** Super admin: ubah status & kirim balasan ke thread */
    public function updateStatus(Request $request, Masukan $masukan)
    {
        $request->validate([
            'status'        => 'required|in:Baru,Dibaca,Ditindaklanjuti',
            'catatan_admin' => 'nullable|string|max:1000',
        ]);

        $masukan->update(['status' => $request->status]);

        if ($request->filled('catatan_admin')) {
            $masukan->balasan()->create([
                'user_id'  => auth()->id(),
                'isi'      => $request->catatan_admin,
                'is_admin' => true,
            ]);

            // Keep catatan_admin for backward compat
            $masukan->update(['catatan_admin' => $request->catatan_admin]);
        }

        return back()->with('success', 'Status masukan diperbarui.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PesanPopup;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PesanPopupController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/PesanPopup/Index', [
            'pesan' => PesanPopup::with('pembuat:id,name')
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'judul'        => 'required|string|max:255',
            'isi'          => 'required|string',
            'tipe'         => 'required|in:info,peringatan,sukses',
            'is_aktif'     => 'boolean',
            'mulai_pada'   => 'nullable|date',
            'selesai_pada' => 'nullable|date|after_or_equal:mulai_pada',
        ]);

        PesanPopup::create([...$data, 'dibuat_oleh' => auth()->id()]);
        return back()->with('success', 'Pesan popup berhasil dibuat.');
    }

    public function update(Request $request, PesanPopup $pesanPopup)
    {
        $data = $request->validate([
            'judul'        => 'required|string|max:255',
            'isi'          => 'required|string',
            'tipe'         => 'required|in:info,peringatan,sukses',
            'is_aktif'     => 'boolean',
            'mulai_pada'   => 'nullable|date',
            'selesai_pada' => 'nullable|date|after_or_equal:mulai_pada',
        ]);

        $pesanPopup->update($data);
        return back()->with('success', 'Pesan popup berhasil diperbarui.');
    }

    public function destroy(PesanPopup $pesanPopup)
    {
        $pesanPopup->delete();
        return back()->with('success', 'Pesan popup berhasil dihapus.');
    }
}

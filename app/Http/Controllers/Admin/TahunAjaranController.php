<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/TahunAjaran/Index', [
            'tahunAjaran' => TahunAjaran::latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama'            => 'required|string',
            'semester'        => 'required|in:Ganjil,Genap',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'is_aktif'        => 'boolean',
        ]);

        if (!empty($data['is_aktif'])) {
            TahunAjaran::query()->update(['is_aktif' => false]);
        }

        TahunAjaran::create($data);
        return back()->with('success', 'Tahun ajaran berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $data = $request->validate([
            'nama'            => 'required|string',
            'semester'        => 'required|in:Ganjil,Genap',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'is_aktif'        => 'boolean',
        ]);

        if (!empty($data['is_aktif'])) {
            TahunAjaran::where('id', '!=', $tahunAjaran->id)->update(['is_aktif' => false]);
        }

        $tahunAjaran->update($data);
        return back()->with('success', 'Tahun ajaran berhasil diperbarui.');
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        $tahunAjaran->delete();
        return back()->with('success', 'Tahun ajaran berhasil dihapus.');
    }
}

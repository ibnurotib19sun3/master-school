<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BukuTamu;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BukuTamuAdminController extends Controller
{
    public function index(Request $request)
    {
        $tanggal = $request->tanggal ?? now()->toDateString();

        $tamu = BukuTamu::whereDate('tanggal', $tanggal)
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('nama_tamu', 'like', "%{$request->search}%")
                      ->orWhere('yang_dituju_nama', 'like', "%{$request->search}%")
                      ->orWhere('keperluan', 'like', "%{$request->search}%");
                });
            })
            ->orderByDesc('jam_masuk')
            ->get()
            ->map(fn ($t) => [
                'id'                  => $t->id,
                'nama_tamu'           => $t->nama_tamu,
                'instansi'            => $t->instansi,
                'nomor_hp'            => $t->nomor_hp,
                'keperluan'           => $t->keperluan,
                'yang_dituju_nama'    => $t->yang_dituju_nama,
                'yang_dituju_jabatan' => $t->yang_dituju_jabatan,
                'jam_masuk'           => substr($t->jam_masuk, 0, 5),
                'jam_keluar'          => $t->jam_keluar ? substr($t->jam_keluar, 0, 5) : null,
                'status'              => $t->status,
                'keterangan'          => $t->keterangan,
            ]);

        return Inertia::render('Admin/BukuTamu/Index', [
            'tamu'    => $tamu,
            'tanggal' => $tanggal,
            'filters' => $request->only('search', 'tanggal'),
        ]);
    }

    public function updateStatus(Request $request, BukuTamu $bukuTamu)
    {
        $request->validate([
            'status'      => 'required|in:menunggu,diterima,selesai,tidak_diterima',
            'jam_keluar'  => 'nullable|date_format:H:i',
            'keterangan'  => 'nullable|string|max:200',
        ]);

        $data = ['status' => $request->status];
        if ($request->jam_keluar) {
            $data['jam_keluar'] = $request->jam_keluar . ':00';
        }
        if ($request->filled('keterangan')) {
            $data['keterangan'] = $request->keterangan;
        }
        // Otomatis set jam keluar ketika selesai
        if ($request->status === 'selesai' && ! $bukuTamu->jam_keluar) {
            $data['jam_keluar'] = now()->format('H:i:s');
        }

        $bukuTamu->update($data);

        return back();
    }
}

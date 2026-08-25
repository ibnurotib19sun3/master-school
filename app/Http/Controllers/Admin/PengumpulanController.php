<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use App\Models\Pembelajaran;
use App\Models\Pengumpulan;
use App\Models\PengumpulanItem;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PengumpulanController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Pengumpulan/Index', [
            'pengumpulan'   => Pengumpulan::withCount([
                                    'items',
                                    'items as uploaded_count' => fn ($q) => $q->whereNotNull('file_path'),
                                ])
                                ->with('tahunAjaran:id,nama')
                                ->latest()
                                ->paginate(20),
            'tahunAjaran'   => TahunAjaran::orderByDesc('tanggal_mulai')->get(['id', 'nama']),
            'mataPelajaran' => MataPelajaran::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'judul'             => 'required|string|max:255',
            'deskripsi'         => 'nullable|string',
            'batas_waktu'       => 'required|date',
            'tahun_ajaran_id'   => 'required|exists:tahun_ajaran,id',
            'mata_pelajaran_id' => 'nullable|exists:mata_pelajaran,id',
        ]);

        $pengumpulan = Pengumpulan::create([
            'created_by'      => auth()->id(),
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'judul'           => $data['judul'],
            'deskripsi'       => $data['deskripsi'] ?? null,
            'batas_waktu'     => $data['batas_waktu'],
        ]);

        // Generate item per pembelajaran yang sesuai filter
        $query = Pembelajaran::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('is_aktif', true);

        if (!empty($data['mata_pelajaran_id'])) {
            $query->where('mata_pelajaran_id', $data['mata_pelajaran_id']);
        }

        $items = $query->get()->map(fn ($p) => [
            'pengumpulan_id' => $pengumpulan->id,
            'pembelajaran_id' => $p->id,
            'created_at'     => now(),
            'updated_at'     => now(),
        ])->toArray();

        PengumpulanItem::insert($items);

        return back()->with('success', "Pengumpulan dibuat dengan {$pengumpulan->items()->count()} slot guru.");
    }

    public function show(Pengumpulan $pengumpulan, Request $request)
    {
        $query = PengumpulanItem::with([
            'pembelajaran.guru:id,user_id,nomor_wa',
            'pembelajaran.guru.user:id,name',
            'pembelajaran.mataPelajaran:id,nama',
            'pembelajaran.rombel:id,nama',
        ])
        ->where('pengumpulan_id', $pengumpulan->id);

        // Hitung status untuk semua item (sebelum filter)
        $allRaw = $query->get()->map(function ($item) use ($pengumpulan) {
            $item->status = $this->hitungStatus($item, $pengumpulan);
            return $item;
        });

        // Versi ringkas untuk laporan WA (selalu lengkap, tidak terfilter)
        $reportItems = $allRaw->map(fn ($item) => [
            'nama'     => $item->pembelajaran?->guru?->user?->name ?? '—',
            'mapel'    => $item->pembelajaran?->mataPelajaran?->nama ?? '—',
            'rombel'   => $item->pembelajaran?->rombel?->nama ?? '—',
            'status'   => $item->status,
            'nomor_wa' => $item->pembelajaran?->guru?->nomor_wa,
        ])->sortBy('nama')->values();

        // Filter tampilan
        $items = $allRaw;
        if ($request->status) {
            $items = $items->where('status', $request->status)->values();
        }
        if ($request->search) {
            $s = strtolower($request->search);
            $items = $items->filter(fn ($item) =>
                str_contains(strtolower($item->pembelajaran?->guru?->user?->name ?? ''), $s) ||
                str_contains(strtolower($item->pembelajaran?->mataPelajaran?->nama ?? ''), $s)
            )->values();
        }

        $stats = [
            'total'        => $pengumpulan->items()->count(),
            'uploaded'     => $pengumpulan->items()->whereNotNull('file_path')->count(),
            'belum'        => $pengumpulan->items()->whereNull('file_path')->count(),
            'terlambat'    => $pengumpulan->items()->whereNotNull('file_path')
                                ->where('tgl_upload', '>', $pengumpulan->batas_waktu)->count(),
        ];

        return Inertia::render('Admin/Pengumpulan/Show', [
            'pengumpulan' => $pengumpulan->load('tahunAjaran:id,nama'),
            'items'       => $items,
            'stats'       => $stats,
            'filters'     => $request->only('status', 'search'),
            'reportItems' => $reportItems,
        ]);
    }

    public function update(Request $request, Pengumpulan $pengumpulan)
    {
        $data = $request->validate([
            'judul'       => 'required|string|max:255',
            'deskripsi'   => 'nullable|string',
            'batas_waktu' => 'required|date',
            'is_aktif'    => 'boolean',
        ]);
        $pengumpulan->update($data);
        return back()->with('success', 'Pengumpulan berhasil diperbarui.');
    }

    public function destroy(Pengumpulan $pengumpulan)
    {
        // Hapus semua file
        $pengumpulan->items()->whereNotNull('file_path')->each(function ($item) {
            Storage::disk('public')->delete($item->file_path);
        });
        $pengumpulan->delete();
        return back()->with('success', 'Pengumpulan berhasil dihapus.');
    }

    private function hitungStatus(PengumpulanItem $item, Pengumpulan $pengumpulan): string
    {
        if (!$item->file_path) return 'Belum';
        return $item->tgl_upload <= $pengumpulan->batas_waktu ? 'Tepat Waktu' : 'Terlambat';
    }
}

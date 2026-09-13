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
use ZipArchive;

class PengumpulanController extends Controller
{
    // format_key => [extensions]
    const FORMAT_MAP = [
        'pdf'   => ['pdf'],
        'word'  => ['doc', 'docx'],
        'excel' => ['xls', 'xlsx'],
        'ppt'   => ['ppt', 'pptx'],
        'image' => ['jpg', 'jpeg', 'png'],
        'zip'   => ['zip'],
    ];

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
            'formatOptions' => self::FORMAT_MAP,
            'pembelajaran'  => Pembelajaran::with([
                                    'mataPelajaran:id,nama',
                                    'rombel:id,nama,kelas_id',
                                    'rombel.kelas:id,nama',
                                    'guru.user:id,name',
                                ])
                                ->where('is_aktif', true)
                                ->get(['id', 'tahun_ajaran_id', 'mata_pelajaran_id', 'rombel_id', 'guru_id'])
                                ->map(fn ($p) => [
                                    'id'              => $p->id,
                                    'tahun_ajaran_id' => $p->tahun_ajaran_id,
                                    'label'           => ($p->mataPelajaran?->nama ?? '—')
                                                       . ' — ' . ($p->rombel?->nama ?? '—')
                                                       . ' (' . ($p->rombel?->kelas?->nama ?? '—') . ')'
                                                       . ' · ' . ($p->guru?->user?->name ?? '—'),
                                ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'judul'                      => 'required|string|max:255',
            'deskripsi'                  => 'nullable|string',
            'batas_waktu'                => 'required|date',
            'tahun_ajaran_id'            => 'required|exists:tahun_ajaran,id',
            'mata_pelajaran_ids'         => 'nullable|array',
            'mata_pelajaran_ids.*'       => 'exists:mata_pelajaran,id',
            'exclude_pembelajaran_ids'   => 'nullable|array',
            'exclude_pembelajaran_ids.*' => 'exists:pembelajaran,id',
            'format_file'                => 'nullable|array',
            'format_file.*'              => 'string|in:pdf,word,excel,ppt,image,zip',
            'allow_late_upload'          => 'boolean',
        ]);

        $pengumpulan = Pengumpulan::create([
            'created_by'        => auth()->id(),
            'tahun_ajaran_id'   => $data['tahun_ajaran_id'],
            'judul'             => $data['judul'],
            'deskripsi'         => $data['deskripsi'] ?? null,
            'batas_waktu'       => $data['batas_waktu'],
            'format_file'       => !empty($data['format_file']) ? $data['format_file'] : null,
            'allow_late_upload' => $data['allow_late_upload'] ?? true,
        ]);

        $query = Pembelajaran::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('is_aktif', true);

        if (!empty($data['mata_pelajaran_ids'])) {
            $query->whereIn('mata_pelajaran_id', $data['mata_pelajaran_ids']);
        }

        if (!empty($data['exclude_pembelajaran_ids'])) {
            $query->whereNotIn('id', $data['exclude_pembelajaran_ids']);
        }

        $items = $query->get()->map(fn ($p) => [
            'pengumpulan_id'  => $pengumpulan->id,
            'pembelajaran_id' => $p->id,
            'created_at'      => now(),
            'updated_at'      => now(),
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

        $allRaw = $query->get()->map(function ($item) use ($pengumpulan) {
            $item->status       = $this->hitungStatus($item, $pengumpulan);
            $item->portal_buka  = $this->isPortalBuka($item, $pengumpulan);
            return $item;
        });

        $reportItems = $allRaw->map(fn ($item) => [
            'nama'     => $item->pembelajaran?->guru?->user?->name ?? '—',
            'mapel'    => $item->pembelajaran?->mataPelajaran?->nama ?? '—',
            'rombel'   => $item->pembelajaran?->rombel?->nama ?? '—',
            'status'   => $item->status,
            'nomor_wa' => $item->pembelajaran?->guru?->nomor_wa,
        ])->sortBy('nama')->values();

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
            'total'     => $pengumpulan->items()->count(),
            'uploaded'  => $pengumpulan->items()->whereNotNull('file_path')->count(),
            'belum'     => $pengumpulan->items()->whereNull('file_path')->count(),
            'terlambat' => $pengumpulan->items()->whereNotNull('file_path')
                            ->where('tgl_upload', '>', $pengumpulan->batas_waktu)->count(),
        ];

        $pembelajaran = Pembelajaran::with([
                            'mataPelajaran:id,nama',
                            'rombel:id,nama,kelas_id',
                            'rombel.kelas:id,nama',
                            'guru.user:id,name',
                        ])
                        ->where('tahun_ajaran_id', $pengumpulan->tahun_ajaran_id)
                        ->where('is_aktif', true)
                        ->get(['id', 'tahun_ajaran_id', 'mata_pelajaran_id', 'rombel_id', 'guru_id'])
                        ->map(fn ($p) => [
                            'id'              => $p->id,
                            'tahun_ajaran_id' => $p->tahun_ajaran_id,
                            'label'           => ($p->mataPelajaran?->nama ?? '—')
                                               . ' — ' . ($p->rombel?->nama ?? '—')
                                               . ' (' . ($p->rombel?->kelas?->nama ?? '—') . ')'
                                               . ' · ' . ($p->guru?->user?->name ?? '—'),
                        ]);

        return Inertia::render('Admin/Pengumpulan/Show', [
            'pengumpulan' => $pengumpulan->load('tahunAjaran:id,nama'),
            'items'       => $items,
            'stats'       => $stats,
            'filters'     => $request->only('status', 'search'),
            'reportItems' => $reportItems,
            'pembelajaran' => $pembelajaran,
        ]);
    }

    public function update(Request $request, Pengumpulan $pengumpulan)
    {
        $data = $request->validate([
            'judul'                      => 'required|string|max:255',
            'deskripsi'                  => 'nullable|string',
            'batas_waktu'                => 'required|date',
            'is_aktif'                   => 'boolean',
            'allow_late_upload'          => 'boolean',
            'format_file'                => 'nullable|array',
            'format_file.*'              => 'string|in:pdf,word,excel,ppt,image,zip',
            'exclude_pembelajaran_ids'   => 'nullable|array',
            'exclude_pembelajaran_ids.*' => 'exists:pembelajaran,id',
        ]);

        $pengumpulan->update([
            'judul'             => $data['judul'],
            'deskripsi'         => $data['deskripsi'] ?? null,
            'batas_waktu'       => $data['batas_waktu'],
            'is_aktif'          => $data['is_aktif'] ?? $pengumpulan->is_aktif,
            'allow_late_upload' => $data['allow_late_upload'] ?? $pengumpulan->allow_late_upload,
            'format_file'       => !empty($data['format_file']) ? $data['format_file'] : null,
        ]);

        // Hapus slot existing yang dikecualikan (hanya yang belum ada file)
        $removed = 0;
        if (!empty($data['exclude_pembelajaran_ids'])) {
            $removed = PengumpulanItem::where('pengumpulan_id', $pengumpulan->id)
                ->whereIn('pembelajaran_id', $data['exclude_pembelajaran_ids'])
                ->whereNull('file_path')
                ->delete();
        }

        // Tambah slot baru untuk pembelajaran yang belum ada di pengumpulan ini
        $existingIds = PengumpulanItem::where('pengumpulan_id', $pengumpulan->id)
            ->pluck('pembelajaran_id')
            ->toArray();

        $query = Pembelajaran::where('tahun_ajaran_id', $pengumpulan->tahun_ajaran_id)
            ->where('is_aktif', true)
            ->whereNotIn('id', $existingIds);

        if (!empty($data['exclude_pembelajaran_ids'])) {
            $query->whereNotIn('id', $data['exclude_pembelajaran_ids']);
        }

        $newItems = $query->get()->map(fn ($p) => [
            'pengumpulan_id'  => $pengumpulan->id,
            'pembelajaran_id' => $p->id,
            'created_at'      => now(),
            'updated_at'      => now(),
        ])->toArray();

        if (!empty($newItems)) {
            PengumpulanItem::insert($newItems);
        }

        $msg = 'Pengumpulan berhasil diperbarui.';
        if ($removed > 0)      $msg .= " {$removed} slot dikecualikan.";
        if (!empty($newItems)) $msg .= ' ' . count($newItems) . ' slot baru ditambahkan.';
        return back()->with('success', $msg);
    }

    public function destroy(Pengumpulan $pengumpulan)
    {
        $pengumpulan->items()->whereNotNull('file_path')->each(function ($item) {
            Storage::disk('public')->delete($item->file_path);
        });
        $pengumpulan->delete();
        return back()->with('success', 'Pengumpulan berhasil dihapus.');
    }

    public function downloadAll(Pengumpulan $pengumpulan)
    {
        $items = $pengumpulan->items()
            ->whereNotNull('file_path')
            ->with([
                'pembelajaran.guru.user:id,name',
                'pembelajaran.mataPelajaran:id,nama',
                'pembelajaran.rombel:id,nama',
            ])
            ->get();

        if ($items->isEmpty()) {
            return back()->with('error', 'Belum ada file yang diunggah.');
        }

        $slug = fn (string $s) => preg_replace('/[^a-z0-9]+/', '_', strtolower($s));

        $zipPath = sys_get_temp_dir() . '/pengumpulan_' . $pengumpulan->id . '_' . now()->format('Ymd_His') . '.zip';
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach ($items as $item) {
            $storagePath = Storage::disk('public')->path($item->file_path);
            if (!file_exists($storagePath)) continue;

            $ext       = pathinfo($item->file_path, PATHINFO_EXTENSION);
            $guru      = $item->pembelajaran?->guru?->user?->name ?? 'guru';
            $mapel     = $item->pembelajaran?->mataPelajaran?->nama ?? 'mapel';
            $rombel    = $item->pembelajaran?->rombel?->nama ?? 'kelas';
            $zipName   = $slug($guru) . '_' . $slug($mapel) . '_' . $slug($rombel) . '.' . $ext;

            $zip->addFile($storagePath, $zipName);
        }

        $zip->close();

        $judul = $slug($pengumpulan->judul);
        return response()->download($zipPath, "pengumpulan_{$judul}.zip")->deleteFileAfterSend(true);
    }

    public function togglePortal(Request $request, PengumpulanItem $item)
    {
        $request->validate(['open' => 'required|boolean']);

        // null = ikut global setting, 1 = paksa buka, 0 = paksa tutup
        $item->update(['portal_override' => $request->boolean('open') ? 1 : 0]);

        return back()->with('success', $request->boolean('open')
            ? 'Portal upload dibuka untuk guru ini.'
            : 'Portal upload ditutup untuk guru ini.'
        );
    }

    private function hitungStatus(PengumpulanItem $item, Pengumpulan $pengumpulan): string
    {
        if (!$item->file_path) return 'Belum';
        return $item->tgl_upload <= $pengumpulan->batas_waktu ? 'Tepat Waktu' : 'Terlambat';
    }

    private function isPortalBuka(PengumpulanItem $item, Pengumpulan $pengumpulan): bool
    {
        $expired = now() > $pengumpulan->batas_waktu;
        if (!$expired) return true;

        if ($item->portal_override === 1) return true;
        if ($item->portal_override === 0) return false;
        return $pengumpulan->allow_late_upload;
    }
}

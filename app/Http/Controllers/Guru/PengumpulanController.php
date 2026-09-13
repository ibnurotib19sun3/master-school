<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\PengumpulanController as AdminPengumpulanController;
use App\Models\PengumpulanItem;
use App\Models\Pembelajaran;
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
            'pengumpulan:id,judul,deskripsi,batas_waktu,is_aktif,format_file,allow_late_upload',
            'pembelajaran.mataPelajaran:id,nama',
            'pembelajaran.rombel:id,nama,kelas_id',
            'pembelajaran.rombel.kelas:id,nama,tingkat',
        ])
        ->whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $guruId))
        ->whereHas('pengumpulan', fn ($q) => $q->where('is_aktif', true))
        ->get()
        ->map(function ($item) {
            $pengumpulan = $item->pengumpulan;
            $batas       = $pengumpulan?->batas_waktu;
            $expired     = $batas && now() > $batas;

            $item->status      = !$item->file_path
                ? ($expired ? 'Terlambat' : 'Belum')
                : ($item->tgl_upload <= $batas ? 'Tepat Waktu' : 'Terlambat');
            $item->portal_buka = $this->isPortalBuka($item, $pengumpulan);

            return $item;
        })
        ->sortBy(fn ($item) => $item->pengumpulan?->batas_waktu)
        ->values();

        return Inertia::render('Guru/Pengumpulan/Index', ['items' => $items]);
    }

    public function upload(Request $request, PengumpulanItem $item)
    {
        $guruId = auth()->user()->guru?->id;
        abort_if($item->pembelajaran?->guru_id !== $guruId, 403);

        $item->load(['pengumpulan', 'pembelajaran.mataPelajaran', 'pembelajaran.rombel.kelas', 'pembelajaran.guru.user']);
        $pengumpulan = $item->pengumpulan;

        // Cek portal
        abort_if(!$this->isPortalBuka($item, $pengumpulan), 403, 'Portal upload sudah ditutup. Hubungi admin untuk membuka.');

        // Validasi format file
        $allowedExts = $this->resolveExtensions($pengumpulan->format_file);
        $request->validate([
            'file' => 'required|file|mimes:' . implode(',', $allowedExts) . '|max:20480',
        ]);

        if ($item->file_path) {
            Storage::disk('public')->delete($item->file_path);
        }

        $slug = fn (string $s) => preg_replace('/[^a-z0-9]+/', '_', strtolower($s));

        $guruNama  = $item->pembelajaran?->guru?->user?->name ?? 'guru';
        $mapelNama = $item->pembelajaran?->mataPelajaran?->nama ?? 'mapel';
        $ext       = strtolower($request->file('file')->getClientOriginalExtension());
        $timestamp = now()->format('Ymd_His');

        $applyJenjang = $request->boolean('apply_jenjang');
        $kelasId      = $item->pembelajaran?->rombel?->kelas_id;

        if ($applyJenjang && $kelasId) {
            // Satu file untuk semua rombel sejenjang — nama file pakai "semua_rombel"
            $kelasNama  = $item->pembelajaran?->rombel?->kelas?->nama ?? 'kelas';
            $filename   = $slug($guruNama) . '_' . $slug($mapelNama) . '_semua_rombel_' . $timestamp . '.' . $ext;
            $masterPath = $request->file('file')->storeAs('pengumpulan', $filename, 'public');

            // Temukan semua item sejenjang (guru sama, mapel sama, kelas sama)
            $sibling = PengumpulanItem::where('pengumpulan_id', $pengumpulan->id)
                ->whereHas('pembelajaran', fn ($q) => $q
                    ->where('guru_id', $guruId)
                    ->where('mata_pelajaran_id', $item->pembelajaran->mata_pelajaran_id)
                    ->whereHas('rombel', fn ($rq) => $rq->where('kelas_id', $kelasId))
                )
                ->get();

            foreach ($sibling as $s) {
                // Hapus file lama jika ada dan tidak dibagi dengan item lain
                if ($s->file_path && $s->file_path !== $masterPath) {
                    $usedElsewhere = PengumpulanItem::where('file_path', $s->file_path)
                        ->whereNotIn('id', $sibling->pluck('id'))
                        ->exists();
                    if (!$usedElsewhere) {
                        Storage::disk('public')->delete($s->file_path);
                    }
                }
                // Semua sibling pakai path yang sama (1 file)
                $s->update(['file_path' => $masterPath, 'tgl_upload' => now()]);
            }

            return back()->with('success', "File berhasil diunggah untuk {$sibling->count()} rombel sejenjang (1 file bersama).");
        }

        // Upload normal (satu slot)
        $rombelNama = $item->pembelajaran?->rombel?->nama ?? 'kelas';
        $filename   = $slug($guruNama) . '_' . $slug($mapelNama) . '_' . $slug($rombelNama) . '_' . $timestamp . '.' . $ext;

        $item->update([
            'file_path'  => $request->file('file')->storeAs('pengumpulan', $filename, 'public'),
            'tgl_upload' => now(),
        ]);

        return back()->with('success', 'File berhasil diunggah.');
    }

    public function deleteFile(Request $request, PengumpulanItem $item)
    {
        $guruId = auth()->user()->guru?->id;
        abort_if($item->pembelajaran?->guru_id !== $guruId, 403);

        if (!$item->file_path) {
            return back()->with('success', 'File berhasil dihapus.');
        }

        $filePath = $item->file_path;

        if ($request->boolean('all_jenjang')) {
            // Hapus semua item sejenjang (sama guru, mapel, kelas)
            $kelasId = $item->pembelajaran?->rombel?->kelas_id;
            $mapelId = $item->pembelajaran?->mata_pelajaran_id;

            $siblings = PengumpulanItem::where('pengumpulan_id', $item->pengumpulan_id)
                ->whereHas('pembelajaran', fn ($q) => $q
                    ->where('guru_id', $guruId)
                    ->where('mata_pelajaran_id', $mapelId)
                    ->whereHas('rombel', fn ($rq) => $rq->where('kelas_id', $kelasId))
                )
                ->get();

            $usedElsewhere = PengumpulanItem::where('file_path', $filePath)
                ->whereNotIn('id', $siblings->pluck('id'))
                ->exists();
            if (!$usedElsewhere) {
                Storage::disk('public')->delete($filePath);
            }

            $siblings->each(fn ($s) => $s->update(['file_path' => null, 'tgl_upload' => null]));
        } else {
            $sharedCount = PengumpulanItem::where('file_path', $filePath)
                ->where('id', '!=', $item->id)
                ->count();
            if ($sharedCount === 0) {
                Storage::disk('public')->delete($filePath);
            }
            $item->update(['file_path' => null, 'tgl_upload' => null]);
        }

        return back()->with('success', 'File berhasil dihapus.');
    }

    private function isPortalBuka(PengumpulanItem $item, $pengumpulan): bool
    {
        if (!$pengumpulan) return false;
        $expired = now() > $pengumpulan->batas_waktu;
        if (!$expired) return true;

        if ($item->portal_override === 1) return true;
        if ($item->portal_override === 0) return false;
        return (bool) $pengumpulan->allow_late_upload;
    }

    private function resolveExtensions(?array $formatFile): array
    {
        if (empty($formatFile)) {
            // Semua format
            return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'zip'];
        }

        $exts = [];
        foreach ($formatFile as $key) {
            $exts = array_merge($exts, AdminPengumpulanController::FORMAT_MAP[$key] ?? []);
        }
        return array_unique($exts) ?: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
    }
}

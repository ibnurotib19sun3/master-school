<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\KodeDepartemen;
use App\Models\KodeJenisSurat;
use App\Models\PengaturanSurat;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SuratKeluarController extends Controller
{
    public function index(Request $request)
    {
        $this->syncExistingFileNames();

        $sortBy  = in_array($request->sort_by, ['nomor_surat', 'tgl_surat', 'tgl_keluar']) ? $request->sort_by : 'nomor_surat';
        $sortDir = in_array(strtolower($request->sort_dir ?? ''), ['asc', 'desc']) ? strtolower($request->sort_dir) : 'desc';

        $query = SuratKeluar::with('pembuat:id,name')
            ->when($request->search,   fn ($q) => $q
                ->where('nomor_surat', 'like', "%{$request->search}%")
                ->orWhere('perihal',   'like', "%{$request->search}%")
                ->orWhere('tujuan',    'like', "%{$request->search}%"))
            ->when($request->status,   fn ($q) => $q->where('status',   $request->status))
            ->when($request->kategori, fn ($q) => $q->where('kategori', $request->kategori))
            ->when($request->tahun,    fn ($q) => $q->whereYear('tgl_keluar', $request->tahun))
            ->orderBy($sortBy, $sortDir);

        $ps = PengaturanSurat::current();
        $nomorAwal = (int) ($ps->nomor_awal_surat ?? 0);
        $nextSeq = $ps->getNextSeq();

        return Inertia::render('TataUsaha/Surat/KeluarIndex', [
            'surat'          => $query->paginate(20)->withQueryString(),
            'filters'        => array_merge($request->only('search', 'status', 'kategori', 'tahun'), [
                'sort_by'  => $sortBy,
                'sort_dir' => $sortDir,
            ]),
            'kode_departemen'=> KodeDepartemen::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'kode_jenis'     => KodeJenisSurat::where('aktif', true)->orderBy('urutan')->get(['id', 'nama', 'kode']),
            'format_nomor'   => [
                'separator'        => $ps->separator,
                'format_bagian'    => $ps->format_bagian,
                'prefix_kode'      => $ps->prefix_kode,
                'nomor_awal_surat' => $nomorAwal,
            ],
            'next_seq'       => $nextSeq,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_surat' => 'required|string|max:150',
            'perihal'     => 'nullable|string|max:255',
            'tujuan'      => 'nullable|string|max:255',
            'tgl_surat'   => 'required|date',
            'tgl_keluar'  => 'required|date',
            'kategori'    => 'required|string|max:100',
            'status'      => 'required|in:Draft,Terkirim',
            'keterangan'  => 'nullable|string',
            'file_surat'  => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            $data['file_surat'] = $this->storeLampiranFile($request->file('file_surat'), $data['nomor_surat']);
        }

        SuratKeluar::create([...$data, 'dibuat_oleh' => auth()->id()]);
        return back()->with('success', 'Surat keluar berhasil disimpan.');
    }

    public function update(Request $request, SuratKeluar $suratKeluar)
    {
        $data = $request->validate([
            'nomor_surat' => 'required|string|max:150',
            'perihal'     => 'nullable|string|max:255',
            'tujuan'      => 'nullable|string|max:255',
            'tgl_surat'   => 'required|date',
            'tgl_keluar'  => 'required|date',
            'kategori'    => 'required|string|max:100',
            'status'      => 'required|in:Draft,Terkirim',
            'keterangan'  => 'nullable|string',
            'file_surat'  => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file_surat')) {
            $data['file_surat'] = $this->storeLampiranFile($request->file('file_surat'), $data['nomor_surat'], $suratKeluar->file_surat);
        } else {
            unset($data['file_surat']);
            // Jika nomor surat diubah dan memiliki lampiran lama, rename file lama agar sesuai nomor surat baru
            if ($suratKeluar->file_surat && $suratKeluar->nomor_surat !== $data['nomor_surat']) {
                $renamed = $this->renameLampiranFile($suratKeluar->file_surat, $data['nomor_surat']);
                if ($renamed) {
                    $data['file_surat'] = $renamed;
                }
            }
        }

        $suratKeluar->update($data);
        return back()->with('success', 'Surat keluar berhasil diperbarui.');
    }

    public function viewFile(SuratKeluar $suratKeluar)
    {
        if (!$suratKeluar->file_surat || !Storage::disk('public')->exists($suratKeluar->file_surat)) {
            abort(404, 'File lampiran surat tidak ditemukan.');
        }

        $ext = pathinfo($suratKeluar->file_surat, PATHINFO_EXTENSION) ?: 'pdf';
        $safeNomor = SuratKeluar::sanitizeNomorForFilename($suratKeluar->nomor_surat ?? 'surat-keluar');
        $fileName = "{$safeNomor}.{$ext}";

        $mime = Storage::disk('public')->mimeType($suratKeluar->file_surat) ?: 'application/octet-stream';

        return response()->file(Storage::disk('public')->path($suratKeluar->file_surat), [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . $fileName . '"',
        ]);
    }

    public function downloadFile(SuratKeluar $suratKeluar)
    {
        if (!$suratKeluar->file_surat || !Storage::disk('public')->exists($suratKeluar->file_surat)) {
            abort(404, 'File lampiran surat tidak ditemukan.');
        }

        $ext = pathinfo($suratKeluar->file_surat, PATHINFO_EXTENSION) ?: 'pdf';
        $safeNomor = SuratKeluar::sanitizeNomorForFilename($suratKeluar->nomor_surat ?? 'surat-keluar');
        $fileName = "{$safeNomor}.{$ext}";

        return Storage::disk('public')->download($suratKeluar->file_surat, $fileName);
    }

    public function destroy(SuratKeluar $suratKeluar)
    {
        if ($suratKeluar->file_surat) Storage::disk('public')->delete($suratKeluar->file_surat);
        if ($suratKeluar->file_tte)   Storage::disk('public')->delete($suratKeluar->file_tte);
        $suratKeluar->delete();
        return back()->with('success', 'Surat keluar berhasil dihapus.');
    }

    /**
     * Simpan file lampiran dengan penamaan sesuai nomor surat.
     */
    private function storeLampiranFile($file, string $nomorSurat, ?string $oldPath = null): string
    {
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $safeName = SuratKeluar::sanitizeNomorForFilename($nomorSurat);
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'pdf');
        $fileName = "{$safeName}.{$ext}";

        if (Storage::disk('public')->exists("surat/keluar/{$fileName}")) {
            $fileName = "{$safeName}_" . time() . ".{$ext}";
        }

        return $file->storeAs('surat/keluar', $fileName, 'public');
    }

    /**
     * Rename file lampiran lama saat nomor surat diedit.
     */
    private function renameLampiranFile(string $currentPath, string $newNomorSurat): ?string
    {
        if (!Storage::disk('public')->exists($currentPath)) {
            return null;
        }

        $safeName = SuratKeluar::sanitizeNomorForFilename($newNomorSurat);
        $ext = pathinfo($currentPath, PATHINFO_EXTENSION) ?: 'pdf';
        $newFileName = "{$safeName}.{$ext}";
        $newPath = "surat/keluar/{$newFileName}";

        if ($currentPath === $newPath) {
            return $currentPath;
        }

        if (Storage::disk('public')->exists($newPath)) {
            $newFileName = "{$safeName}_" . time() . ".{$ext}";
            $newPath = "surat/keluar/{$newFileName}";
        }

        Storage::disk('public')->move($currentPath, $newPath);
        return $newPath;
    }

    /**
     * Sinkronkan nama file surat keluar lama yang masih berupa hash random agar sesuai nomor_surat.
     */
    private function syncExistingFileNames(): void
    {
        try {
            $suratWithFiles = SuratKeluar::whereNotNull('file_surat')
                ->where('file_surat', '!=', '')
                ->get(['id', 'nomor_surat', 'file_surat']);

            foreach ($suratWithFiles as $surat) {
                $currentPath = $surat->file_surat;
                $currentBase = basename($currentPath);
                $expectedBase = SuratKeluar::sanitizeNomorForFilename($surat->nomor_surat);

                if (!str_starts_with($currentBase, $expectedBase) && Storage::disk('public')->exists($currentPath)) {
                    $ext = pathinfo($currentPath, PATHINFO_EXTENSION) ?: 'pdf';
                    $newFileName = "{$expectedBase}.{$ext}";
                    $newPath = "surat/keluar/{$newFileName}";

                    if (Storage::disk('public')->exists($newPath) && $currentPath !== $newPath) {
                        $newFileName = "{$expectedBase}_" . $surat->id . ".{$ext}";
                        $newPath = "surat/keluar/{$newFileName}";
                    }

                    if ($currentPath !== $newPath) {
                        Storage::disk('public')->move($currentPath, $newPath);
                        $surat->update(['file_surat' => $newPath]);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silently continue if DB/storage access is not ready
        }
    }
}

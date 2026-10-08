<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DokumenJenis;
use App\Models\DokumenSiswa;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DokumenJenisController extends Controller
{
    private function validated(Request $request): array
    {
        return $request->validate([
            'nama'            => 'required|string|max:255',
            'deskripsi'       => 'nullable|string|max:255',
            'allowed_types'   => 'required|array|min:1',
            'allowed_types.*' => 'in:' . implode(',', array_keys(DokumenJenis::TYPE_MAP)),
            'urutan'          => 'nullable|integer|min:0',
        ]);
    }

    public function index()
    {
        return Inertia::render('Admin/DokumenJenis/Index', [
            'dokumenJenis' => DokumenJenis::withCount('dokumenSiswa')
                ->orderBy('urutan')
                ->orderBy('nama')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        DokumenJenis::create([
            ...$data,
            'urutan'   => $data['urutan'] ?? 0,
            'is_aktif' => true,
        ]);

        return back()->with('success', 'Jenis dokumen berhasil ditambahkan.');
    }

    public function update(Request $request, DokumenJenis $dokumenJenis)
    {
        $data = $this->validated($request);
        $dokumenJenis->update([
            ...$data,
            'urutan' => $data['urutan'] ?? 0,
        ]);

        return back()->with('success', 'Jenis dokumen berhasil diperbarui.');
    }

    public function toggleAktif(DokumenJenis $dokumenJenis)
    {
        $dokumenJenis->update(['is_aktif' => !$dokumenJenis->is_aktif]);

        return back()->with('success', $dokumenJenis->is_aktif
            ? 'Jenis dokumen diaktifkan.'
            : 'Jenis dokumen dinonaktifkan — tidak akan muncul lagi untuk diunggah, dokumen yang sudah ada tetap tersimpan.');
    }

    public function destroy(DokumenJenis $dokumenJenis)
    {
        // Hapus juga file fisik dokumen siswa yang sudah terlanjur diunggah untuk jenis ini.
        $dokumenJenis->dokumenSiswa->each(function ($d) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($d->file_path);
        });
        $dokumenJenis->delete();

        return back()->with('success', 'Jenis dokumen berhasil dihapus.');
    }

    public function laporan(Request $request)
    {
        $jenisList = DokumenJenis::orderBy('urutan')->orderBy('nama')->get();
        $jenis     = $request->jenis_id
            ? $jenisList->firstWhere('id', (int) $request->jenis_id)
            : $jenisList->first();

        $tahunAktif = TahunAjaran::aktif();
        $rombelList = $tahunAktif
            ? Rombel::where('tahun_ajaran_id', $tahunAktif->id)->orderBy('nama')->get(['id', 'nama'])
            : collect();

        $siswa = collect();
        if ($jenis) {
            $uploadedSiswaIds = DokumenSiswa::where('dokumen_jenis_id', $jenis->id)->pluck('siswa_id')->flip();

            $siswa = Siswa::with(['user:id,name', 'rombel:id,nama'])
                ->where('status_siswa', 'Aktif')
                ->when($request->rombel_id, fn ($q) => $q->where('rombel_id', $request->rombel_id))
                ->orderBy('nis')
                ->get()
                ->map(fn ($s) => [
                    'id'       => $s->id,
                    'nama'     => $s->user?->name,
                    'nis'      => $s->nis,
                    'rombel'   => $s->rombel?->nama,
                    'uploaded' => isset($uploadedSiswaIds[$s->id]),
                ]);
        }

        return Inertia::render('Admin/DokumenJenis/Laporan', [
            'jenisList'  => $jenisList,
            'jenis'      => $jenis,
            'rombelList' => $rombelList,
            'siswa'      => $siswa,
            'filters'    => $request->only('jenis_id', 'rombel_id'),
        ]);
    }
}

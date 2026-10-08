<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\DokumenJenis;
use App\Models\DokumenSiswa;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DokumenSiswaController extends Controller
{
    /**
     * Upload dokumen siswa khusus dipegang staf Tatausaha dengan jabatan "Tatausaha"
     * (bukan Keuangan/Operator/dll), ditambah super_admin sebagai akses darurat.
     * Middleware route hanya menyaring per-role, jadi jabatan harus dicek di sini juga
     * supaya staf TU dengan jabatan lain tidak bisa upload lewat akses URL langsung.
     */
    private function authorizeUpload(Request $request): void
    {
        $user = $request->user();
        $diizinkan = $user->hasRole('super_admin')
            || ($user->hasRole('tatausaha') && $user->tatausaha?->jabatan === 'Tatausaha');

        abort_unless($diizinkan, 403, 'Hanya Tatausaha yang berwenang mengunggah dokumen siswa.');
    }

    public function index(Request $request)
    {
        $tahunAktif = TahunAjaran::aktif();
        $jenisList  = DokumenJenis::where('is_aktif', true)->orderBy('urutan')->orderBy('nama')->get();

        $siswa = Siswa::with(['user', 'rombel'])
            ->with(['dokumenSiswa' => fn ($q) => $q->select('id', 'siswa_id', 'dokumen_jenis_id', 'file_path')])
            ->when($request->search, fn ($q) => $q->where('nis', 'like', "%{$request->search}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->when($request->rombel_id, fn ($q) => $q->where('rombel_id', $request->rombel_id))
            ->where('status_siswa', 'Aktif')
            ->orderBy('nis')
            ->paginate(15)
            ->withQueryString();

        // Bentuk ulang jadi matrix siap pakai di tabel: dokumen keyed by dokumen_jenis_id
        // per siswa, supaya frontend tidak perlu cari-cari sendiri dari koleksi relasi.
        $siswa->getCollection()->transform(function ($s) {
            $s->setRelation('dokumenSiswa', $s->dokumenSiswa->keyBy('dokumen_jenis_id'));
            return $s;
        });

        return Inertia::render('TataUsaha/DokumenSiswa/Index', [
            'siswa'      => $siswa,
            'jenisList'  => $jenisList,
            'rombel'     => $tahunAktif
                ? Rombel::where('tahun_ajaran_id', $tahunAktif->id)->orderBy('nama')->get(['id', 'nama'])
                : [],
            'filters'    => $request->only('search', 'rombel_id'),
        ]);
    }

    public function show(Siswa $siswa)
    {
        $siswa->load(['user', 'rombel']);

        $jenisList = DokumenJenis::where('is_aktif', true)->orderBy('urutan')->orderBy('nama')->get();

        $dokumen = DokumenSiswa::where('siswa_id', $siswa->id)
            ->with('pengunggah:id,name')
            ->get()
            ->keyBy('dokumen_jenis_id');

        return Inertia::render('TataUsaha/DokumenSiswa/Show', [
            'siswa'     => $siswa,
            'jenisList' => $jenisList,
            'dokumen'   => $dokumen,
        ]);
    }

    public function store(Request $request, Siswa $siswa)
    {
        $this->authorizeUpload($request);

        $data = $request->validate([
            'dokumen_jenis_id' => 'required|exists:dokumen_jenis,id',
            'file'             => 'required|file|max:5120',
        ]);

        $jenis = DokumenJenis::findOrFail($data['dokumen_jenis_id']);
        $exts  = $jenis->allowedExtensions();

        $request->validate([
            'file' => 'mimes:' . implode(',', $exts),
        ], [
            'file.mimes' => 'Tipe file tidak sesuai. Jenis dokumen ini hanya menerima: ' . strtoupper(implode(', ', $exts)) . '.',
        ]);

        $existing = DokumenSiswa::where('siswa_id', $siswa->id)
            ->where('dokumen_jenis_id', $jenis->id)
            ->first();
        if ($existing) {
            Storage::disk('public')->delete($existing->file_path);
        }

        $ext      = $request->file('file')->getClientOriginalExtension();
        $filename = str($siswa->nis . '_' . $jenis->nama . '_' . now()->format('Ymd_His'))
            ->slug() . '.' . strtolower($ext);
        $path = $request->file('file')->storeAs('dokumen-siswa', $filename, 'public');

        DokumenSiswa::updateOrCreate(
            ['siswa_id' => $siswa->id, 'dokumen_jenis_id' => $jenis->id],
            ['file_path' => $path, 'uploaded_by' => $request->user()->id]
        );

        return back()->with('success', "Dokumen \"{$jenis->nama}\" berhasil diunggah.");
    }

    public function destroy(Request $request, DokumenSiswa $dokumenSiswa)
    {
        $this->authorizeUpload($request);

        Storage::disk('public')->delete($dokumenSiswa->file_path);
        $dokumenSiswa->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }
}

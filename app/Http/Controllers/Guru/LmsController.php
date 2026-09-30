<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\LmsMateri;
use App\Models\Pembelajaran;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LmsController extends Controller
{
    private function guruId(): ?int
    {
        return auth()->user()->guru?->id;
    }

    public function index()
    {
        $guruId     = $this->guruId();
        $tahunAktif = TahunAjaran::aktif();

        $pembelajaran = Pembelajaran::with(['mataPelajaran', 'rombel.kelas'])
            ->withCount(['lmsMateri' => fn ($q) => $q->where('is_aktif', true)])
            ->where('guru_id', $guruId)
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->where('is_aktif', true)
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'mapel'       => $p->mataPelajaran?->nama,
                'rombel'      => $p->rombel?->nama,
                'kelas'       => $p->rombel?->kelas?->nama,
                'jumlah_materi' => $p->lms_materi_count,
            ]);

        return Inertia::render('Guru/Lms/Index', [
            'pembelajaran' => $pembelajaran,
            'tahunAktif'   => $tahunAktif,
        ]);
    }

    public function show(Pembelajaran $pembelajaran)
    {
        abort_if($pembelajaran->guru_id !== $this->guruId(), 403);

        $materi = LmsMateri::withCount(['akses as dilihat_count' => fn ($q) => $q->whereNotNull('dilihat_at')])
            ->where('pembelajaran_id', $pembelajaran->id)
            ->orderBy('pertemuan_ke')
            ->orderBy('urutan')
            ->get();

        $totalSiswa = $pembelajaran->rombel?->siswa()->where('status_siswa', 'Aktif')->count() ?? 0;

        return Inertia::render('Guru/Lms/Show', [
            'pembelajaran' => $pembelajaran->load(['mataPelajaran', 'rombel.kelas']),
            'materi'       => $materi,
            'totalSiswa'   => $totalSiswa,
        ]);
    }

    public function store(Request $request, Pembelajaran $pembelajaran)
    {
        abort_if($pembelajaran->guru_id !== $this->guruId(), 403);

        $data = $request->validate([
            'judul'        => 'required|string|max:255',
            'deskripsi'    => 'nullable|string',
            'pertemuan_ke' => 'nullable|integer|min:1',
            'url'          => 'nullable|url|required_without:file',
            'file'         => 'nullable|file|max:20480|required_without:url',
        ]);

        $payload = [
            'pembelajaran_id' => $pembelajaran->id,
            'guru_id'         => $this->guruId(),
            'pertemuan_ke'    => $data['pertemuan_ke'] ?? null,
            'judul'           => $data['judul'],
            'deskripsi'       => $data['deskripsi'] ?? null,
            'urutan'          => LmsMateri::where('pembelajaran_id', $pembelajaran->id)->max('urutan') + 1,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $payload['file_path'] = $file->store('lms-materi', 'public');
            $payload['file_name'] = $file->getClientOriginalName();
            $payload['file_ext']  = strtolower($file->getClientOriginalExtension());
            $payload['file_size'] = $file->getSize();
        } else {
            $payload['url'] = $data['url'];
        }

        LmsMateri::create($payload);

        return back()->with('success', 'Materi berhasil ditambahkan.');
    }

    public function update(Request $request, LmsMateri $materi)
    {
        abort_if($materi->guru_id !== $this->guruId(), 403);

        $data = $request->validate([
            'judul'        => 'required|string|max:255',
            'deskripsi'    => 'nullable|string',
            'pertemuan_ke' => 'nullable|integer|min:1',
            'is_aktif'     => 'boolean',
        ]);

        $materi->update($data);

        return back()->with('success', 'Materi berhasil diperbarui.');
    }

    public function destroy(LmsMateri $materi)
    {
        abort_if($materi->guru_id !== $this->guruId(), 403);

        if ($materi->file_path) {
            Storage::disk('public')->delete($materi->file_path);
        }
        $materi->delete();

        return back()->with('success', 'Materi berhasil dihapus.');
    }
}

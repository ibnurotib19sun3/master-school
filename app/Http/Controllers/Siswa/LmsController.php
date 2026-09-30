<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\LmsMateri;
use App\Models\LmsMateriAkses;
use App\Models\Pembelajaran;
use App\Models\TahunAjaran;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LmsController extends Controller
{
    private function siswaId(): ?int
    {
        return auth()->user()->siswa?->id;
    }

    public function index()
    {
        $siswa = auth()->user()->siswa;

        if (!$siswa || !$siswa->rombel_id) {
            return Inertia::render('Siswa/Lms/Index', ['pembelajaran' => []]);
        }

        $tahunAktif = TahunAjaran::aktif();

        $pembelajaran = Pembelajaran::with(['mataPelajaran', 'guru.user'])
            ->withCount(['lmsMateri' => fn ($q) => $q->where('is_aktif', true)])
            ->where('rombel_id', $siswa->rombel_id)
            ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
            ->where('is_aktif', true)
            ->get()
            ->map(fn ($p) => [
                'id'            => $p->id,
                'mapel'         => $p->mataPelajaran?->nama,
                'guru'          => $p->guru?->nama_lengkap,
                'jumlah_materi' => $p->lms_materi_count,
            ]);

        return Inertia::render('Siswa/Lms/Index', ['pembelajaran' => $pembelajaran]);
    }

    public function show(Pembelajaran $pembelajaran)
    {
        $siswa = auth()->user()->siswa;
        abort_if(!$siswa || $pembelajaran->rombel_id !== $siswa->rombel_id, 403);

        $materiList = LmsMateri::where('pembelajaran_id', $pembelajaran->id)
            ->where('is_aktif', true)
            ->orderBy('pertemuan_ke')
            ->orderBy('urutan')
            ->get();

        $aksesMap = LmsMateriAkses::where('siswa_id', $siswa->id)
            ->whereIn('lms_materi_id', $materiList->pluck('id'))
            ->get()
            ->keyBy('lms_materi_id');

        $materi = $materiList->map(fn ($m) => [
            'id'           => $m->id,
            'pertemuan_ke' => $m->pertemuan_ke,
            'judul'        => $m->judul,
            'deskripsi'    => $m->deskripsi,
            'file_url'     => $m->file_url,
            'file_ext'     => $m->file_ext,
            'url'          => $m->url,
            'is_link'      => $m->is_link,
            'sudah_dilihat' => isset($aksesMap[$m->id]) && $aksesMap[$m->id]->dilihat_at !== null,
        ]);

        return Inertia::render('Siswa/Lms/Show', [
            'pembelajaran' => $pembelajaran->load(['mataPelajaran', 'guru.user']),
            'materi'       => $materi,
        ]);
    }

    public function akses(LmsMateri $materi)
    {
        $siswa = auth()->user()->siswa;
        abort_if(!$siswa || $materi->pembelajaran?->rombel_id !== $siswa->rombel_id, 403);

        $akses = LmsMateriAkses::firstOrNew([
            'lms_materi_id' => $materi->id,
            'siswa_id'      => $siswa->id,
        ]);
        $akses->dilihat_at ??= now();
        if (!$materi->is_link) {
            $akses->diunduh_at ??= now();
        }
        $akses->save();

        if ($materi->file_url) {
            return redirect($materi->file_url);
        }

        return redirect($materi->url);
    }
}

<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\KuisAsesmen;
use App\Models\Rombel;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KuisAsesmenController extends Controller
{
    private function guruId(): ?int
    {
        return auth()->user()->guru?->id;
    }

    private function isAdmin(): bool
    {
        return auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
    }

    public function index()
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();

        $list = KuisAsesmen::with('rombel.kelas', 'guru.user')
            ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $tahunAktif = TahunAjaran::aktif();
        $rombel = $tahunAktif
            ? Rombel::where('tahun_ajaran_id', $tahunAktif->id)->with('kelas')->orderBy('nama')->get()
            : collect();

        return Inertia::render('Guru/KuisAsesmen/Index', [
            'list'    => $list,
            'rombel'  => $rombel,
            'guruId'  => $guruId,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis'     => 'required|in:Kuis,Asesmen',
            'judul'     => 'required|string|max:255',
            'tautan'    => 'required|url|max:500',
            'rombel_id' => 'nullable|exists:rombel,id',
        ]);

        $guruId = $this->guruId();
        if (!$guruId && !$this->isAdmin()) {
            abort(403);
        }

        KuisAsesmen::create([
            'guru_id'   => $guruId,
            'jenis'     => $request->jenis,
            'judul'     => $request->judul,
            'tautan'    => $request->tautan,
            'rombel_id' => $request->rombel_id,
        ]);

        return back()->with('success', ucfirst(strtolower($request->jenis)) . ' berhasil ditambahkan.');
    }

    public function destroy(KuisAsesmen $kuisAsesmen)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();

        if (!$isAdmin && $kuisAsesmen->guru_id !== $guruId) {
            abort(403);
        }

        $kuisAsesmen->delete();
        return back()->with('success', 'Berhasil dihapus.');
    }
}

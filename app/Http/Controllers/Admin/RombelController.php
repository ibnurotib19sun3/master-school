<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use App\Models\Kelas;
use App\Models\Rombel;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RombelController extends Controller
{
    public function index(Request $request)
    {
        $tahunAktif = TahunAjaran::where('is_aktif', true)->first();

        $rombel = Rombel::with(['tahunAjaran', 'kelas', 'jurusanList', 'waliKelas', 'siswa.user'])
            ->when($request->tahun_ajaran_id, fn ($q) => $q->where('tahun_ajaran_id', $request->tahun_ajaran_id))
            ->paginate(15)->withQueryString();

        return Inertia::render('Admin/Rombel/Index', [
            'rombel'      => $rombel,
            'tahunAjaran' => TahunAjaran::orderByDesc('is_aktif')->orderByDesc('id')->get(),
            'tahunAktif'  => $tahunAktif,
            'filters'     => $request->only('tahun_ajaran_id'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'kelas_id'        => 'required|exists:kelas,id',
            'nama'            => 'required|string',
            'kapasitas'       => 'integer|min:1',
            'wali_kelas_id'   => 'nullable|exists:users,id',
            'jurusan_ids'     => 'nullable|array',
            'jurusan_ids.*'   => 'exists:jurusan,id',
        ]);
        $jurusanIds = $data['jurusan_ids'] ?? [];
        unset($data['jurusan_ids']);

        if ($error = $this->cekDuplikatJurusan($data['tahun_ajaran_id'], $data['kelas_id'], $jurusanIds)) {
            return back()->withErrors(['jurusan_ids' => $error]);
        }

        $rombel = Rombel::create($data);
        $rombel->jurusanList()->sync($jurusanIds);
        return back()->with('success', 'Rombel berhasil ditambahkan.');
    }

    public function update(Request $request, Rombel $rombel)
    {
        $data = $request->validate([
            'tahun_ajaran_id' => 'required|exists:tahun_ajaran,id',
            'kelas_id'        => 'required|exists:kelas,id',
            'nama'            => 'required|string',
            'kapasitas'       => 'integer|min:1',
            'wali_kelas_id'   => 'nullable|exists:users,id',
            'is_aktif'        => 'boolean',
            'jurusan_ids'     => 'nullable|array',
            'jurusan_ids.*'   => 'exists:jurusan,id',
        ]);
        $jurusanIds = $data['jurusan_ids'] ?? [];
        unset($data['jurusan_ids']);

        if ($error = $this->cekDuplikatJurusan($data['tahun_ajaran_id'], $data['kelas_id'], $jurusanIds, $rombel->id)) {
            return back()->withErrors(['jurusan_ids' => $error]);
        }

        $rombel->update($data);
        $rombel->jurusanList()->sync($jurusanIds);
        return back()->with('success', 'Rombel berhasil diperbarui.');
    }

    private function cekDuplikatJurusan(int $tahunAjaranId, int $kelasId, array $jurusanIds, ?int $excludeRombelId = null): ?string
    {
        foreach ($jurusanIds as $jurusanId) {
            $query = DB::table('rombel_jurusan')
                ->join('rombel', 'rombel.id', '=', 'rombel_jurusan.rombel_id')
                ->where('rombel.tahun_ajaran_id', $tahunAjaranId)
                ->where('rombel.kelas_id', $kelasId)
                ->where('rombel_jurusan.jurusan_id', $jurusanId)
                ->whereNull('rombel.deleted_at');

            if ($excludeRombelId) {
                $query->where('rombel.id', '!=', $excludeRombelId);
            }

            if ($query->exists()) {
                $namaJurusan = Jurusan::find($jurusanId)?->nama ?? 'Jurusan ini';
                $namaRombel  = DB::table('rombel')
                    ->join('rombel_jurusan', 'rombel.id', '=', 'rombel_jurusan.rombel_id')
                    ->where('rombel.tahun_ajaran_id', $tahunAjaranId)
                    ->where('rombel.kelas_id', $kelasId)
                    ->where('rombel_jurusan.jurusan_id', $jurusanId)
                    ->whereNull('rombel.deleted_at')
                    ->when($excludeRombelId, fn ($q) => $q->where('rombel.id', '!=', $excludeRombelId))
                    ->value('rombel.nama');
                return "{$namaJurusan} sudah terdaftar di rombel \"{$namaRombel}\" pada tingkat dan tahun ajaran yang sama.";
            }
        }
        return null;
    }

    public function destroy(Rombel $rombel)
    {
        $rombel->delete();
        return back()->with('success', 'Rombel berhasil dihapus.');
    }

    public function formData()
    {
        return response()->json([
            'kelas'       => Kelas::all(),
            'jurusan'     => Jurusan::where('is_aktif', true)->get(),
            'tahunAjaran' => TahunAjaran::orderByDesc('is_aktif')->orderByDesc('id')->get(),
            'tahunAktif'  => TahunAjaran::where('is_aktif', true)->first(),
            'guruUsers'   => User::role('guru')->select('id', 'name')->get(),
        ]);
    }
}

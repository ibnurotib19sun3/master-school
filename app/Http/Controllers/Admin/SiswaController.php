<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SiswaExport;
use App\Exports\SiswaTemplateExport;
use App\Imports\SiswaImport;

class SiswaController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->per_page;
        if ($perPage === 'all') {
            $perPage = 9999;
        } else {
            $perPage = in_array((int) $perPage, [25, 50, 75, 100]) ? (int) $perPage : 25;
        }

        $siswa = Siswa::with(['user', 'rombel', 'tahunAjaran'])
            ->when($request->search, fn ($q) => $q->where('nis', 'like', "%{$request->search}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->when($request->rombel_id, fn ($q) => $q->where('rombel_id', $request->rombel_id))
            ->when($request->status, fn ($q) => $q->where('status_siswa', $request->status))
            ->orderBy('nis')
            ->paginate($perPage)->withQueryString();

        $tahunAktif = TahunAjaran::aktif();

        return Inertia::render('Admin/Siswa/Index', [
            'siswa'   => $siswa,
            'rombel'  => $tahunAktif
                ? Rombel::where('tahun_ajaran_id', $tahunAktif->id)
                    ->with(['kelas', 'jurusanList'])
                    ->orderBy('nama')
                    ->get()
                : [],
            'filters' => $request->only('search', 'rombel_id', 'status', 'per_page'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string',
            'email'     => 'required|email|unique:users',
            'nis'       => 'required|unique:siswa',
            'nisn'      => 'nullable|unique:siswa',
            'rombel_id' => 'nullable|exists:rombel,id',
            'jurusan_id'=> 'nullable|exists:jurusan,id',
            'agama'     => 'nullable',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name'          => $request->name,
                'email'         => $request->email,
                'password'      => Hash::make($request->nis),
                'gender'        => $request->gender,
                'tanggal_lahir' => $request->tanggal_lahir,
                'is_active'     => true,
            ]);
            $user->assignRole('siswa');

            Siswa::create([
                'user_id'         => $user->id,
                'nis'             => $request->nis,
                'nisn'            => $request->nisn,
                'tempat_lahir'    => $request->tempat_lahir,
                'agama'           => $request->agama,
                'rombel_id'       => $request->rombel_id ?: null,
                'jurusan_id'      => $request->jurusan_id ?: null,
                'tahun_ajaran_id' => TahunAjaran::aktif()?->id,
                'status_siswa'    => 'Aktif',
                'tanggal_masuk'   => now()->toDateString(),
            ]);
        });

        return back()->with('success', 'Siswa berhasil ditambahkan.');
    }

    public function update(Request $request, Siswa $siswa)
    {
        $request->validate([
            'name'       => 'required|string',
            'nis'        => "required|unique:siswa,nis,{$siswa->id}",
            'rombel_id'  => 'nullable|exists:rombel,id',
            'jurusan_id' => 'nullable|exists:jurusan,id',
        ]);

        DB::transaction(function () use ($request, $siswa) {
            $siswa->user->update([
                'name'          => $request->name,
                'gender'        => $request->gender,
                'tanggal_lahir' => $request->tanggal_lahir,
            ]);
            $siswa->update([
                'nis'          => $request->nis,
                'nisn'         => $request->nisn,
                'tempat_lahir' => $request->tempat_lahir,
                'agama'        => $request->agama,
                'rombel_id'    => $request->rombel_id ?: null,
                'jurusan_id'   => $request->jurusan_id ?: null,
                'status_siswa' => $request->status_siswa ?? 'Aktif',
            ]);
        });

        return back()->with('success', 'Data siswa berhasil diperbarui.');
    }

    public function destroy(Siswa $siswa)
    {
        $siswa->user?->delete();
        $siswa->delete();
        return back()->with('success', 'Siswa berhasil dihapus.');
    }

    public function export(Request $request)
    {
        return Excel::download(new SiswaExport($request->rombel_id), 'data-siswa.xlsx');
    }

    public function template()
    {
        return Excel::download(new SiswaTemplateExport(), 'template-import-siswa.xlsx');
    }

    public function destroyBulk(Request $request)
    {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer']);
        $count = 0;
        foreach (Siswa::with('user')->whereIn('id', $request->ids)->get() as $siswa) {
            $siswa->user?->delete();
            $siswa->delete();
            $count++;
        }
        return back()->with('success', "{$count} siswa berhasil dihapus.");
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv']);
        $rombelId  = $request->rombel_id  ? (int) $request->rombel_id  : null;
        $jurusanId = $request->jurusan_id ? (int) $request->jurusan_id : null;

        try {
            $import = new SiswaImport($rombelId, $jurusanId);
            Excel::import($import, $request->file('file'));
        } catch (\Exception $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }

        $parts = [];
        if ($import->imported > 0) $parts[] = "{$import->imported} siswa berhasil ditambahkan";
        if ($import->duplikat > 0) $parts[] = "{$import->duplikat} dilewati (NIS sudah ada)";
        if ($import->skipped  > 0) $parts[] = "{$import->skipped} baris dilewati (data tidak lengkap)";

        if (empty($parts)) {
            return back()->withErrors(['file' => 'Tidak ada data yang diimport. Periksa isi file dan pastikan kolom NIS serta Nama Lengkap terisi.']);
        }

        $sessionData = ['success' => 'Import selesai: ' . implode(', ', $parts) . '.'];
        if (!empty($import->errors)) {
            $sessionData['import_errors'] = array_slice($import->errors, 0, 10);
        }

        return back()->with($sessionData);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Exports\GuruTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\GuruImport;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class GuruController extends Controller
{
    private const JABATAN_MAP = [
        'Kepala Sekolah'               => 'kepala_sekolah',
        'Wakasek Kurikulum'            => 'wakasek_kurikulum',
        'Wakasek Kesiswaan'            => 'wakasek_kesiswaan',
        'Wakasek Sarana Prasarana'     => 'wakasek_sarpras',
        'Wakasek Humas'                => 'wakasek_humas',
        'Tim Penjamin Mutu Sekolah'    => 'tim_penjamin_mutu',
        'Kepala Konsentrasi Keahlian'  => 'kepala_konsentrasi_keahlian',
        'Kepala Tata Usaha'            => 'kepala_tatausaha',
        'Guru Piket'                   => 'guru_piket',
        'Pokja Kurikulum'              => 'pokja_kurikulum',
        'Pokja Kesiswaan'              => 'pokja_kesiswaan',
        'Pokja Sarpras'                => 'pokja_sarpras',
        'Pokja Humas'                  => 'pokja_humas',
        'Bendahara Sekolah'            => 'bendahara_sekolah',
        'Bimbingan Konseling'          => 'bimbingan_konseling',
    ];

    private function rolesFromJabatan(array $jabatan): array
    {
        $roles = ['guru'];
        foreach ($jabatan as $j) {
            if (isset(self::JABATAN_MAP[$j])) {
                $roles[] = self::JABATAN_MAP[$j];
            }
        }
        return array_unique($roles);
    }

    /**
     * Sync guru roles tanpa menghapus role non-guru (mis. tatausaha) yang mungkin dimiliki user.
     */
    private function applyGuruRoles(User $user, array $jabatan): void
    {
        $guruRoles   = $this->rolesFromJabatan($jabatan);
        $guruManaged = array_merge(['guru'], array_values(self::JABATAN_MAP));

        $preserved = $user->roles->pluck('name')
            ->reject(fn ($r) => in_array($r, $guruManaged))
            ->toArray();

        $user->syncRoles(array_unique(array_merge($guruRoles, $preserved)));
    }

    public function index(Request $request)
    {
        $guru = Guru::with('user')
            ->when($request->search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->paginate(15)->withQueryString();

        $mataPelajaran = MataPelajaran::orderBy('nama')->get(['id', 'nama']);

        return Inertia::render('Admin/Guru/Index', [
            'guru'          => $guru,
            'filters'       => $request->only('search'),
            'mataPelajaran' => $mataPelajaran,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'               => 'required|string',
            'email'              => 'required|email|unique:users',
            'password'           => 'required|min:8',
            'nip'                => 'nullable|unique:guru',
            'nuptk'              => 'nullable|unique:guru',
            'nomor_wa'           => 'nullable|string|max:20|unique:guru,nomor_wa',
            'status_kepegawaian' => 'required',
            'pendidikan_terakhir'=> 'nullable',
            'bidang_studi'       => 'nullable|array',
            'bidang_studi.*'     => 'integer|exists:mata_pelajaran,id',
            'jabatan'            => 'nullable|array',
            'jabatan.*'          => 'string',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                'gender'    => $request->gender,
                'is_active' => true,
            ]);
            $this->applyGuruRoles($user, $request->jabatan ?? []);

            Guru::create([
                'user_id'             => $user->id,
                'nip'                 => $request->nip,
                'nuptk'               => $request->nuptk,
                'gelar_depan'         => $request->gelar_depan,
                'gelar_belakang'      => $request->gelar_belakang,
                'status_kepegawaian'  => $request->status_kepegawaian,
                'pendidikan_terakhir' => $request->pendidikan_terakhir,
                'bidang_studi'        => array_map('intval', $request->bidang_studi ?? []),
                'jabatan'             => $request->jabatan ?? [],
                'tanggal_masuk'       => $request->tanggal_masuk,
                'nomor_wa'            => $request->nomor_wa,
            ]);
        });

        return back()->with('success', 'Guru berhasil ditambahkan.');
    }

    public function update(Request $request, Guru $guru)
    {
        $request->validate([
            'name'               => 'required|string',
            'email'              => "required|email|unique:users,email,{$guru->user_id}",
            'nip'                => "nullable|unique:guru,nip,{$guru->id}",
            'nuptk'              => "nullable|unique:guru,nuptk,{$guru->id}",
            'nomor_wa'           => "nullable|string|max:20|unique:guru,nomor_wa,{$guru->id}",
            'status_kepegawaian' => 'required',
            'bidang_studi'       => 'nullable|array',
            'bidang_studi.*'     => 'integer|exists:mata_pelajaran,id',
            'jabatan'            => 'nullable|array',
            'jabatan.*'          => 'string',
        ]);

        DB::transaction(function () use ($request, $guru) {
            $guru->user->update([
                'name'      => $request->name,
                'email'     => $request->email,
                'gender'    => $request->gender,
                'is_active' => $request->boolean('is_active', true),
            ]);
            $this->applyGuruRoles($guru->user, $request->jabatan ?? []);

            $guru->update([
                'nip'                 => $request->nip,
                'nuptk'               => $request->nuptk,
                'gelar_depan'         => $request->gelar_depan,
                'gelar_belakang'      => $request->gelar_belakang,
                'status_kepegawaian'  => $request->status_kepegawaian,
                'pendidikan_terakhir' => $request->pendidikan_terakhir,
                'bidang_studi'        => array_map('intval', $request->bidang_studi ?? []),
                'jabatan'             => $request->jabatan ?? [],
                'tanggal_masuk'       => $request->tanggal_masuk,
                'nomor_wa'            => $request->nomor_wa,
            ]);
        });

        return back()->with('success', 'Data guru berhasil diperbarui.');
    }

    public function destroy(Guru $guru)
    {
        $user = $guru->user;
        $guru->delete();
        $user?->delete();
        return back()->with('success', 'Guru berhasil dihapus.');
    }

    public function importTemplate()
    {
        return Excel::download(new GuruTemplateExport(), 'template_import_guru.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:5120']);

        $import = new GuruImport();

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: ' . $e->getMessage()]);
        }

        $msg = "Import selesai: {$import->imported} berhasil";
        if ($import->duplikat) $msg .= ", {$import->duplikat} duplikat dilewati";
        if ($import->skipped)  $msg .= ", {$import->skipped} baris dilewati";
        $msg .= '.';

        $sessionData = ['success' => $msg];
        if ($import->errors) {
            $sessionData['import_errors'] = array_slice($import->errors, 0, 10);
        }

        return back()->with($sessionData);
    }

    public function jadwalDetail(Guru $guru)
    {
        $hariOrder = ['Senin' => 0, 'Selasa' => 1, 'Rabu' => 2, 'Kamis' => 3, 'Jumat' => 4, 'Sabtu' => 5, 'Ahad' => 6];

        $jadwal = Jadwal::with(['pembelajaran.mataPelajaran', 'pembelajaran.rombel', 'pembelajaran.jurusan'])
            ->whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $guru->id)->where('is_aktif', true))
            ->where('is_aktif', true)
            ->get()
            ->sortBy([
                fn ($a, $b) => ($hariOrder[$a->hari] ?? 9) - ($hariOrder[$b->hari] ?? 9),
                fn ($a, $b) => $a->jam_ke - $b->jam_ke,
            ])
            ->values()
            ->map(fn ($j) => [
                'id'             => $j->id,
                'hari'           => $j->hari,
                'jam_ke'         => $j->jam_ke,
                'jam_mulai'      => substr((string) $j->jam_mulai, 0, 5),
                'jam_selesai'    => substr((string) $j->jam_selesai, 0, 5),
                'mata_pelajaran' => $j->pembelajaran?->mataPelajaran?->nama ?? '–',
                'rombel'         => $j->pembelajaran?->rombel?->nama ?? '–',
                'jurusan'        => $j->pembelajaran?->jurusan?->kode ?? null,
            ]);

        return response()->json(['jadwal' => $jadwal]);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer']);
        $count = 0;
        foreach (Guru::with('user')->whereIn('id', $request->ids)->get() as $guru) {
            $guru->user?->delete();
            $count++;
        }
        return back()->with('success', "{$count} guru berhasil dihapus.");
    }
}

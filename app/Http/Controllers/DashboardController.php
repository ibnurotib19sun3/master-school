<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\Tatausaha;
use App\Models\TahunAjaran;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user       = auth()->user();
        $tahunAktif = TahunAjaran::aktif();

        $stats = [
            'total_siswa'  => Siswa::where('status_siswa', 'Aktif')->count(),
            'total_guru'   => Guru::where('is_aktif', true)->count(),
            'total_rombel' => $tahunAktif ? Rombel::where('tahun_ajaran_id', $tahunAktif->id)->count() : 0,
            'total_users'  => User::count(),
            'tahun_aktif'  => $tahunAktif,
        ];

        if ($user->hasRole('guru')) {
            $guru = $user->guru;
            $stats['pembelajaran_saya'] = $guru
                ? $guru->pembelajaran()->where('tahun_ajaran_id', optional($tahunAktif)->id)->count()
                : 0;
        }

        $charts = [];
        if ($user->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'])) {
            // Gender PTK
            $gg = Guru::join('users', 'guru.user_id', '=', 'users.id')
                ->where('guru.is_aktif', true)
                ->selectRaw("COALESCE(users.gender, '') as g, COUNT(*) as cnt")
                ->groupBy('g')->get()->keyBy('g');
            $charts['gender_guru'] = [
                ['label' => 'Laki-laki', 'value' => (int)($gg['L']->cnt ?? 0)],
                ['label' => 'Perempuan',  'value' => (int)($gg['P']->cnt ?? 0)],
            ];

            // Status Kepegawaian PTK
            $charts['status_guru'] = Guru::where('is_aktif', true)
                ->selectRaw('status_kepegawaian as label, COUNT(*) as value')
                ->groupBy('status_kepegawaian')
                ->orderByDesc('value')
                ->get()
                ->map(fn ($r) => ['label' => $r->label, 'value' => (int)$r->value])
                ->toArray();

            // Pendidikan PTK (sorted by level)
            $pendOrder = array_flip(['D3', 'D4', 'S1', 'S2', 'S3']);
            $charts['pendidikan_guru'] = Guru::where('is_aktif', true)
                ->whereNotNull('pendidikan_terakhir')
                ->selectRaw('pendidikan_terakhir as label, COUNT(*) as value')
                ->groupBy('pendidikan_terakhir')
                ->get()
                ->sortBy(fn ($r) => $pendOrder[$r->label] ?? 99)
                ->values()
                ->map(fn ($r) => ['label' => $r->label, 'value' => (int)$r->value])
                ->toArray();

            // Gender Tata Usaha
            $gt = Tatausaha::join('users', 'tatausaha.user_id', '=', 'users.id')
                ->where('tatausaha.is_aktif', true)
                ->selectRaw("COALESCE(users.gender, '') as g, COUNT(*) as cnt")
                ->groupBy('g')->get()->keyBy('g');
            $charts['gender_tatausaha'] = [
                ['label' => 'Laki-laki', 'value' => (int)($gt['L']->cnt ?? 0)],
                ['label' => 'Perempuan',  'value' => (int)($gt['P']->cnt ?? 0)],
            ];

            // Gender Siswa
            $gs = Siswa::join('users', 'siswa.user_id', '=', 'users.id')
                ->where('siswa.status_siswa', 'Aktif')
                ->selectRaw("COALESCE(users.gender, '') as g, COUNT(*) as cnt")
                ->groupBy('g')->get()->keyBy('g');
            $charts['gender_siswa'] = [
                ['label' => 'Laki-laki', 'value' => (int)($gs['L']->cnt ?? 0)],
                ['label' => 'Perempuan',  'value' => (int)($gs['P']->cnt ?? 0)],
            ];

            // Siswa per Jurusan
            $charts['siswa_per_jurusan'] = Siswa::join('jurusan', 'siswa.jurusan_id', '=', 'jurusan.id')
                ->where('siswa.status_siswa', 'Aktif')
                ->selectRaw('jurusan.kode as label, jurusan.nama as nama, COUNT(*) as value')
                ->groupBy('jurusan.id', 'jurusan.kode', 'jurusan.nama')
                ->orderByDesc('value')
                ->get()
                ->map(fn ($r) => ['label' => $r->label ?: $r->nama, 'nama' => $r->nama, 'value' => (int)$r->value])
                ->toArray();
        }

        return Inertia::render('Dashboard', compact('stats', 'charts'));
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\CatatanKepsek;
use App\Models\KpiGuru;
use App\Models\KpiTatausaha;
use App\Models\Masukan;
use App\Models\MenuBadge;
use App\Models\PengumpulanTugas;
use App\Models\PesanPopup;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id'           => $request->user()->id,
                    'name'         => $request->user()->name,
                    'nama_lengkap' => $this->namaLengkap($request->user()),
                    'email'        => $request->user()->email,
                    'avatar_url'   => $request->user()->avatar_url,
                    'roles'        => $request->user()->getRoleNames(),
                    'permissions'  => $request->user()->getAllPermissions()->pluck('name'),
                    'is_guru_bk'          => $request->user()->hasRole('guru') && in_array('Bimbingan Konseling', (array) ($request->user()->guru?->jabatan ?? [])),
                    'is_tu_surat'         => $request->user()->hasRole('tatausaha') && $request->user()->tatausaha?->jabatan === 'Tatausaha',
                    'wali_kelas_rombel_id' => $request->user()->hasRole('guru')
                        ? \App\Models\Rombel::where('wali_kelas_id', $request->user()->id)->where('is_aktif', true)->value('id')
                        : null,
                ] : null,
            ],
            'flash' => [
                'success'          => fn () => $request->session()->get('success'),
                'error'            => fn () => $request->session()->get('error'),
                'info'             => fn () => $request->session()->get('info'),
                'login_success'    => fn () => $request->session()->get('login_success'),
                'import_errors'    => fn () => $request->session()->get('import_errors'),
                'redirect_message' => fn () => $request->session()->get('redirect_message'),
            ],
            'active_popup'  => fn () => $request->user() ? PesanPopup::getAktif() : null,
            'menu_badges'   => fn () => MenuBadge::asMap(),
            'notifikasi'    => fn () => $request->user() ? $this->hitungNotifikasi($request->user()) : null,
            'online_count'  => fn () => $request->user() && $request->user()->hasAnyRole(['super_admin', 'kepala_sekolah'])
                ? \App\Models\User::where('last_seen_at', '>=', now()->subMinutes(5))->count()
                : null,
        ];
    }

    private function namaLengkap(\App\Models\User $user): string
    {
        if ($guru = $user->guru) {
            $depan    = $guru->gelar_depan    ? $guru->gelar_depan . ' '    : '';
            $belakang = $guru->gelar_belakang ? ', ' . $guru->gelar_belakang : '';
            return $depan . $user->name . $belakang;
        }
        if ($tu = $user->tatausaha) {
            $depan    = $tu->gelar_depan    ? $tu->gelar_depan . ' '    : '';
            $belakang = $tu->gelar_belakang ? ', ' . $tu->gelar_belakang : '';
            return $depan . $user->name . $belakang;
        }
        return $user->name;
    }

    private function hitungNotifikasi(\App\Models\User $user): array
    {
        $catatan     = 0;
        $pengumpulan = 0;
        $kpi         = 0;
        $masukan     = 0;

        // Untuk guru: catatan kepsek belum dibaca + pengumpulan siswa belum dinilai
        if ($guruId = $user->guru?->id) {
            $catatan = CatatanKepsek::where('guru_id', $guruId)
                ->whereNull('dibaca_pada')
                ->count();

            $pengumpulan = PengumpulanTugas::whereHas(
                'assessment.pembelajaran',
                fn ($q) => $q->where('guru_id', $guruId)
            )->whereNull('nilai')->count();
        }

        // Untuk super_admin: masukan baru dari user
        if ($user->hasRole('super_admin')) {
            $masukan = Masukan::where('status', 'Baru')->count();
        }

        // Untuk kepsek/admin: laporan KPI belum dinilai
        if ($user->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum'])) {
            $tahunId = TahunAjaran::where('is_aktif', true)->value('id');
            if ($tahunId) {
                $kpi = KpiGuru::where('tahun_ajaran_id', $tahunId)
                    ->whereNull('dinilai_oleh')
                    ->where('persen', '>', 0)
                    ->count()
                    + KpiTatausaha::where('tahun_ajaran_id', $tahunId)
                    ->whereNull('dinilai_oleh')
                    ->where('persen', '>', 0)
                    ->count();
            }
        }

        return [
            'catatan_kepsek' => $catatan,
            'pengumpulan'    => $pengumpulan,
            'kpi'            => $kpi,
            'masukan'        => $masukan,
            'total'          => $catatan + $pengumpulan + $kpi + $masukan,
        ];
    }
}

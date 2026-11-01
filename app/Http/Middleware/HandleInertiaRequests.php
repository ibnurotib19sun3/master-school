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
            'app_name'    => config('app.name', 'APIKMAS DJurnal'),
            'app_version' => config('app.version'),
            'sekolah'     => fn () => \App\Models\PengaturanSekolah::current(),
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
                'plain_token'      => fn () => $request->session()->get('plain_token'),
            ],
            'active_popup'  => fn () => $request->user() ? PesanPopup::getAktif() : null,
            'kpi_popup'     => fn () => $request->user() ? $this->getKpiPopup($request->user()) : null,
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

    private function getKpiPopup(\App\Models\User $user): ?array
    {
        $namaBulan = [
            '01' => 'Januari', '02' => 'Februari', '03' => 'Maret',
            '04' => 'April',   '05' => 'Mei',      '06' => 'Juni',
            '07' => 'Juli',    '08' => 'Agustus',  '09' => 'September',
            '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
        ];

        // 1. Cek KPI Guru unread
        if ($guru = $user->guru) {
            $latestUnread = KpiGuru::where('guru_id', $guru->id)
                ->whereNull('dibaca_pada')
                ->latest('bulan')
                ->first();

            if ($latestUnread) {
                $bulan = $latestUnread->bulan;
                $items = KpiGuru::with('indikator')
                    ->where('guru_id', $guru->id)
                    ->where('bulan', $bulan)
                    ->get();

                $totalNilai = round($items->sum('nilai'), 2);
                $predikat = match (true) {
                    $totalNilai >= 90 => ['label' => 'Sangat Baik', 'grade' => 'A', 'color' => 'emerald'],
                    $totalNilai >= 80 => ['label' => 'Baik', 'grade' => 'B', 'color' => 'sky'],
                    $totalNilai >= 70 => ['label' => 'Cukup', 'grade' => 'C', 'color' => 'amber'],
                    default           => ['label' => 'Kurang', 'grade' => 'D', 'color' => 'rose'],
                };

                $bulanParts = explode('-', $bulan);
                $bulanFormatted = ($namaBulan[$bulanParts[1] ?? ''] ?? '') . ' ' . ($bulanParts[0] ?? '');

                return [
                    'id'            => $latestUnread->id,
                    'tipe'          => 'guru',
                    'role_label'    => 'Guru',
                    'nama'          => $user->name,
                    'bulan'         => $bulan,
                    'bulan_format'  => trim($bulanFormatted) ?: $bulan,
                    'total_nilai'   => $totalNilai,
                    'predikat'      => $predikat,
                    'catatan'       => $items->firstWhere('catatan', '!=', null)?->catatan ?? null,
                    'detail_url'    => '/guru/kpi',
                    'indikator'     => $items->map(fn ($it) => [
                        'nama'   => $it->indikator?->nama ?? $it->indikator?->kode ?? 'Indikator',
                        'persen' => (float) $it->persen,
                        'bobot'  => (float) $it->bobot_snapshot,
                        'nilai'  => (float) $it->nilai,
                    ])->values()->all(),
                ];
            }
        }

        // 2. Cek KPI Tata Usaha unread
        if ($tu = $user->tatausaha) {
            $latestUnread = KpiTatausaha::where('tatausaha_id', $tu->id)
                ->whereNull('dibaca_pada')
                ->latest('bulan')
                ->first();

            if ($latestUnread) {
                $bulan = $latestUnread->bulan;
                $items = KpiTatausaha::with('indikator')
                    ->where('tatausaha_id', $tu->id)
                    ->where('bulan', $bulan)
                    ->get();

                $totalNilai = round($items->sum('nilai'), 2);
                $predikat = match (true) {
                    $totalNilai >= 90 => ['label' => 'Sangat Baik', 'grade' => 'A', 'color' => 'emerald'],
                    $totalNilai >= 80 => ['label' => 'Baik', 'grade' => 'B', 'color' => 'sky'],
                    $totalNilai >= 70 => ['label' => 'Cukup', 'grade' => 'C', 'color' => 'amber'],
                    default           => ['label' => 'Kurang', 'grade' => 'D', 'color' => 'rose'],
                };

                $bulanParts = explode('-', $bulan);
                $bulanFormatted = ($namaBulan[$bulanParts[1] ?? ''] ?? '') . ' ' . ($bulanParts[0] ?? '');

                return [
                    'id'            => $latestUnread->id,
                    'tipe'          => 'tatausaha',
                    'role_label'    => 'Tata Usaha',
                    'nama'          => $user->name,
                    'bulan'         => $bulan,
                    'bulan_format'  => trim($bulanFormatted) ?: $bulan,
                    'total_nilai'   => $totalNilai,
                    'predikat'      => $predikat,
                    'catatan'       => $items->firstWhere('catatan', '!=', null)?->catatan ?? null,
                    'detail_url'    => '/tatausaha/kpi',
                    'indikator'     => $items->map(fn ($it) => [
                        'nama'   => $it->indikator?->nama ?? $it->indikator?->kode ?? 'Indikator',
                        'persen' => (float) $it->persen,
                        'bobot'  => (float) $it->bobot_snapshot,
                        'nilai'  => (float) $it->nilai,
                    ])->values()->all(),
                ];
            }
        }

        return null;
    }
}

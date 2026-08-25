<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JurnalPokja;
use App\Models\JurnalTatausaha;
use App\Models\Tatausaha;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurnalBawahanController extends Controller
{
    private function config(): array
    {
        $user = auth()->user();

        if ($user->hasRole('wakasek_kurikulum')) {
            return [
                'roles'      => ['pokja_kurikulum'],
                'label'      => 'Pokja Kurikulum',
                'type'       => 'pokja',
                'supervisor' => 'Wakasek Kurikulum',
            ];
        }

        if ($user->hasRole('wakasek_kesiswaan')) {
            return [
                'roles'      => ['pokja_kesiswaan', 'bimbingan_konseling'],
                'label'      => 'Pokja Kesiswaan & BK',
                'type'       => 'pokja',
                'supervisor' => 'Wakasek Kesiswaan',
            ];
        }

        if ($user->hasRole('wakasek_sarpras')) {
            return [
                'roles'      => ['pokja_sarpras'],
                'label'      => 'Pokja Sarana Prasarana',
                'type'       => 'pokja',
                'supervisor' => 'Wakasek Sarana Prasarana',
            ];
        }

        if ($user->hasRole('wakasek_humas')) {
            return [
                'roles'      => ['pokja_humas'],
                'label'      => 'Pokja Humas',
                'type'       => 'pokja',
                'supervisor' => 'Wakasek Humas',
            ];
        }

        if ($user->hasRole('kepala_tatausaha')) {
            return [
                'role'       => 'tatausaha',
                'label'      => 'Staf Tata Usaha',
                'type'       => 'tatausaha',
                'supervisor' => 'Kepala Tata Usaha',
            ];
        }

        return ['type' => 'none', 'label' => '', 'supervisor' => ''];
    }

    public function index(Request $request)
    {
        $cfg = $this->config();

        if ($cfg['type'] === 'pokja') {
            $roles = $cfg['roles'];

            $staffList = Guru::with('user')
                ->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $roles)))
                ->where('is_aktif', true)
                ->orderBy('id')
                ->get()
                ->map(fn ($g) => [
                    'id'      => $g->id,
                    'nama'    => $g->user?->name ?? '—',
                    'jabatan' => collect($g->jabatan ?? [])->first(fn ($j) => str_starts_with($j, 'Pokja ') || $j === 'Bimbingan Konseling') ?? $cfg['label'],
                ])->values();

            $riwayat = JurnalPokja::with(['guru.user', 'tahunAjaran'])
                ->whereHas('guru.user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $roles)))
                ->when($request->staff,  fn ($q) => $q->where('guru_id', $request->staff))
                ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
                ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
                ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
                ->latest('tanggal')
                ->paginate(20)
                ->withQueryString();
        } elseif ($cfg['type'] === 'tatausaha') {
            $staffList = Tatausaha::with('user')
                ->where('is_aktif', true)
                ->orderBy('id')
                ->get()
                ->map(fn ($t) => [
                    'id'      => $t->id,
                    'nama'    => $t->user?->name ?? '—',
                    'jabatan' => $t->jabatan ?? 'Tata Usaha',
                ])->values();

            $riwayat = JurnalTatausaha::with(['tatausaha.user', 'tahunAjaran'])
                ->when($request->staff,  fn ($q) => $q->where('tatausaha_id', $request->staff))
                ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
                ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
                ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
                ->latest('tanggal')
                ->paginate(20)
                ->withQueryString();
        } else {
            abort(403);
        }

        return Inertia::render('Pimpinan/Jurnal/Bawahan', [
            'riwayat'    => $riwayat,
            'staffList'  => $staffList,
            'filters'    => $request->only('staff', 'dari', 'sampai', 'q'),
            'type'       => $cfg['type'],
            'label'      => $cfg['label'],
            'supervisor' => $cfg['supervisor'],
        ]);
    }
}

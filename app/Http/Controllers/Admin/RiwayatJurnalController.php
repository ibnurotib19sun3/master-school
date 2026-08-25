<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JurnalPimpinan;
use App\Models\JurnalPokja;
use App\Models\JurnalTatausaha;
use App\Models\Tatausaha;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiwayatJurnalController extends Controller
{
    public function tatausaha(Request $request)
    {
        $staffList = Tatausaha::with('user')
            ->where('is_aktif', true)
            ->orderBy('id')
            ->get()
            ->map(fn ($t) => [
                'id'      => $t->id,
                'nama'    => $t->user?->name ?? '—',
                'jabatan' => $t->jabatan ?? '',
            ])->values();

        $riwayat = JurnalTatausaha::with(['tatausaha.user', 'tahunAjaran'])
            ->when($request->staff,  fn ($q) => $q->where('tatausaha_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/TataUsaha', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
        ]);
    }

    public function pokja(Request $request)
    {
        $pokjaRoles = ['pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras', 'pokja_humas', 'bimbingan_konseling'];

        $staffList = Guru::with('user')
            ->whereHas('user', fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $pokjaRoles)))
            ->where('is_aktif', true)
            ->orderBy('id')
            ->get()
            ->map(fn ($g) => [
                'id'      => $g->id,
                'nama'    => $g->user?->name ?? '—',
                'jabatan' => collect($g->jabatan ?? [])
                    ->first(fn ($j) => str_starts_with($j, 'Pokja ') || $j === 'Bimbingan Konseling') ?? 'Pokja',
            ])->values();

        $riwayat = JurnalPokja::with(['guru.user', 'tahunAjaran'])
            ->when($request->staff,  fn ($q) => $q->where('guru_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/Pokja', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
        ]);
    }

    public function wakasek(Request $request)
    {
        $wakasekRoles  = ['wakasek_kurikulum', 'wakasek_kesiswaan', 'wakasek_sarpras', 'wakasek_humas', 'tim_penjamin_mutu'];
        $jabatanList   = ['Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Wakasek Sarana Prasarana', 'Wakasek Humas', 'Tim Penjamin Mutu Sekolah'];
        $jabatanByRole = [
            'wakasek_kurikulum' => 'Wakasek Kurikulum',
            'wakasek_kesiswaan' => 'Wakasek Kesiswaan',
            'wakasek_sarpras'   => 'Wakasek Sarana Prasarana',
            'wakasek_humas'     => 'Wakasek Humas',
            'tim_penjamin_mutu' => 'Tim Penjamin Mutu Sekolah',
        ];

        $staffList = User::role($wakasekRoles)
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'      => $u->id,
                'nama'    => $u->name,
                'jabatan' => collect($jabatanByRole)->first(fn ($label, $role) => $u->hasRole($role)) ?? 'Wakasek',
            ])->values();

        $riwayat = JurnalPimpinan::with(['user', 'tahunAjaran'])
            ->whereIn('jabatan', $jabatanList)
            ->when($request->staff,  fn ($q) => $q->where('user_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/Pimpinan', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
            'title'     => 'Wakasek',
            'basePath'  => '/admin/riwayat-jurnal/wakasek',
        ]);
    }

    public function kepalaKK(Request $request)
    {
        $staffList = User::role('kepala_konsentrasi_keahlian')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'      => $u->id,
                'nama'    => $u->name,
                'jabatan' => 'Kepala Konsentrasi Keahlian',
            ])->values();

        $riwayat = JurnalPimpinan::with(['user', 'tahunAjaran'])
            ->where('jabatan', 'Kepala Konsentrasi Keahlian')
            ->when($request->staff,  fn ($q) => $q->where('user_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/Pimpinan', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
            'title'     => 'Kepala Konsentrasi Keahlian',
            'basePath'  => '/admin/riwayat-jurnal/kepala-kk',
        ]);
    }

    public function kepalaSekolah(Request $request)
    {
        $staffList = User::role('kepala_sekolah')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'      => $u->id,
                'nama'    => $u->name,
                'jabatan' => 'Kepala Sekolah',
            ])->values();

        $riwayat = JurnalPimpinan::with(['user', 'tahunAjaran'])
            ->where('jabatan', 'Kepala Sekolah')
            ->when($request->staff,  fn ($q) => $q->where('user_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/Pimpinan', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
            'title'     => 'Kepala Sekolah',
            'basePath'  => '/admin/riwayat-jurnal/kepala-sekolah',
        ]);
    }

    public function kepalaTU(Request $request)
    {
        $staffList = User::role('kepala_tatausaha')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'      => $u->id,
                'nama'    => $u->name,
                'jabatan' => 'Kepala Tata Usaha',
            ])->values();

        $riwayat = JurnalPimpinan::with(['user', 'tahunAjaran'])
            ->where('jabatan', 'Kepala Tata Usaha')
            ->when($request->staff,  fn ($q) => $q->where('user_id', $request->staff))
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/RiwayatJurnal/Pimpinan', [
            'riwayat'   => $riwayat,
            'staffList' => $staffList,
            'filters'   => $request->only('staff', 'dari', 'sampai', 'q'),
            'title'     => 'Kepala Tata Usaha',
            'basePath'  => '/admin/riwayat-jurnal/kepala-tu',
        ]);
    }
}

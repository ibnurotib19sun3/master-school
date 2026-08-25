<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tatausaha;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TatausahaController extends Controller
{
    public function index(Request $request)
    {
        $tatausaha = Tatausaha::with('user')
            ->when($request->search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->paginate(15)
            ->withQueryString();

        // User yang belum punya record tatausaha (aktif) — untuk opsi merangkap
        $sudahTu = Tatausaha::pluck('user_id');
        $availableUsers = User::whereNotIn('id', $sudahTu)
            ->whereHas('roles', fn ($q) => $q->where('name', 'guru'))
            ->with('roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'roles' => $u->roles->pluck('name')->map(fn ($r) => str_replace('_', ' ', ucfirst($r)))->join(', '),
            ]);

        return Inertia::render('Admin/Tatausaha/Index', [
            'tatausaha'      => $tatausaha,
            'filters'        => $request->only('search'),
            'availableUsers' => $availableUsers,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->boolean('dari_akun_ada')) {
            // ── Mode merangkap: gunakan user yang sudah ada ──────────────
            $request->validate([
                'existing_user_id'    => 'required|exists:users,id',
                'jabatan'             => 'required|in:Tatausaha,Keuangan,Operator,Kebersihan,Keamanan,Penjaga Kantin,Toolman',
                'nip'                 => 'nullable|unique:tatausaha',
                'gelar_depan'         => 'nullable|string|max:50',
                'gelar_belakang'      => 'nullable|string|max:50',
                'status_kepegawaian'  => 'nullable|string|max:50',
                'tanggal_masuk'       => 'nullable|date',
                'pendidikan_terakhir' => 'nullable|string|max:50',
                'nomor_wa'            => 'nullable|string|max:20|unique:tatausaha,nomor_wa',
            ]);

            DB::transaction(function () use ($request) {
                $user = User::findOrFail($request->existing_user_id);
                $user->assignRole('tatausaha'); // tambah role, tidak hapus role lain

                Tatausaha::create([
                    'user_id'             => $user->id,
                    'nip'                 => $request->nip ?: null,
                    'gelar_depan'         => $request->gelar_depan ?: null,
                    'gelar_belakang'      => $request->gelar_belakang ?: null,
                    'jabatan'             => $request->jabatan,
                    'status_kepegawaian'  => $request->status_kepegawaian ?: null,
                    'tanggal_masuk'       => $request->tanggal_masuk ?: null,
                    'pendidikan_terakhir' => $request->pendidikan_terakhir ?: null,
                    'nomor_wa'            => $request->nomor_wa,
                    'is_aktif'            => true,
                ]);
            });

            return back()->with('success', 'Tata usaha (merangkap) berhasil ditambahkan.');
        }

        // ── Mode normal: buat akun baru ──────────────────────────────────
        $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:users',
            'password'            => 'required|min:8',
            'gender'              => 'nullable|in:L,P',
            'nip'                 => 'nullable|unique:tatausaha',
            'gelar_depan'         => 'nullable|string|max:50',
            'gelar_belakang'      => 'nullable|string|max:50',
            'jabatan'             => 'required|in:Tatausaha,Keuangan,Operator,Kebersihan,Keamanan,Penjaga Kantin,Toolman',
            'status_kepegawaian'  => 'nullable|string|max:50',
            'tanggal_masuk'       => 'nullable|date',
            'pendidikan_terakhir' => 'nullable|string|max:50',
            'nomor_wa'            => 'nullable|string|max:20|unique:tatausaha,nomor_wa',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name'           => $request->name,
                'email'          => $request->email,
                'password'       => Hash::make($request->password),
                'plain_password' => $request->password,
                'gender'         => $request->gender,
                'is_active'      => true,
            ]);
            $user->assignRole('tatausaha');

            Tatausaha::create([
                'user_id'             => $user->id,
                'nip'                 => $request->nip ?: null,
                'gelar_depan'         => $request->gelar_depan ?: null,
                'gelar_belakang'      => $request->gelar_belakang ?: null,
                'jabatan'             => $request->jabatan,
                'status_kepegawaian'  => $request->status_kepegawaian ?: null,
                'tanggal_masuk'       => $request->tanggal_masuk ?: null,
                'pendidikan_terakhir' => $request->pendidikan_terakhir ?: null,
                'nomor_wa'            => $request->nomor_wa,
                'is_aktif'            => true,
            ]);
        });

        return back()->with('success', 'Tata usaha berhasil ditambahkan.');
    }

    public function update(Request $request, Tatausaha $tatausaha)
    {
        $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => "required|email|unique:users,email,{$tatausaha->user_id}",
            'gender'              => 'nullable|in:L,P',
            'nip'                 => "nullable|unique:tatausaha,nip,{$tatausaha->id}",
            'gelar_depan'         => 'nullable|string|max:50',
            'gelar_belakang'      => 'nullable|string|max:50',
            'jabatan'             => 'required|in:Tatausaha,Keuangan,Operator,Kebersihan,Keamanan,Penjaga Kantin,Toolman',
            'status_kepegawaian'  => 'nullable|string|max:50',
            'tanggal_masuk'       => 'nullable|date',
            'pendidikan_terakhir' => 'nullable|string|max:50',
            'nomor_wa'            => "nullable|string|max:20|unique:tatausaha,nomor_wa,{$tatausaha->id}",
        ]);

        DB::transaction(function () use ($request, $tatausaha) {
            $tatausaha->user->update([
                'name'      => $request->name,
                'email'     => $request->email,
                'gender'    => $request->gender,
                'is_active' => $request->boolean('is_active', true),
            ]);

            $tatausaha->update([
                'nip'                 => $request->nip ?: null,
                'gelar_depan'         => $request->gelar_depan ?: null,
                'gelar_belakang'      => $request->gelar_belakang ?: null,
                'jabatan'             => $request->jabatan,
                'status_kepegawaian'  => $request->status_kepegawaian ?: null,
                'tanggal_masuk'       => $request->tanggal_masuk ?: null,
                'pendidikan_terakhir' => $request->pendidikan_terakhir ?: null,
                'nomor_wa'            => $request->nomor_wa,
                'is_aktif'            => $request->boolean('is_aktif', true),
            ]);
        });

        return back()->with('success', 'Data tata usaha berhasil diperbarui.');
    }

    public function destroy(Tatausaha $tatausaha)
    {
        $user = $tatausaha->user;
        $tatausaha->delete();

        if ($user) {
            $rolesLain = $user->roles->filter(fn ($r) => $r->name !== 'tatausaha');

            if ($rolesLain->isNotEmpty()) {
                // Merangkap — cabut role tatausaha saja, jangan hapus akun
                $user->removeRole('tatausaha');
            } else {
                // Murni TU — hapus akun juga
                $user->removeRole('tatausaha');
                $user->delete();
            }
        }

        return back()->with('success', 'Data tata usaha berhasil dihapus.');
    }
}

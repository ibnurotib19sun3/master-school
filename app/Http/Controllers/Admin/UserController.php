<?php

namespace App\Http\Controllers\Admin;

use App\Exports\UsersExport;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $staffRoles  = ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
                        'guru', 'tatausaha', 'kepala_tatausaha', 'guru_piket'];
        $studentRoles = ['siswa', 'orang_tua'];

        $tab     = in_array($request->get('tab'), ['murid']) ? 'murid' : 'staff';
        $perPage = (int) $request->get('per_page', 15);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 15;

        $sort      = in_array($request->get('sort'), ['name', 'created_at']) ? $request->get('sort') : 'created_at';
        $direction = $request->get('direction') === 'desc' ? 'desc' : 'asc';

        $users = User::with('roles')
            ->when($request->search, fn ($q) => $q->where(fn ($sub) => $sub
                ->where('name',  'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")
            ))
            ->when($request->role, fn ($q) => $q->role($request->role))
            ->when($tab === 'murid',
                fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $studentRoles)),
                fn ($q) => $q->whereHas('roles', fn ($r) => $r->whereIn('name', $staffRoles))
            )
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $onlineUsers = User::where('last_seen_at', '>=', now()->subMinutes(5))
            ->with('roles')
            ->get()
            ->map(fn ($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'avatar_url'=> $u->avatar_url,
                'roles'     => $u->getRoleNames(),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users'       => $users,
            'roles'       => Role::all(),
            'filters'     => $request->only('search', 'role', 'tab', 'per_page', 'sort', 'direction'),
            'onlineUsers' => $onlineUsers,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', ['roles' => Role::all()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'username' => 'nullable|string|unique:users',
            'password' => 'required|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'gender'   => 'nullable|in:L,P',
            'role'     => 'required|exists:roles,name',
        ]);

        $user = User::create([
            ...$data,
            'password'       => Hash::make($data['password']),
            'plain_password' => $data['password'],
        ]);
        $user->assignRole($data['role']);

        return redirect()->route('admin.users.index')->with('success', 'User berhasil ditambahkan.');
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user'  => $user->load('roles'),
            'roles' => Role::all(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => "required|email|unique:users,email,{$user->id}",
            'username' => "nullable|string|unique:users,username,{$user->id}",
            'password' => 'nullable|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'gender'   => 'nullable|in:L,P',
            'is_active' => 'boolean',
            'role'     => 'required|exists:roles,name',
        ]);

        if (!empty($data['password'])) {
            $data['plain_password'] = $data['password'];
            $data['password']       = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        $user->syncRoles([$data['role']]);

        return redirect()->route('admin.users.index')->with('success', 'User berhasil diperbarui.');
    }

    public function toggleActive(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak bisa menonaktifkan akun sendiri.');
        }

        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Akun {$user->name} berhasil {$status}.");
    }

    public function resetPassword(User $user)
    {
        $user->update([
            'password'       => Hash::make('apikmasdjurnal'),
            'plain_password' => 'apikmasdjurnal',
        ]);
        return back()->with('success', "Password {$user->name} berhasil direset ke default.");
    }

    public function export(Request $request)
    {
        $tab      = in_array($request->get('tab'), ['murid']) ? 'murid' : 'staff';
        $label    = $tab === 'murid' ? 'murid' : 'ptk';
        $filename = "pengguna-{$label}-" . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(new UsersExport($tab), $filename);
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak bisa menghapus akun sendiri.');
        }
        $user->delete();
        return back()->with('success', 'User berhasil dihapus.');
    }
}

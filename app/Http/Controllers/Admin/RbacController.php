<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class RbacController extends Controller
{
    public function index()
    {
        $roles = Role::orderBy('name')->get()->map(fn ($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'users_count' => $r->users()->count(),
        ]);

        $users = User::with('roles')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'roles' => $u->roles->pluck('name')->toArray(),
            ]);

        return Inertia::render('Admin/Rbac/Index', compact('roles', 'users'));
    }

    public function syncUserRoles(Request $request, User $user)
    {
        $request->validate([
            'roles'   => 'array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user->syncRoles($request->roles ?? []);

        return back()->with('success', "Role untuk {$user->name} berhasil diperbarui.");
    }
}

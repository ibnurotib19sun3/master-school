<?php

namespace App\Http\Controllers;

use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        $user = auth()->user()->load('guru');
        return Inertia::render('Profile/Index', [
            'user'          => array_merge($user->toArray(), ['roles' => $user->getRoleNames()]),
            'guru'          => $user->guru,
            'mataPelajaran' => MataPelajaran::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => "required|email|unique:users,email,{$user->id}",
            'tanggal_lahir' => 'nullable|date',
            'alamat'        => 'nullable|string|max:500',
        ]);

        $user->update($request->only('name', 'email', 'tanggal_lahir', 'alamat'));
        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password'         => 'required|min:8|confirmed',
        ], [
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
            'password.min'                      => 'Password minimal 8 karakter.',
            'password.confirmed'                => 'Konfirmasi password tidak cocok.',
        ]);

        auth()->user()->update(['password' => Hash::make($request->password)]);
        return back()->with('success', 'Password berhasil diperbarui.');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048'], [
            'avatar.max' => 'Ukuran foto maksimal 2MB.',
        ]);

        $user = auth()->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function updateGuru(Request $request)
    {
        $user = auth()->user();
        if (!$user->guru) {
            return back()->withErrors(['message' => 'Data guru tidak ditemukan.']);
        }

        $request->validate(['nomor_wa' => 'nullable|string|max:20']);
        $user->guru->update(['nomor_wa' => $request->nomor_wa]);

        return back()->with('success', 'Nomor WhatsApp berhasil diperbarui.');
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\PengaturanSekolah;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckMaintenance
{
    public function handle(Request $request, Closure $next)
    {
        // Super admin selalu lolos
        if ($request->user()?->hasRole('super_admin')) {
            return $next($request);
        }

        // Halaman maintenance & login tidak diblokir
        if ($request->routeIs('maintenance') || $request->is('login', 'logout')) {
            return $next($request);
        }

        $sekolah = PengaturanSekolah::current();

        if ($sekolah->is_maintenance) {
            // Simpan URL asal sekali saja agar bisa kembali setelah maintenance selesai
            if (! session()->has('url.pre_maintenance')) {
                session(['url.pre_maintenance' => $request->url()]);
            }

            // Inertia request → force full page redirect
            if ($request->header('X-Inertia')) {
                return Inertia::location('/maintenance');
            }
            return redirect('/maintenance');
        }

        return $next($request);
    }
}

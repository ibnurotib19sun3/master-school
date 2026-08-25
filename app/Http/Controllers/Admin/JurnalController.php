<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JurnalMengajar;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurnalController extends Controller
{
    public function index(Request $request)
    {
        $query = JurnalMengajar::with([
            'pembelajaran.mataPelajaran',
            'pembelajaran.rombel.kelas',
            'pembelajaran.guru.user',
            'capaianPembelajaran',
        ]);

        if ($request->filled('tanggal_dari')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_dari);
        }
        if ($request->filled('tanggal_sampai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_sampai);
        }
        if ($request->filled('guru_id')) {
            $query->whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $request->guru_id));
        }
        if ($request->filled('rombel_id')) {
            $query->whereHas('pembelajaran', fn ($q) => $q->where('rombel_id', $request->rombel_id));
        }

        $jurnal = $query->latest('tanggal')->paginate(20)->withQueryString();

        return Inertia::render('Admin/Jurnal/Index', [
            'jurnal'    => $jurnal,
            'guruList'  => Guru::with('user')->orderBy('id')->get(['id', 'user_id']),
            'rombelList'=> Rombel::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama']),
            'filters'   => $request->only('tanggal_dari', 'tanggal_sampai', 'guru_id', 'rombel_id'),
        ]);
    }
}

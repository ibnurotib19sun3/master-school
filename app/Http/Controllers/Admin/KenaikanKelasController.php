<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KenaikanKelasController extends Controller
{
    /**
     * Return daftar rombel aktif (JSON) untuk modal di halaman Rombel.
     */
    public function data()
    {
        $list = Rombel::with('kelas')
            ->where('is_aktif', true)
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'nama'       => $r->nama,
                'tingkat'    => $r->kelas?->tingkat ?? 0,
                'kelas_nama' => $r->kelas?->nama ?? '-',
            ])
            ->sortByDesc('tingkat')
            ->values();

        return response()->json($list);
    }

    /**
     * Proses kenaikan kelas massal.
     *
     * Urutan proses: XII dulu (siswa → Lulus, rombel → nonaktif),
     * kemudian XI (kelas_id → XII), kemudian X (kelas_id → XI).
     */
    public function proses(Request $request)
    {
        $validated = $request->validate([
            'rombel_ids'   => 'nullable|array',
            'rombel_ids.*' => 'integer|exists:rombel,id',
        ]);

        $query = Rombel::with('kelas')->where('is_aktif', true);

        if (!empty($validated['rombel_ids'])) {
            $query->whereIn('id', $validated['rombel_ids']);
        }

        // Urutkan: tingkat terbesar (XII) diproses pertama
        $rombelList = $query->get()
            ->sortByDesc(fn($r) => $r->kelas?->tingkat ?? 0)
            ->values();

        if ($rombelList->isEmpty()) {
            return back()->withErrors(['rombel_ids' => 'Tidak ada rombel yang bisa diproses.']);
        }

        // Peta tingkat → Kelas
        $kelasMap = Kelas::all()->keyBy('tingkat');

        DB::transaction(function () use ($rombelList, $kelasMap) {
            foreach ($rombelList as $rombel) {
                $tingkat = $rombel->kelas?->tingkat ?? 0;

                if ($tingkat >= 12) {
                    // Luluskan semua siswa aktif di rombel ini
                    $rombel->siswa()->where('status_siswa', 'Aktif')
                        ->update(['status_siswa' => 'Lulus', 'rombel_id' => null]);
                    $rombel->update(['is_aktif' => false]);
                } elseif ($tingkat > 0 && isset($kelasMap[$tingkat + 1])) {
                    // Naikkan kelas_id ke tingkat berikutnya
                    $rombel->update(['kelas_id' => $kelasMap[$tingkat + 1]->id]);
                }
            }
        });

        $lulusCount = $rombelList->filter(fn($r) => ($r->kelas?->tingkat ?? 0) >= 12)->count();
        $naikCount  = $rombelList->count() - $lulusCount;

        $parts = [];
        if ($naikCount)  $parts[] = "{$naikCount} rombel berhasil dinaikkan kelas.";
        if ($lulusCount) $parts[] = "{$lulusCount} rombel kelas XII: siswa ditandai Lulus.";

        return back()->with('success', implode(' ', $parts) ?: 'Kenaikan kelas berhasil diproses.');
    }
}

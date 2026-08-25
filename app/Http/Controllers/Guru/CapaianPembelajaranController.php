<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\CapaianPembelajaran;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CapaianPembelajaranController extends Controller
{
    private function guruId(): int
    {
        return request()->user()->guru->id;
    }

    private function mapelGuru(): \Illuminate\Support\Collection
    {
        return MataPelajaran::whereHas('pembelajaran', function ($q) {
            $q->where('guru_id', $this->guruId())->where('is_aktif', true);
        })->orderBy('nama')->get(['id', 'nama']);
    }

    public function index(Request $request)
    {
        $guruId = $this->guruId();
        $mapelId = $request->query('mapel_id');

        $capaian = CapaianPembelajaran::where('guru_id', $guruId)
            ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))
            ->with('mataPelajaran:id,nama')
            ->withCount('jurnalMengajar')
            ->orderBy('mata_pelajaran_id')
            ->orderBy('tingkat')
            ->orderBy('semester')
            ->orderBy('kode')
            ->get();

        return Inertia::render('Guru/CapaianPembelajaran/Index', [
            'capaian'  => $capaian,
            'mapelList' => $this->mapelGuru(),
            'filterMapelId' => $mapelId ? (int) $mapelId : null,
        ]);
    }

    public function store(Request $request)
    {
        $guruId = $this->guruId();

        $data = $request->validate([
            'mata_pelajaran_id' => 'required|integer|exists:mata_pelajaran,id',
            'tingkat'           => 'required|integer|min:1|max:13',
            'semester'          => 'required|integer|in:1,2',
            'kode'              => 'required|string|max:5',
            'capaian'           => 'required|string',
        ]);

        $data['guru_id'] = $guruId;
        $data['kode']    = str_pad($data['kode'], 2, '0', STR_PAD_LEFT);

        $exists = CapaianPembelajaran::where('guru_id', $guruId)
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->where('tingkat', $data['tingkat'])
            ->where('semester', $data['semester'])
            ->where('kode', $data['kode'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['kode' => 'Kode ini sudah digunakan untuk mapel, tingkat, dan semester yang sama.']);
        }

        CapaianPembelajaran::create($data);
        return back()->with('success', 'Capaian pembelajaran berhasil ditambahkan.');
    }

    public function update(Request $request, CapaianPembelajaran $capaian)
    {
        if ($capaian->guru_id !== $this->guruId()) abort(403);

        $data = $request->validate([
            'mata_pelajaran_id' => 'required|integer|exists:mata_pelajaran,id',
            'tingkat'           => 'required|integer|min:1|max:13',
            'semester'          => 'required|integer|in:1,2',
            'kode'              => 'required|string|max:5',
            'capaian'           => 'required|string',
        ]);

        $data['kode'] = str_pad($data['kode'], 2, '0', STR_PAD_LEFT);

        $exists = CapaianPembelajaran::where('guru_id', $this->guruId())
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->where('tingkat', $data['tingkat'])
            ->where('semester', $data['semester'])
            ->where('kode', $data['kode'])
            ->where('id', '!=', $capaian->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['kode' => 'Kode ini sudah digunakan untuk mapel, tingkat, dan semester yang sama.']);
        }

        $capaian->update($data);
        return back()->with('success', 'Capaian pembelajaran berhasil diperbarui.');
    }

    public function destroy(CapaianPembelajaran $capaian)
    {
        if ($capaian->guru_id !== $this->guruId()) abort(403);
        $capaian->delete();
        return back()->with('success', 'Capaian pembelajaran berhasil dihapus.');
    }

    public function detailJurnal(CapaianPembelajaran $capaian)
    {
        if ($capaian->guru_id !== $this->guruId()) abort(403);

        $jurnal = $capaian->jurnalMengajar()
            ->with(['pembelajaran.mataPelajaran', 'pembelajaran.rombel'])
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(fn ($j) => [
                'id'           => $j->id,
                'tanggal'      => $j->tanggal,
                'pertemuan_ke' => $j->pertemuan_ke,
                'materi_pokok' => $j->materi_pokok,
                'mapel'        => $j->pembelajaran?->mataPelajaran?->nama ?? '—',
                'rombel'       => $j->pembelajaran?->rombel?->nama ?? '—',
            ]);

        return response()->json([
            'capaian' => [
                'id'           => $capaian->id,
                'kode_lengkap' => $capaian->kode_lengkap,
                'capaian'      => $capaian->capaian,
            ],
            'jurnal' => $jurnal,
        ]);
    }
}

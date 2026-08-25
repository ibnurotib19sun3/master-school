<?php

namespace App\Http\Controllers\Pokja;

use App\Http\Controllers\Controller;
use App\Models\JurnalPokja;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurnalController extends Controller
{
    private function guruId(): ?int
    {
        return auth()->user()->guru?->id;
    }

    private function pokjaJabatan(): string
    {
        $jabatan = auth()->user()->guru?->jabatan ?? [];
        return collect($jabatan)->first(
            fn ($j) => str_starts_with($j, 'Pokja ') || $j === 'Bimbingan Konseling'
        ) ?? 'Pokja';
    }

    public function index()
    {
        $guruId = $this->guruId();
        $today  = today()->toDateString();

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();

        $jurnalHariIni = $guruId
            ? JurnalPokja::where('guru_id', $guruId)->where('tanggal', $today)->first()
            : null;

        $riwayat = JurnalPokja::where('guru_id', $guruId)
            ->with('tahunAjaran')
            ->where('tanggal', '<=', $today)
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Pokja/Jurnal/Index', [
            'jurnalHariIni' => $jurnalHariIni,
            'tahunAjaran'   => $tahunAjaran,
            'jabatan'       => $this->pokjaJabatan(),
            'today'         => $today,
            'riwayat'       => $riwayat,
        ]);
    }

    public function store(Request $request)
    {
        $guruId = $this->guruId();
        if (!$guruId) abort(403, 'Profil guru tidak ditemukan.');

        $today = today()->toDateString();

        if (JurnalPokja::where('guru_id', $guruId)->where('tanggal', $today)->exists()) {
            return back()->withErrors(['message' => 'Jurnal hari ini sudah diisi.']);
        }

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();

        $data = $request->validate([
            'kegiatan'   => 'required|string',
            'keterangan' => 'nullable|string|max:1000',
        ]);

        JurnalPokja::create([
            'guru_id'         => $guruId,
            'tahun_ajaran_id' => $tahunAjaran?->id,
            'semester'        => $tahunAjaran?->semester ?? '-',
            'tanggal'         => $today,
            'kegiatan'        => $data['kegiatan'],
            'keterangan'      => $data['keterangan'] ?? null,
        ]);

        return back()->with('success', 'Jurnal berhasil disimpan.');
    }

    public function update(Request $request, JurnalPokja $jurnal)
    {
        $guruId = $this->guruId();
        if ($jurnal->guru_id !== $guruId) abort(403);
        if (\Carbon\Carbon::parse($jurnal->tanggal)->toDateString() !== today()->toDateString()) {
            abort(403, 'Jurnal hanya dapat diubah pada hari yang sama.');
        }

        $data = $request->validate([
            'kegiatan'   => 'required|string',
            'keterangan' => 'nullable|string|max:1000',
        ]);

        $jurnal->update($data);
        return back()->with('success', 'Jurnal berhasil diperbarui.');
    }

    public function destroy(JurnalPokja $jurnal)
    {
        $guruId = $this->guruId();
        if ($jurnal->guru_id !== $guruId) abort(403);

        $jurnal->delete();
        return back()->with('success', 'Jurnal berhasil dihapus.');
    }

    public function riwayat(Request $request)
    {
        $guruId = $this->guruId();

        $riwayat = JurnalPokja::where('guru_id', $guruId)
            ->with('tahunAjaran')
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();

        $u = auth()->user();
        return Inertia::render('Pokja/Jurnal/Riwayat', [
            'riwayat' => $riwayat,
            'filters' => $request->only('dari', 'sampai', 'q'),
            'jabatan' => $this->pokjaJabatan(),
            'nama'    => $u->guru?->nama_lengkap ?? $u->name,
        ]);
    }

    public function print(Request $request)
    {
        $guruId = $this->guruId();
        $ids    = array_filter(explode(',', $request->get('ids', '')));

        $jurnal = JurnalPokja::whereIn('id', $ids)
            ->where('guru_id', $guruId)
            ->with('tahunAjaran')
            ->orderBy('tanggal')
            ->get();

        $base    = PengaturanSekolah::current();
        $kop     = PengaturanSurat::current();
        $sekolah = (object) [
            'logo_url'      => $base->logo_url,
            'yayasan_dinas' => $kop->yayasan_dinas ?: $base->yayasan_dinas,
            'nama_sekolah'  => $kop->nama_instansi  ?: $base->nama_sekolah,
            'alamat'        => $kop->alamat_kop     ?: $base->alamat,
            'kecamatan'     => $kop->alamat_kop ? null : $base->kecamatan,
            'kota'          => $base->kota,
            'telepon'       => $kop->telepon_kop    ?: $base->telepon,
            'email_sekolah' => $kop->email_kop      ?: $base->email_sekolah,
            'website'       => $kop->website_kop    ?: $base->website,
        ];
        $jabatan = $this->pokjaJabatan();
        $u       = auth()->user();
        $nama    = $u->guru?->nama_lengkap ?? $u->name;

        return view('print.jurnal', compact('jurnal', 'sekolah', 'jabatan', 'nama'));
    }
}

<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\JurnalPimpinan;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurnalController extends Controller
{
    private function userId(): int
    {
        return auth()->id();
    }

    private function jabatan(): string
    {
        $map = [
            'kepala_sekolah'              => 'Kepala Sekolah',
            'kepala_tatausaha'            => 'Kepala Tata Usaha',
            'wakasek_kurikulum'           => 'Wakasek Kurikulum',
            'wakasek_kesiswaan'           => 'Wakasek Kesiswaan',
            'wakasek_sarpras'             => 'Wakasek Sarana Prasarana',
            'wakasek_humas'               => 'Wakasek Humas',
            'bendahara_sekolah'           => 'Bendahara Sekolah',
            'tim_penjamin_mutu'           => 'Tim Penjamin Mutu Sekolah',
            'kepala_konsentrasi_keahlian' => 'Kepala Konsentrasi Keahlian',
        ];
        foreach ($map as $role => $label) {
            if (auth()->user()->hasRole($role)) return $label;
        }
        return 'Pimpinan';
    }

    public function index()
    {
        $userId = $this->userId();
        $today  = today()->toDateString();

        $tahunAjaran   = TahunAjaran::where('is_aktif', true)->first();
        $jurnalHariIni = JurnalPimpinan::where('user_id', $userId)->where('tanggal', $today)->first();

        $riwayat = JurnalPimpinan::where('user_id', $userId)
            ->with('tahunAjaran')
            ->where('tanggal', '<=', $today)
            ->latest('tanggal')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Pimpinan/Jurnal/Index', [
            'jurnalHariIni' => $jurnalHariIni,
            'tahunAjaran'   => $tahunAjaran,
            'jabatan'       => $this->jabatan(),
            'today'         => $today,
            'riwayat'       => $riwayat,
        ]);
    }

    public function store(Request $request)
    {
        $userId = $this->userId();
        $today  = today()->toDateString();

        if (JurnalPimpinan::where('user_id', $userId)->where('tanggal', $today)->exists()) {
            return back()->withErrors(['message' => 'Jurnal hari ini sudah diisi.']);
        }

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();

        $data = $request->validate([
            'kegiatan'   => 'required|string',
            'keterangan' => 'nullable|string|max:1000',
        ]);

        JurnalPimpinan::create([
            'user_id'         => $userId,
            'tahun_ajaran_id' => $tahunAjaran?->id,
            'semester'        => $tahunAjaran?->semester ?? '-',
            'tanggal'         => $today,
            'jabatan'         => $this->jabatan(),
            'kegiatan'        => $data['kegiatan'],
            'keterangan'      => $data['keterangan'] ?? null,
        ]);

        return back()->with('success', 'Jurnal berhasil disimpan.');
    }

    public function update(Request $request, JurnalPimpinan $jurnal)
    {
        if ($jurnal->user_id !== $this->userId()) abort(403);
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

    public function destroy(JurnalPimpinan $jurnal)
    {
        if ($jurnal->user_id !== $this->userId()) abort(403);
        $jurnal->delete();
        return back()->with('success', 'Jurnal berhasil dihapus.');
    }

    public function riwayat(Request $request)
    {
        $userId = $this->userId();

        $riwayat = JurnalPimpinan::where('user_id', $userId)
            ->with('tahunAjaran')
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();

        $u = auth()->user();
        return Inertia::render('Pimpinan/Jurnal/Riwayat', [
            'riwayat' => $riwayat,
            'filters' => $request->only('dari', 'sampai', 'q'),
            'jabatan' => $this->jabatan(),
            'nama'    => $u->guru?->nama_lengkap ?? $u->name,
        ]);
    }

    public function print(Request $request)
    {
        $userId = $this->userId();
        $ids    = array_filter(explode(',', $request->get('ids', '')));

        $jurnal = JurnalPimpinan::whereIn('id', $ids)
            ->where('user_id', $userId)
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
        $jabatan = $this->jabatan();
        $u       = auth()->user();
        $nama    = $u->guru?->nama_lengkap ?? $u->name;

        return view('print.jurnal', compact('jurnal', 'sekolah', 'jabatan', 'nama'));
    }
}

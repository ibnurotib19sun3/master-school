<?php

namespace App\Http\Controllers\TataUsaha;

use App\Http\Controllers\Controller;
use App\Models\AbsensiTatausaha;
use App\Models\JurnalTatausaha;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JurnalController extends Controller
{
    private function tatausahaId(): ?int
    {
        return auth()->user()->tatausaha?->id;
    }

    public function index()
    {
        $tuId  = $this->tatausahaId();
        $today = today()->toDateString();

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();

        // Presensi hari ini
        $absensiHariIni = $tuId
            ? AbsensiTatausaha::where('tatausaha_id', $tuId)->where('tanggal', $today)->first()
            : null;

        // Jurnal hari ini
        $jurnalHariIni = $tuId
            ? JurnalTatausaha::where('tatausaha_id', $tuId)->where('tanggal', $today)->first()
            : null;

        $riwayat = JurnalTatausaha::where('tatausaha_id', $tuId)
            ->with('tahunAjaran')
            ->where('tanggal', '<=', $today)
            ->latest('tanggal')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('TataUsaha/Jurnal/Index', [
            'absensiHariIni' => $absensiHariIni,
            'jurnalHariIni'  => $jurnalHariIni,
            'tahunAjaran'    => $tahunAjaran,
            'today'          => $today,
            'riwayat'        => $riwayat,
        ]);
    }

    public function store(Request $request)
    {
        $tuId  = $this->tatausahaId();
        $today = today()->toDateString();

        if (!$tuId) abort(403, 'Profil tata usaha tidak ditemukan.');

        // Cek presensi hari ini harus Hadir
        $absensi = AbsensiTatausaha::where('tatausaha_id', $tuId)->where('tanggal', $today)->first();
        if (!$absensi || $absensi->status !== 'Hadir') {
            return back()->withErrors(['message' => 'Jurnal hanya bisa diisi ketika presensi hari ini berstatus Hadir.']);
        }

        // Cek belum ada jurnal hari ini
        if (JurnalTatausaha::where('tatausaha_id', $tuId)->where('tanggal', $today)->exists()) {
            return back()->withErrors(['message' => 'Jurnal hari ini sudah diisi.']);
        }

        $tahunAjaran = TahunAjaran::where('is_aktif', true)->first();

        $data = $request->validate([
            'kegiatan'    => 'required|string',
            'keterangan'  => 'nullable|string|max:1000',
        ]);

        JurnalTatausaha::create([
            'tatausaha_id'   => $tuId,
            'tahun_ajaran_id'=> $tahunAjaran?->id,
            'semester'       => $tahunAjaran?->semester ?? '-',
            'tanggal'        => $today,
            'kegiatan'       => $data['kegiatan'],
            'keterangan'     => $data['keterangan'] ?? null,
        ]);

        return back()->with('success', 'Jurnal karyawan berhasil disimpan.');
    }

    public function update(Request $request, JurnalTatausaha $jurnal)
    {
        $tuId = $this->tatausahaId();
        if ($jurnal->tatausaha_id !== $tuId) abort(403);
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

    public function destroy(JurnalTatausaha $jurnal)
    {
        $tuId = $this->tatausahaId();
        if ($jurnal->tatausaha_id !== $tuId) abort(403);

        $jurnal->delete();
        return back()->with('success', 'Jurnal berhasil dihapus.');
    }

    public function riwayat(Request $request)
    {
        $tuId = $this->tatausahaId();

        $riwayat = JurnalTatausaha::where('tatausaha_id', $tuId)
            ->with('tahunAjaran')
            ->when($request->dari,   fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai, fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->q,      fn ($q) => $q->where('kegiatan', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();

        $u       = auth()->user();
        $jabatan = $u->tatausaha?->jabatan ?? 'Tata Usaha';
        $nama    = $u->tatausaha?->nama_lengkap ?? $u->name;

        return Inertia::render('TataUsaha/Jurnal/Riwayat', [
            'riwayat' => $riwayat,
            'filters' => $request->only('dari', 'sampai', 'q'),
            'jabatan' => $jabatan,
            'nama'    => $nama,
        ]);
    }

    public function print(Request $request)
    {
        $tuId   = $this->tatausahaId();
        $idsRaw = $request->get('ids', '');
        $ids    = array_filter(explode(',', $idsRaw));

        $jurnal = JurnalTatausaha::whereIn('id', $ids)
            ->where('tatausaha_id', $tuId)
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
        $u       = auth()->user();
        $jabatan = $u->tatausaha?->jabatan ?? 'Tata Usaha';
        $nama    = $u->tatausaha?->nama_lengkap ?? $u->name;

        return view('print.jurnal', compact('jurnal', 'sekolah', 'jabatan', 'nama'));
    }
}

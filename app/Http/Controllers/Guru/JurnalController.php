<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiPiket;
use App\Models\CapaianPembelajaran;
use App\Models\Jadwal;
use App\Models\Jobsheet;
use App\Models\JurnalMengajar;
use App\Models\ModulDigital;
use App\Models\MataPelajaran;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use App\Models\PengaturanSurat;
use App\Models\Presentasi;
use App\Models\VideoEdukasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class JurnalController extends Controller
{
    private function guruId(): ?int
    {
        return auth()->user()->guru?->id;
    }

    private function isAdmin(): bool
    {
        return auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
    }

    private function hariIndonesia(): string
    {
        $map = [0 => 'Ahad', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'];
        return $map[now()->dayOfWeek] ?? 'Senin';
    }

    public function index(Request $request)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();
        $today   = today()->toDateString();
        $hariIni = $this->hariIndonesia();

        $jadwalHariIni = Jadwal::with([
            'pembelajaran.mataPelajaran',
            'pembelajaran.rombel',
            'pembelajaran.jurusan',
            'pembelajaran.guru.user',
        ])
        ->where('hari', $hariIni)
        ->where('is_aktif', true)
        ->when($guruId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('guru_id', $guruId)))
        ->orderBy('jam_ke')
        ->get()
        ->values()
        ->map(fn ($j) => $j->toArray());

        $jadwalIds       = collect($jadwalHariIni)->pluck('id');
        $pembelajaranIds = collect($jadwalHariIni)->pluck('pembelajaran_id');

        $piketRecords = AbsensiPiket::where('tanggal', $today)
            ->whereIn('jadwal_id', $jadwalIds)
            ->get()
            ->keyBy('jadwal_id');

        // pembelajaran_id → [journal, ...] — beberapa jurnal per pembelajaran per hari diizinkan
        $jurnalHariIni = JurnalMengajar::where('tanggal', $today)
            ->whereIn('pembelajaran_id', $pembelajaranIds)
            ->get(['id', 'pembelajaran_id', 'pertemuan_ke', 'materi_pokok', 'metode', 'media_type', 'media_ref_id', 'media_url', 'jadwal_ids'])
            ->groupBy('pembelajaran_id')
            ->map(fn ($g) => $g->values());

        $absensiCounts = Absensi::where('tanggal', $today)
            ->whereIn('pembelajaran_id', $pembelajaranIds)
            ->where('status', 'Hadir')
            ->select('pembelajaran_id', DB::raw('count(*) as jumlah'))
            ->groupBy('pembelajaran_id')
            ->pluck('jumlah', 'pembelajaran_id');

        $pertemuanKe = JurnalMengajar::whereIn('pembelajaran_id', $pembelajaranIds)
            ->select('pembelajaran_id', DB::raw('count(*) as total'))
            ->groupBy('pembelajaran_id')
            ->pluck('total', 'pembelajaran_id');

        // Media milik guru untuk dipilih
        $videoList = VideoEdukasi::when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->orderBy('judul')->get(['id', 'judul', 'sumber', 'url_video']);

        $presentasiList = Presentasi::when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->orderBy('judul')->get(['id', 'judul', 'file_path']);

        $modulList = ModulDigital::when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->orderBy('judul')->get(['id', 'judul', 'file_path']);

        $jobsheetList = Jobsheet::when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->orderBy('judul')->get(['id', 'judul', 'file_path']);

        $mapelIds = $guruId
            ? Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
            : null;
        $mataPelajaran = $mapelIds
            ? MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get(['id', 'nama'])
            : MataPelajaran::where('is_aktif', true)->get(['id', 'nama']);

        $riwayat = JurnalMengajar::with(['pembelajaran.mataPelajaran', 'pembelajaran.rombel', 'pembelajaran.jurusan', 'pembelajaran.guru.user', 'capaianPembelajaran'])
            ->when($guruId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('guru_id', $guruId)))
            ->where('tanggal', '<=', $today)
            ->latest('tanggal')
            ->paginate(10)
            ->withQueryString();

        $pembelajaranTanpaJadwal = Pembelajaran::where('is_aktif', true)
            ->when($guruId, fn ($q) => $q->where('guru_id', $guruId))
            ->whereDoesntHave('jadwal')
            ->count();

        $capaianList = $guruId
            ? CapaianPembelajaran::where('guru_id', $guruId)
                ->orderBy('mata_pelajaran_id')->orderBy('tingkat')->orderBy('semester')->orderBy('kode')
                ->get(['id', 'mata_pelajaran_id', 'tingkat', 'semester', 'kode', 'capaian'])
                ->map(fn ($c) => [
                    'id'                => $c->id,
                    'mata_pelajaran_id' => $c->mata_pelajaran_id,
                    'kode_lengkap'      => $c->kode_lengkap,
                    'capaian'           => $c->capaian,
                ])
            : collect();

        return Inertia::render('Guru/Jurnal/Index', [
            'jadwalHariIni'           => $jadwalHariIni,
            'piketRecords'            => $piketRecords,
            'jurnalHariIni'           => $jurnalHariIni,
            'absensiCounts'           => $absensiCounts,
            'pertemuanKe'             => $pertemuanKe,
            'videoList'               => $videoList,
            'presentasiList'          => $presentasiList,
            'modulList'               => $modulList,
            'jobsheetList'            => $jobsheetList,
            'mataPelajaran'           => $mataPelajaran,
            'capaianList'             => $capaianList,
            'riwayat'                 => $riwayat,
            'isAdmin'                 => $isAdmin,
            'tanggalHariIni'          => $today,
            'pembelajaranTanpaJadwal' => $pembelajaranTanpaJadwal,
        ]);
    }

    public function riwayat(Request $request)
    {
        $guruId  = $this->guruId();
        $isAdmin = $this->isAdmin();

        $riwayat = JurnalMengajar::with(['pembelajaran.mataPelajaran', 'pembelajaran.rombel', 'pembelajaran.jurusan', 'pembelajaran.guru.user', 'capaianPembelajaran'])
            ->when($guruId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('guru_id', $guruId)))
            ->when($request->dari,    fn ($q) => $q->where('tanggal', '>=', $request->dari))
            ->when($request->sampai,  fn ($q) => $q->where('tanggal', '<=', $request->sampai))
            ->when($request->mapel,   fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('mata_pelajaran_id', $request->mapel)))
            ->when($request->q,       fn ($q) => $q->where('materi_pokok', 'like', "%{$request->q}%"))
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();

        $mapelIds = $guruId
            ? \App\Models\Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
            : null;
        $mataPelajaran = $mapelIds
            ? \App\Models\MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get(['id', 'nama'])
            : \App\Models\MataPelajaran::where('is_aktif', true)->get(['id', 'nama']);

        $kop     = PengaturanSurat::current();
        $sekolah = PengaturanSekolah::current();

        return Inertia::render('Guru/Jurnal/Riwayat', [
            'riwayat'       => $riwayat,
            'filters'       => $request->only('dari', 'sampai', 'mapel', 'q'),
            'mataPelajaran' => $mataPelajaran,
            'isAdmin'       => $isAdmin,
            'kop'           => [
                'nama_instansi' => $kop->nama_instansi,
                'sub_nama'      => $kop->sub_nama,
                'yayasan_dinas' => $kop->yayasan_dinas,
                'alamat_kop'    => $kop->alamat_kop,
                'telepon_kop'   => $kop->telepon_kop,
                'website_kop'   => $kop->website_kop,
                'email_kop'     => $kop->email_kop,
                'npsn_kop'      => $kop->npsn_kop,
                'logo_url'      => $sekolah->logo_url,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $guruId  = $this->guruId();
        $today   = today()->toDateString();

        $data = $request->validate([
            'pembelajaran_id'          => 'required|exists:pembelajaran,id',
            'jadwal_ids'               => 'nullable|array',
            'jadwal_ids.*'             => 'integer',
            'materi_pokok'             => 'required|string',
            'uraian_materi'            => 'required|string',
            'capaian_ids'              => 'nullable|array',
            'capaian_ids.*'            => 'exists:capaian_pembelajaran,id',
            'metode'                   => 'required|array|min:1',
            'metode.*'                 => 'in:Ceramah,Diskusi,Praktik,Proyek,Kooperatif,Lainnya',
            'media_type'               => 'nullable|string|max:30',
            'media_ref_id'             => 'nullable|integer',
            'media_url'                => 'nullable|string|max:500',
            'media_judul'              => 'nullable|string|max:255',
            'media_mata_pelajaran_id'  => 'nullable|exists:mata_pelajaran,id',
            'media_file'               => 'nullable|file|max:20480',
            'catatan'                  => 'nullable|string',
        ]);

        // Normalise to integers (FormData sends array values as strings)
        $jadwalIdsToStore = array_map('intval', $data['jadwal_ids'] ?? []);
        if (!empty($jadwalIdsToStore)) {
            $existingCoveredIds = JurnalMengajar::where('pembelajaran_id', $data['pembelajaran_id'])
                ->where('tanggal', $today)
                ->get()
                ->flatMap(fn ($j) => array_map('intval', $j->jadwal_ids ?? []))
                ->toArray();
            if (!empty(array_intersect($jadwalIdsToStore, $existingCoveredIds))) {
                return back()->withErrors(['message' => 'Beberapa jam yang dipilih sudah terisi jurnal.']);
            }
        } else {
            if (JurnalMengajar::where('pembelajaran_id', $data['pembelajaran_id'])->where('tanggal', $today)->exists()) {
                return back()->withErrors(['message' => 'Jurnal untuk jadwal ini sudah diisi hari ini.']);
            }
        }

        // Handle inline media upload
        if ($request->hasFile('media_file') && $data['media_type']) {
            $data['media_ref_id'] = $this->storeInlineMedia($request, $guruId);
        }

        $jumlahHadir = Absensi::where('pembelajaran_id', $data['pembelajaran_id'])
            ->where('tanggal', $today)->where('status', 'Hadir')->count();

        $pertemuanKe = JurnalMengajar::where('pembelajaran_id', $data['pembelajaran_id'])->count() + 1;

        $jurnal = JurnalMengajar::create([
            'pembelajaran_id' => $data['pembelajaran_id'],
            'tanggal'         => $today,
            'pertemuan_ke'    => $pertemuanKe,
            'materi_pokok'    => $data['materi_pokok'],
            'uraian_materi'   => $data['uraian_materi'],
            'metode'          => $data['metode'],
            'media_alat'      => $data['media_type'],
            'media_type'      => $data['media_type'],
            'media_ref_id'    => $data['media_ref_id'] ?? null,
            'media_url'       => $data['media_url'] ?? null,
            'catatan'         => $data['catatan'] ?? null,
            'jumlah_hadir'    => $jumlahHadir,
            'jadwal_ids'      => !empty($jadwalIdsToStore) ? $jadwalIdsToStore : null,
        ]);

        if (!empty($data['capaian_ids'])) {
            $jurnal->capaianPembelajaran()->sync($data['capaian_ids']);
        }

        return back()->with('success', 'Jurnal mengajar berhasil disimpan.');
    }

    public function update(Request $request, JurnalMengajar $jurnal)
    {
        $guruId = $this->guruId();

        if ($jurnal->tanggal->toDateString() !== today()->toDateString()) {
            abort(403, 'Jurnal hanya dapat diubah pada hari yang sama.');
        }

        $data = $request->validate([
            'materi_pokok'             => 'required|string',
            'uraian_materi'            => 'required|string',
            'capaian_ids'              => 'nullable|array',
            'capaian_ids.*'            => 'exists:capaian_pembelajaran,id',
            'metode'                   => 'required|array|min:1',
            'metode.*'                 => 'in:Ceramah,Diskusi,Praktik,Proyek,Kooperatif,Lainnya',
            'media_type'               => 'nullable|string|max:30',
            'media_ref_id'             => 'nullable|integer',
            'media_url'                => 'nullable|string|max:500',
            'media_judul'              => 'nullable|string|max:255',
            'media_mata_pelajaran_id'  => 'nullable|exists:mata_pelajaran,id',
            'media_file'               => 'nullable|file|max:20480',
            'catatan'                  => 'nullable|string',
        ]);

        if ($request->hasFile('media_file') && $data['media_type']) {
            $data['media_ref_id'] = $this->storeInlineMedia($request, $guruId);
        }

        $jumlahHadir = Absensi::where('pembelajaran_id', $jurnal->pembelajaran_id)
            ->where('tanggal', $jurnal->tanggal->toDateString())
            ->where('status', 'Hadir')->count();

        $jurnal->update([
            'materi_pokok'  => $data['materi_pokok'],
            'uraian_materi' => $data['uraian_materi'],
            'metode'        => $data['metode'],
            'media_alat'    => $data['media_type'],
            'media_type'    => $data['media_type'],
            'media_ref_id'  => $data['media_ref_id'] ?? null,
            'media_url'     => $data['media_url'] ?? null,
            'catatan'       => $data['catatan'] ?? null,
            'jumlah_hadir'  => $jumlahHadir,
        ]);

        $jurnal->capaianPembelajaran()->sync($data['capaian_ids'] ?? []);

        return back()->with('success', 'Jurnal mengajar berhasil diperbarui.');
    }

    public function destroy(JurnalMengajar $jurnal)
    {
        $jurnal->delete();
        return back()->with('success', 'Jurnal mengajar berhasil dihapus.');
    }

    private function storeInlineMedia(Request $request, ?int $guruId): ?int
    {
        $file    = $request->file('media_file');
        $type    = $request->media_type;
        $judul   = $request->media_judul ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        // Ambil mata_pelajaran_id dari relasi pembelajaran, bukan dari request
        $mapelId = Pembelajaran::find($request->pembelajaran_id)?->mata_pelajaran_id;
        $ext     = strtolower($file->getClientOriginalExtension());
        $name    = $file->getClientOriginalName();
        $size    = $file->getSize();

        if ($type === 'Video Pembelajaran') {
            return null;
        }

        if ($type === 'Presentasi') {
            $path = $file->store('presentasi', 'public');
            return Presentasi::create([
                'guru_id' => $guruId, 'judul' => $judul,
                'file_path' => $path, 'file_name' => $name, 'file_ext' => $ext, 'file_size' => $size,
                'mata_pelajaran_id' => $mapelId, 'platform' => 'Upload',
            ])->id;
        }

        if ($type === 'Modul Ajar') {
            $path = $file->store('modul-ajar', 'public');
            return ModulDigital::create([
                'guru_id' => $guruId, 'judul' => $judul,
                'file_path' => $path, 'file_name' => $name, 'file_ext' => $ext, 'file_size' => $size,
                'mata_pelajaran_id' => $mapelId, 'tipe' => 'Modul',
            ])->id;
        }

        if ($type === 'Jobsheet') {
            $path = $file->store('jobsheet', 'public');
            return Jobsheet::create([
                'guru_id' => $guruId, 'judul' => $judul,
                'file_path' => $path, 'file_name' => $name, 'file_ext' => $ext, 'file_size' => $size,
                'mata_pelajaran_id' => $mapelId,
            ])->id;
        }

        return null;
    }
}

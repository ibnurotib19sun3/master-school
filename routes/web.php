<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\TahunAjaranController;
use App\Http\Controllers\Admin\RombelController;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Admin\JadwalController;
use App\Http\Controllers\Admin\PengaturanSekolahController;
use App\Http\Controllers\Admin\PengaturanSuratController;
use App\Http\Controllers\Admin\PengumpulanController;
use App\Http\Controllers\Guru\PengumpulanController as GuruPengumpulanController;
use App\Http\Controllers\Admin\LaporanController;
use App\Http\Controllers\Admin\RiwayatJurnalController;
use App\Http\Controllers\Admin\HariLiburController;
use App\Http\Controllers\Admin\KenaikanKelasController;
use App\Http\Controllers\PublicJadwalController;
use App\Http\Controllers\BukuTamuController;
use App\Http\Controllers\Admin\BukuTamuAdminController;
use App\Http\Controllers\SuratVerifikasiController;
use App\Http\Controllers\SuratMasukVerifikasiController;
use App\Http\Controllers\TataUsaha\TteController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\RbacController;
use App\Http\Controllers\MasukanController;
use App\Http\Controllers\Piket\PiketController;
use App\Http\Controllers\Guru\AbsensiController;
use App\Http\Controllers\Guru\JurnalController;
use App\Http\Controllers\Guru\PresensiHarianController;
use App\Http\Controllers\Guru\KuisAsesmenController;
use App\Http\Controllers\Guru\NilaiController;
use App\Http\Controllers\Admin\TatausahaController;
use App\Http\Controllers\Admin\KpiController;
use App\Http\Controllers\Admin\KpiTatausahaController;
use App\Http\Controllers\Admin\KpiManajemenController;
use App\Http\Controllers\TataUsaha\JurnalController as TUJurnalController;
use App\Http\Controllers\Pokja\JurnalController as PokjaJurnalController;
use App\Http\Controllers\Pimpinan\JurnalController as PimpinanJurnalController;
use App\Http\Controllers\Pimpinan\JurnalBawahanController as PimpinanJurnalBawahanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing page
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return \Inertia\Inertia::render('Public/Landing');
})->name('landing');

// Halaman pemeliharaan — selalu bisa diakses
Route::get('/maintenance', function () {
    $sekolah = \App\Models\PengaturanSekolah::current();

    // Maintenance sudah selesai → kembalikan ke URL asal
    if (! $sekolah->is_maintenance) {
        $back     = session()->pull('url.pre_maintenance', null);
        $fallback = auth()->check() ? '/dashboard' : '/login';

        // Pastikan tidak redirect ke maintenance itu sendiri
        if ($back && ! str_contains($back, '/maintenance')) {
            return redirect($back);
        }
        return redirect($fallback);
    }

    return Inertia::render('Maintenance', [
        'message'  => $sekolah->maintenance_message,
        'sekolah'  => $sekolah->nama_sekolah,
        'telepon'  => $sekolah->telepon,
        'email'    => $sekolah->email_sekolah,
        'logo_url' => $sekolah->logo_url,
    ]);
})->name('maintenance');

// Public — tanpa login
Route::get('/jadwal-publik', [PublicJadwalController::class, 'index'])->name('jadwal.publik');
Route::get('/buku-tamu', [BukuTamuController::class, 'index'])->name('buku-tamu.index');
Route::post('/buku-tamu', [BukuTamuController::class, 'store'])->name('buku-tamu.store');
Route::get('/verifikasi-surat/{kode}', [SuratVerifikasiController::class, 'index'])->name('surat.verifikasi');
Route::get('/verifikasi-surat-masuk/{kode}', [SuratMasukVerifikasiController::class, 'index'])->name('surat-masuk.verifikasi');

// Auth
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Masukan / Laporan — semua user terautentikasi
    Route::get('/masukan',                              [MasukanController::class, 'riwayat'])      ->name('masukan.riwayat');
    Route::post('/masukan',                             [MasukanController::class, 'store'])        ->name('masukan.store');
    Route::post('/masukan/{masukan}/balasan',            [MasukanController::class, 'storeBalasan'])->name('masukan.balasan.store');

    // Profile
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::put('/profile/guru', [ProfileController::class, 'updateGuru'])->name('profile.guru');

    // File preview — serve stored files inline (PDF opens in browser, etc.)
    Route::get('/media/preview', function (\Illuminate\Http\Request $request) {
        $path = ltrim($request->query('path', ''), '/');

        // Only allow paths inside known upload dirs
        $allowed = ['presentasi/', 'modul-ajar/', 'jobsheet/', 'avatars/'];
        $ok = collect($allowed)->contains(fn ($d) => str_starts_with($path, $d));
        if (!$ok || str_contains($path, '..')) abort(403);

        $full = storage_path('app/public/' . $path);
        if (!file_exists($full)) abort(404);

        $ext   = strtolower(pathinfo($full, PATHINFO_EXTENSION));
        $mimes = [
            'pdf'  => 'application/pdf',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'ppt'  => 'application/vnd.ms-powerpoint',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc'  => 'application/msword',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xlsm' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
            'jpg'  => 'image/jpeg', 'jpeg' => 'image/jpeg',
            'png'  => 'image/png',  'webp' => 'image/webp',
        ];
        $mime = $mimes[$ext] ?? 'application/octet-stream';

        return response()->stream(function () use ($full) {
            readfile($full);
        }, 200, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($full) . '"',
            'Content-Length'      => filesize($full),
            'Cache-Control'       => 'private, max-age=3600',
        ]);
    })->name('media.preview');

    // Admin & Kurikulum
    Route::middleware('role:super_admin|kepala_sekolah|wakasek_kurikulum|wakasek_kesiswaan|kepala_tatausaha|tatausaha')->prefix('admin')->name('admin.')->group(function () {
        // Users
        Route::resource('users', UserController::class)->except(['show']);
        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
        Route::get('users-export', [UserController::class, 'export'])->name('users.export');
        // Tahun Ajaran
        Route::get('tahun-ajaran', [TahunAjaranController::class, 'index'])->name('tahun-ajaran.index');
        Route::post('tahun-ajaran', [TahunAjaranController::class, 'store'])->name('tahun-ajaran.store')->middleware('role:super_admin');
        Route::put('tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'update'])->name('tahun-ajaran.update')->middleware('role:super_admin');
        Route::delete('tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'destroy'])->name('tahun-ajaran.destroy')->middleware('role:super_admin');

        // Kelas & Jurusan
        Route::get('kelas-jurusan', fn () => Inertia::render('Admin/KelasJurusan/Index', [
            'kelas'   => \App\Models\Kelas::all(),
            'jurusan' => \App\Models\Jurusan::all(),
        ]))->name('kelas-jurusan.index');
        Route::post('kelas', function (\Illuminate\Http\Request $request) {
            $data = $request->validate(['nama' => 'required', 'tingkat' => 'required|integer', 'jenjang' => 'required']);
            \App\Models\Kelas::create($data);
            return back()->with('success', 'Kelas berhasil ditambahkan.');
        })->name('kelas.store')->middleware('role:super_admin');
        Route::put('kelas/{kelas}', function (\Illuminate\Http\Request $request, \App\Models\Kelas $kelas) {
            $data = $request->validate(['nama' => 'required', 'tingkat' => 'required|integer', 'jenjang' => 'required']);
            $kelas->update($data);
            return back()->with('success', 'Kelas berhasil diperbarui.');
        })->name('kelas.update')->middleware('role:super_admin');
        Route::delete('kelas/{kelas}', function (\App\Models\Kelas $kelas) {
            $kelas->delete();
            return back()->with('success', 'Kelas berhasil dihapus.');
        })->name('kelas.destroy')->middleware('role:super_admin');

        Route::post('jurusan', function (\Illuminate\Http\Request $request) {
            $data = $request->validate(['kode' => 'required|unique:jurusan', 'nama' => 'required', 'jenjang' => 'required', 'deskripsi' => 'nullable']);
            \App\Models\Jurusan::create([...$data, 'is_aktif' => true]);
            return back()->with('success', 'Jurusan berhasil ditambahkan.');
        })->name('jurusan.store')->middleware('role:super_admin');
        Route::put('jurusan/{jurusan}', function (\Illuminate\Http\Request $request, \App\Models\Jurusan $jurusan) {
            $data = $request->validate(['kode' => "required|unique:jurusan,kode,{$jurusan->id}", 'nama' => 'required', 'jenjang' => 'required', 'deskripsi' => 'nullable', 'is_aktif' => 'boolean']);
            $jurusan->update($data);
            return back()->with('success', 'Jurusan berhasil diperbarui.');
        })->name('jurusan.update')->middleware('role:super_admin');
        Route::delete('jurusan/{jurusan}', function (\App\Models\Jurusan $jurusan) {
            $jurusan->delete();
            return back()->with('success', 'Jurusan berhasil dihapus.');
        })->name('jurusan.destroy')->middleware('role:super_admin');

        // Rombel — read semua admin, write hanya super_admin
        Route::get('rombel', [RombelController::class, 'index'])->name('rombel.index');
        Route::get('rombel/form-data', [RombelController::class, 'formData'])->name('rombel.form-data');
        Route::post('rombel', [RombelController::class, 'store'])->name('rombel.store')->middleware('role:super_admin');
        Route::put('rombel/{rombel}', [RombelController::class, 'update'])->name('rombel.update')->middleware('role:super_admin');
        Route::delete('rombel/{rombel}', [RombelController::class, 'destroy'])->name('rombel.destroy')->middleware('role:super_admin');

        // Guru — read semua admin, write super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha
        Route::get('guru', [GuruController::class, 'index'])->name('guru.index');
        Route::post('guru', [GuruController::class, 'store'])->name('guru.store')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::put('guru/{guru}', [GuruController::class, 'update'])->name('guru.update')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::delete('guru/{guru}', [GuruController::class, 'destroy'])->name('guru.destroy')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::post('guru/bulk-delete', [GuruController::class, 'destroyBulk'])->name('guru.bulk-delete')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::get('guru/import-template', [GuruController::class, 'importTemplate'])->name('guru.import-template')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::post('guru/import', [GuruController::class, 'import'])->name('guru.import')->middleware('role:super_admin|wakasek_kurikulum|kepala_tatausaha|tatausaha');
        Route::get('guru/{guru}/jadwal', [GuruController::class, 'jadwalDetail'])->name('guru.jadwal-detail');

        // Kenaikan Kelas (modal di halaman Rombel)
        Route::get('kenaikan-kelas/data', [KenaikanKelasController::class, 'data'])->name('kenaikan-kelas.data')->middleware('role:super_admin|wakasek_kesiswaan');
        Route::post('kenaikan-kelas/proses', [KenaikanKelasController::class, 'proses'])->name('kenaikan-kelas.proses')->middleware('role:super_admin|wakasek_kesiswaan');

        // Siswa — read semua admin, write super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha
        Route::get('siswa', [SiswaController::class, 'index'])->name('siswa.index');
        Route::get('siswa/export', [SiswaController::class, 'export'])->name('siswa.export');
        Route::get('siswa/template', [SiswaController::class, 'template'])->name('siswa.template');
        Route::post('siswa', [SiswaController::class, 'store'])->name('siswa.store')->middleware('role:super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha');
        Route::put('siswa/{siswa}', [SiswaController::class, 'update'])->name('siswa.update')->middleware('role:super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha');
        Route::delete('siswa/{siswa}', [SiswaController::class, 'destroy'])->name('siswa.destroy')->middleware('role:super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha');
        Route::post('siswa/bulk-delete', [SiswaController::class, 'destroyBulk'])->name('siswa.bulk-delete')->middleware('role:super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha');
        Route::post('siswa/import', [SiswaController::class, 'import'])->name('siswa.import')->middleware('role:super_admin|wakasek_kesiswaan|kepala_tatausaha|tatausaha');

        // Mata Pelajaran
        Route::get('mata-pelajaran', function (\Illuminate\Http\Request $request) {
            $q = $request->q;
            return Inertia::render('Admin/MataPelajaran/Index', [
                'mataPelajaran' => \App\Models\MataPelajaran::with('jurusan')
                    ->when($q, fn ($query) => $query->where('nama', 'like', "%{$q}%")->orWhere('kode', 'like', "%{$q}%"))
                    ->orderBy('nama')
                    ->paginate(15)
                    ->withQueryString(),
                'jurusan' => \App\Models\Jurusan::all(),
                'filters' => ['q' => $q],
            ]);
        })->name('mata-pelajaran.index');
        Route::post('mata-pelajaran', function (\Illuminate\Http\Request $request) {
            $data = $request->validate(['kode' => 'required|unique:mata_pelajaran', 'nama' => 'required', 'jenjang' => 'required', 'kkm' => 'integer|min:0|max:100', 'jurusan_id' => 'nullable|exists:jurusan,id', 'deskripsi' => 'nullable|string']);
            \App\Models\MataPelajaran::create($data);
            return back()->with('success', 'Mata pelajaran berhasil ditambahkan.');
        })->name('mata-pelajaran.store')->middleware('role:super_admin');
        Route::put('mata-pelajaran/{mataPelajaran}', function (\Illuminate\Http\Request $request, \App\Models\MataPelajaran $mataPelajaran) {
            $data = $request->validate(['kode' => 'required|unique:mata_pelajaran,kode,' . $mataPelajaran->id, 'nama' => 'required', 'jenjang' => 'required', 'kkm' => 'integer|min:0|max:100', 'jurusan_id' => 'nullable|exists:jurusan,id', 'deskripsi' => 'nullable|string']);
            $mataPelajaran->update($data);
            return back()->with('success', 'Mata pelajaran berhasil diperbarui.');
        })->name('mata-pelajaran.update')->middleware('role:super_admin');
        Route::delete('mata-pelajaran/{mataPelajaran}', function (\App\Models\MataPelajaran $mataPelajaran) {
            $mataPelajaran->delete();
            return back()->with('success', 'Mata pelajaran berhasil dihapus.');
        })->name('mata-pelajaran.destroy')->middleware('role:super_admin');

        // Pembelajaran
        Route::get('pembelajaran', function (\Illuminate\Http\Request $request) {
            $selectedRombelId = $request->rombel_id ? (int) $request->rombel_id : null;
            $tahunAktif       = \App\Models\TahunAjaran::aktif();

            $pembelajaranList = $selectedRombelId
                ? \App\Models\Pembelajaran::with(['mataPelajaran', 'guru.user', 'jurusan'])
                    ->where('rombel_id', $selectedRombelId)
                    ->orderBy('id')
                    ->get()
                : collect();

            $tanpaJadwal = \App\Models\Pembelajaran::with(['mataPelajaran', 'guru.user', 'rombel'])
                ->where('is_aktif', true)
                ->when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
                ->whereDoesntHave('jadwal')
                ->get()
                ->sortBy(fn ($p) => $p->rombel?->nama ?? 'zzz')
                ->values()
                ->map(fn ($p) => [
                    'id'             => $p->id,
                    'mata_pelajaran' => $p->mataPelajaran?->nama ?? '–',
                    'guru'           => $p->guru?->user?->name ?? '–',
                    'rombel'         => $p->rombel?->nama ?? '–',
                    'rombel_id'      => $p->rombel_id,
                ]);

            return Inertia::render('Admin/Pembelajaran/Index', [
                'rombelList'        => \App\Models\Rombel::with(['kelas', 'jurusanList'])->where('is_aktif', true)->orderBy('nama')->get(),
                'mataPelajaran'     => \App\Models\MataPelajaran::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama']),
                'guruList'          => \App\Models\Guru::with('user')->where('is_aktif', true)->get(['id', 'user_id', 'bidang_studi']),
                'jurusanList'       => \App\Models\Jurusan::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama', 'kode']),
                'tahunAjaran'       => $tahunAktif,
                'selectedRombelId'  => $selectedRombelId,
                'pembelajaranList'  => $pembelajaranList,
                'tanpaJadwal'       => $tanpaJadwal,
            ]);
        })->name('pembelajaran.index');
        Route::post('pembelajaran/bulk', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'rombel_id'                    => 'required|exists:rombel,id',
                'tahun_ajaran_id'              => 'nullable|exists:tahun_ajaran,id',
                'rows'                         => 'array',
                'rows.*.id'                    => 'nullable|exists:pembelajaran,id',
                'rows.*.mata_pelajaran_id'     => 'nullable|exists:mata_pelajaran,id',
                'rows.*.guru_id'               => 'nullable|exists:guru,id',
                'rows.*.jurusan_id'            => 'nullable|exists:jurusan,id',
                'rows.*._delete'               => 'boolean',
            ]);

            foreach ($request->rows ?? [] as $row) {
                if ($row['_delete'] ?? false) {
                    if (!empty($row['id'])) {
                        \App\Models\Pembelajaran::find($row['id'])?->delete();
                    }
                } elseif (!empty($row['mata_pelajaran_id']) && !empty($row['guru_id'])) {
                    if (!empty($row['id'])) {
                        \App\Models\Pembelajaran::find($row['id'])?->update([
                            'mata_pelajaran_id' => $row['mata_pelajaran_id'],
                            'guru_id'           => $row['guru_id'],
                            'jurusan_id'        => $row['jurusan_id'] ?? null,
                        ]);
                    } else {
                        \App\Models\Pembelajaran::create([
                            'rombel_id'         => $request->rombel_id,
                            'tahun_ajaran_id'   => $request->tahun_ajaran_id,
                            'mata_pelajaran_id' => $row['mata_pelajaran_id'],
                            'guru_id'           => $row['guru_id'],
                            'jurusan_id'        => $row['jurusan_id'] ?? null,
                            'is_aktif'          => true,
                        ]);
                    }
                }
            }

            return back()->with('success', 'Pembelajaran berhasil disimpan.');
        })->name('pembelajaran.bulk')->middleware('role:super_admin|wakasek_kurikulum');
        Route::delete('pembelajaran/{pembelajaran}', function (\App\Models\Pembelajaran $pembelajaran) {
            $pembelajaran->delete();
            return back()->with('success', 'Pembelajaran berhasil dihapus.');
        })->name('pembelajaran.destroy')->middleware('role:super_admin|wakasek_kurikulum');

        Route::get('pembelajaran/export', function () {
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\PembelajaranTemplateExport(),
                'pembelajaran-' . now()->format('Ymd') . '.xlsx'
            );
        })->name('pembelajaran.export');

        Route::get('pembelajaran/template', function (\Illuminate\Http\Request $request) {
            $rombelId   = $request->rombel_id ? (int) $request->rombel_id : null;
            $rombel     = $rombelId ? \App\Models\Rombel::find($rombelId) : null;
            $fn = $rombel
                ? 'template_pembelajaran_' . \Illuminate\Support\Str::slug($rombel->nama) . '.xlsx'
                : 'template_pembelajaran.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\PembelajaranTemplateExport($rombelId),
                $fn
            );
        })->name('pembelajaran.template');

        Route::post('pembelajaran/import', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'rombel_id' => 'required|exists:rombel,id',
                'file'      => 'required|file|mimes:xlsx,xls,csv|max:5120',
            ]);
            $rombelId = (int) $request->rombel_id;
            $import   = new \App\Imports\PembelajaranImport($rombelId);
            try {
                \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
            } catch (\Throwable $e) {
                return back()->withErrors(['file' => 'Gagal membaca file: ' . $e->getMessage()]);
            }
            $msg = "{$import->imported} pembelajaran berhasil diimport.";
            if ($import->skipped)  $msg .= " {$import->skipped} baris dilewati.";
            return redirect('/admin/pembelajaran?rombel_id=' . $rombelId)
                ->with('success', $msg)
                ->with('import_errors', $import->errors ?: null);
        })->name('pembelajaran.import')->middleware('role:super_admin|wakasek_kurikulum');

        // Tata Usaha — read super_admin|kepala_tatausaha, write super_admin|kepala_tatausaha
        Route::get('tatausaha', [TatausahaController::class, 'index'])->name('tatausaha.index');
        Route::post('tatausaha', [TatausahaController::class, 'store'])->name('tatausaha.store')->middleware('role:super_admin|kepala_tatausaha');
        Route::put('tatausaha/{tatausaha}', [TatausahaController::class, 'update'])->name('tatausaha.update')->middleware('role:super_admin|kepala_tatausaha');
        Route::delete('tatausaha/{tatausaha}', [TatausahaController::class, 'destroy'])->name('tatausaha.destroy')->middleware('role:super_admin|kepala_tatausaha');

        // Jurnal Mengajar (view admin)
        Route::get('jurnal-mengajar', [\App\Http\Controllers\Admin\JurnalController::class, 'index'])->name('jurnal-mengajar.index');

        // Jadwal — read kepsek juga, write hanya super_admin|wakasek_kurikulum
        Route::get('jadwal', [JadwalController::class, 'index'])->name('jadwal.index');
        Route::post('jadwal/bulk', [JadwalController::class, 'bulkStore'])->name('jadwal.bulk')->middleware('role:super_admin|wakasek_kurikulum');
        Route::delete('jadwal/{jadwal}', [JadwalController::class, 'destroy'])->name('jadwal.destroy')->middleware('role:super_admin|wakasek_kurikulum');
        Route::get('jadwal/export', [JadwalController::class, 'export'])->name('jadwal.export');
        Route::get('jadwal/template', [JadwalController::class, 'template'])->name('jadwal.template');
        Route::post('jadwal/import', [JadwalController::class, 'import'])->name('jadwal.import')->middleware('role:super_admin|wakasek_kurikulum');

        // Pengaturan Sekolah — read semua admin, write hanya super_admin
        Route::get('pengaturan-sekolah', [PengaturanSekolahController::class, 'index'])->name('pengaturan-sekolah.index');
        Route::put('pengaturan-sekolah', [PengaturanSekolahController::class, 'update'])->name('pengaturan-sekolah.update')->middleware('role:super_admin');
        Route::post('pengaturan-sekolah/identitas', [PengaturanSekolahController::class, 'updateIdentitas'])->name('pengaturan-sekolah.identitas')->middleware('role:super_admin');
        Route::delete('pengaturan-sekolah/logo', [PengaturanSekolahController::class, 'deleteLogo'])->name('pengaturan-sekolah.logo.delete')->middleware('role:super_admin');

        // Laporan
        Route::get('laporan/kehadiran-siswa', [LaporanController::class, 'kehadiranSiswa'])->name('laporan.kehadiran-siswa');
        Route::get('laporan/kehadiran-siswa/export', [LaporanController::class, 'exportKehadiranSiswa'])->name('laporan.kehadiran-siswa.export');
        Route::get('laporan/kehadiran-guru', [LaporanController::class, 'kehadiranGuru'])->name('laporan.kehadiran-guru');
        Route::get('laporan/kehadiran-guru/detail', [LaporanController::class, 'kehadiranGuruDetail'])->name('laporan.kehadiran-guru.detail');
        Route::get('laporan/kehadiran-guru/export', [LaporanController::class, 'exportKehadiranGuru'])->name('laporan.kehadiran-guru.export');
        Route::get('laporan/kehadiran-guru/semester', [LaporanController::class, 'kehadiranGuruSemester'])->name('laporan.kehadiran-guru.semester');
        Route::get('laporan/kehadiran-guru/semester/export', [LaporanController::class, 'exportKehadiranGuruSemester'])->name('laporan.kehadiran-guru.semester.export');
        Route::get('laporan/keaktifan-jurnal',              [LaporanController::class, 'keaktifanJurnal'])->name('laporan.keaktifan-jurnal');
        Route::get('laporan/keaktifan-jurnal/{guru}/detail', [LaporanController::class, 'keaktifanJurnalDetail'])->name('laporan.keaktifan-jurnal.detail');
        Route::get('laporan/kehadiran-tatausaha', [LaporanController::class, 'kehadiranTatausaha'])->name('laporan.kehadiran-tatausaha');
        Route::get('laporan/kehadiran-tatausaha/export', [LaporanController::class, 'exportKehadiranTatausaha'])->name('laporan.kehadiran-tatausaha.export');
        Route::get('laporan/keaktifan-jurnal-tatausaha', [LaporanController::class, 'keaktifanJurnalTatausaha'])->name('laporan.keaktifan-jurnal-tatausaha');
        Route::get('laporan/keaktifan-jurnal-tatausaha/{tatausaha}/detail', [LaporanController::class, 'keaktifanJurnalTatausahaDetail'])->name('laporan.keaktifan-jurnal-tatausaha.detail');
        Route::get('laporan/kehadiran-manajemen', [LaporanController::class, 'kehadiranManajemen'])->name('laporan.kehadiran-manajemen');
        Route::post('laporan/absensi-guru', [LaporanController::class, 'storeAbsensiGuru'])->name('laporan.absensi-guru.store')->middleware('role:super_admin|wakasek_kurikulum');

        // Buku Tamu
        Route::get('buku-tamu', [BukuTamuAdminController::class, 'index'])->name('buku-tamu.admin');
        Route::patch('buku-tamu/{bukuTamu}/status', [BukuTamuAdminController::class, 'updateStatus'])->name('buku-tamu.update-status');

        // Riwayat Jurnal (rekap oleh admin/kepsek)
        Route::middleware('role:super_admin|kepala_sekolah')->group(function () {
            Route::get('riwayat-jurnal/tatausaha', [RiwayatJurnalController::class, 'tatausaha'])->name('riwayat-jurnal.tatausaha');
            Route::get('riwayat-jurnal/pokja',     [RiwayatJurnalController::class, 'pokja'])->name('riwayat-jurnal.pokja');
            Route::get('riwayat-jurnal/wakasek',   [RiwayatJurnalController::class, 'wakasek'])->name('riwayat-jurnal.wakasek');
            Route::get('riwayat-jurnal/kepala-tu',      [RiwayatJurnalController::class, 'kepalaTU'])->name('riwayat-jurnal.kepala-tu');
            Route::get('riwayat-jurnal/kepala-sekolah', [RiwayatJurnalController::class, 'kepalaSekolah'])->name('riwayat-jurnal.kepala-sekolah');
            Route::get('riwayat-jurnal/kepala-kk',      [RiwayatJurnalController::class, 'kepalaKK'])->name('riwayat-jurnal.kepala-kk');
        });

        // Pengumpulan (super_admin + wakasek_kurikulum)
        Route::get('pengumpulan',                            [PengumpulanController::class, 'index'])->name('pengumpulan.index')->middleware('role:super_admin|wakasek_kurikulum');
        Route::post('pengumpulan',                           [PengumpulanController::class, 'store'])->name('pengumpulan.store')->middleware('role:super_admin|wakasek_kurikulum');
        Route::get('pengumpulan/{pengumpulan}',              [PengumpulanController::class, 'show'])->name('pengumpulan.show')->middleware('role:super_admin|wakasek_kurikulum');
        Route::put('pengumpulan/{pengumpulan}',              [PengumpulanController::class, 'update'])->name('pengumpulan.update')->middleware('role:super_admin|wakasek_kurikulum');
        Route::delete('pengumpulan/{pengumpulan}',           [PengumpulanController::class, 'destroy'])->name('pengumpulan.destroy')->middleware('role:super_admin|wakasek_kurikulum');

        // Hari Libur
        Route::get('hari-libur',                  [HariLiburController::class, 'index'])->name('hari-libur.index')->middleware('role:super_admin|wakasek_kurikulum');
        Route::post('hari-libur',                 [HariLiburController::class, 'store'])->name('hari-libur.store')->middleware('role:super_admin|wakasek_kurikulum');
        Route::put('hari-libur/{hariLibur}',          [HariLiburController::class, 'update'])->name('hari-libur.update')->middleware('role:super_admin|wakasek_kurikulum');
        Route::delete('hari-libur/{hariLibur}',       [HariLiburController::class, 'destroy'])->name('hari-libur.destroy')->middleware('role:super_admin|wakasek_kurikulum');
        Route::get('hari-libur/{hariLibur}/preview',  [HariLiburController::class, 'syncPreview'])->name('hari-libur.sync-preview')->middleware('role:super_admin|wakasek_kurikulum');
        Route::post('hari-libur/{hariLibur}/sync',    [HariLiburController::class, 'sync'])->name('hari-libur.sync')->middleware('role:super_admin|wakasek_kurikulum');

        // Pengaturan Surat (super_admin only)
        Route::get('pengaturan-surat',                         [PengaturanSuratController::class, 'index'])->name('pengaturan-surat.index')->middleware('role:super_admin');
        Route::post('pengaturan-surat/kop',                   [PengaturanSuratController::class, 'updateKop'])->name('pengaturan-surat.kop')->middleware('role:super_admin');
        Route::post('pengaturan-surat/format',                [PengaturanSuratController::class, 'updateFormat'])->name('pengaturan-surat.format')->middleware('role:super_admin');
        Route::post('pengaturan-surat/kode-dept',             [PengaturanSuratController::class, 'storeDept'])->name('pengaturan-surat.dept.store')->middleware('role:super_admin');
        Route::put('pengaturan-surat/kode-dept/{dept}',       [PengaturanSuratController::class, 'updateDept'])->name('pengaturan-surat.dept.update')->middleware('role:super_admin');
        Route::delete('pengaturan-surat/kode-dept/{dept}',    [PengaturanSuratController::class, 'destroyDept'])->name('pengaturan-surat.dept.destroy')->middleware('role:super_admin');
        Route::post('pengaturan-surat/kode-jenis',            [PengaturanSuratController::class, 'storeJenis'])->name('pengaturan-surat.jenis.store')->middleware('role:super_admin');
        Route::put('pengaturan-surat/kode-jenis/{jenis}',     [PengaturanSuratController::class, 'updateJenis'])->name('pengaturan-surat.jenis.update')->middleware('role:super_admin');
        Route::delete('pengaturan-surat/kode-jenis/{jenis}',  [PengaturanSuratController::class, 'destroyJenis'])->name('pengaturan-surat.jenis.destroy')->middleware('role:super_admin');

        // Pesan Popup (super_admin only)
        Route::get('pesan-popup',                   [\App\Http\Controllers\Admin\PesanPopupController::class, 'index'])->name('pesan-popup.index')->middleware('role:super_admin');
        Route::post('pesan-popup',                  [\App\Http\Controllers\Admin\PesanPopupController::class, 'store'])->name('pesan-popup.store')->middleware('role:super_admin');
        Route::put('pesan-popup/{pesanPopup}',       [\App\Http\Controllers\Admin\PesanPopupController::class, 'update'])->name('pesan-popup.update')->middleware('role:super_admin');
        Route::delete('pesan-popup/{pesanPopup}',    [\App\Http\Controllers\Admin\PesanPopupController::class, 'destroy'])->name('pesan-popup.destroy')->middleware('role:super_admin');

        // Info Menu (badge) — super_admin only
        Route::middleware('role:super_admin')->group(function () {
            Route::get('menu-badge', function () {
                return \Inertia\Inertia::render('Admin/MenuBadge/Index', [
                    'badges' => \App\Models\MenuBadge::asMap(),
                ]);
            })->name('menu-badge.index');

            Route::post('menu-badge', function (\Illuminate\Http\Request $request) {
                $request->validate([
                    'path'  => 'required|string|max:200',
                    'badge' => 'nullable|in:beta,maintenance,pengembangan',
                ]);
                if (empty($request->badge)) {
                    \App\Models\MenuBadge::where('path', $request->path)->delete();
                } else {
                    \App\Models\MenuBadge::updateOrCreate(
                        ['path'  => $request->path],
                        ['badge' => $request->badge],
                    );
                }
                return back();
            })->name('menu-badge.save');

            // Mode Pemeliharaan
            Route::middleware('role:super_admin')->group(function () {
                Route::get('pemeliharaan', function () {
                    $sekolah = \App\Models\PengaturanSekolah::current();
                    return Inertia::render('Admin/Pemeliharaan/Index', [
                        'isMaintenance'      => (bool) $sekolah->is_maintenance,
                        'maintenanceMessage' => $sekolah->maintenance_message,
                        'namaSekolah'        => $sekolah->nama_sekolah,
                    ]);
                })->name('pemeliharaan.index');
                Route::post('pemeliharaan/toggle', function () {
                    $sekolah = \App\Models\PengaturanSekolah::current();
                    $sekolah->update(['is_maintenance' => !$sekolah->is_maintenance]);
                    $status = $sekolah->fresh()->is_maintenance ? 'diaktifkan' : 'dinonaktifkan';
                    return back()->with('success', "Mode pemeliharaan berhasil {$status}.");
                })->name('pemeliharaan.toggle');
                Route::post('pemeliharaan/pesan', function (\Illuminate\Http\Request $request) {
                    $request->validate(['maintenance_message' => 'nullable|string|max:500']);
                    \App\Models\PengaturanSekolah::current()->update(['maintenance_message' => $request->maintenance_message]);
                    return back()->with('success', 'Pesan pemeliharaan berhasil disimpan.');
                })->name('pemeliharaan.pesan');
            });

            // Backup & Restore
            Route::middleware('role:super_admin')->group(function () {
                Route::get('backup',                    [BackupController::class, 'index'])   ->name('backup.index');
                Route::post('backup',                   [BackupController::class, 'create'])  ->name('backup.create');
                Route::get('backup/{filename}/download',[BackupController::class, 'download'])->name('backup.download');
                Route::post('backup/restore',           [BackupController::class, 'restore']) ->name('backup.restore');
                Route::delete('backup/{filename}',      [BackupController::class, 'destroy']) ->name('backup.destroy');
            });

            // RBAC Management
            Route::middleware('role:super_admin')->group(function () {
                Route::get('rbac',                          [RbacController::class, 'index'])         ->name('rbac.index');
                Route::post('rbac/users/{user}/roles',      [RbacController::class, 'syncUserRoles']) ->name('rbac.user-roles.sync');
            });

            // Masukan & Laporan — admin view
            Route::middleware('role:super_admin')->group(function () {
                Route::get('masukan',                       [MasukanController::class, 'index'])        ->name('masukan.index');
                Route::patch('masukan/{masukan}/status',    [MasukanController::class, 'updateStatus']) ->name('masukan.update-status');
            });
        });

        // KPI Guru
        Route::get('kpi',                [KpiController::class, 'index'])->name('kpi.index');
        Route::get('kpi/hitung',         [KpiController::class, 'hitung'])->name('kpi.hitung');
        Route::post('kpi',               [KpiController::class, 'store'])->name('kpi.store');
        Route::post('kpi/bobot',         [KpiController::class, 'updateBobot'])->name('kpi.bobot');

        // KPI Tata Usaha
        Route::get('kpi-tatausaha',               [KpiTatausahaController::class, 'index'])->name('kpi-tatausaha.index');
        Route::get('kpi-tatausaha/hitung',        [KpiTatausahaController::class, 'hitung'])->name('kpi-tatausaha.hitung');
        Route::post('kpi-tatausaha',              [KpiTatausahaController::class, 'store'])->name('kpi-tatausaha.store');
        Route::post('kpi-tatausaha/bobot',        [KpiTatausahaController::class, 'updateBobot'])->name('kpi-tatausaha.bobot');

        // KPI Manajemen
        Route::get('kpi-manajemen',               [KpiManajemenController::class, 'index'])->name('kpi-manajemen.index');
        Route::get('kpi-manajemen/hitung',        [KpiManajemenController::class, 'hitung'])->name('kpi-manajemen.hitung');
        Route::post('kpi-manajemen',              [KpiManajemenController::class, 'store'])->name('kpi-manajemen.store');
        Route::post('kpi-manajemen/bobot',        [KpiManajemenController::class, 'updateBobot'])->name('kpi-manajemen.bobot');

        // Catatan Kepsek
        Route::get('catatan-kepsek', fn () => Inertia::render('Admin/CatatanKepsek/Index', [
            'catatan'   => \App\Models\CatatanKepsek::with(['guru.user', 'tatausaha.user', 'kepsek'])->latest()->paginate(15),
            'guru'      => \App\Models\Guru::with('user')->where('is_aktif', true)->get(),
            'tatausaha' => \App\Models\Tatausaha::with('user')->where('is_aktif', true)->get(),
        ]))->name('catatan-kepsek.index');
        Route::post('catatan-kepsek', function (\Illuminate\Http\Request $request) {
            if (!auth()->user()->hasAnyRole(['kepala_sekolah', 'super_admin'])) abort(403);
            $sasaran = $request->input('sasaran', 'guru');
            if ($sasaran === 'tatausaha') {
                $data = $request->validate(['tatausaha_id' => 'required|exists:tatausaha,id', 'kategori' => 'required', 'judul' => 'required|string', 'catatan' => 'required|string']);
            } else {
                $data = $request->validate(['guru_id' => 'required|exists:guru,id', 'kategori' => 'required', 'judul' => 'required|string', 'catatan' => 'required|string']);
            }
            \App\Models\CatatanKepsek::create([...$data, 'kepsek_id' => auth()->id(), 'status' => 'Terkirim']);
            return back()->with('success', 'Catatan berhasil dikirim.');
        })->name('catatan-kepsek.store');
        Route::delete('catatan-kepsek/{catatan}', function (\App\Models\CatatanKepsek $catatan) {
            if (!auth()->user()->hasAnyRole(['kepala_sekolah', 'super_admin'])) abort(403);
            $catatan->delete();
            return back()->with('success', 'Catatan berhasil dihapus.');
        })->name('catatan-kepsek.destroy');
    });

    // Guru Piket
    Route::middleware('role:guru_piket|super_admin|kepala_sekolah|wakasek_kesiswaan|kepala_tatausaha')
        ->prefix('piket')->name('piket.')
        ->group(function () {
            Route::get('/',           [PiketController::class, 'index'])              ->name('dashboard');
            Route::get('/tatausaha',  [PiketController::class, 'kehadiranTatausaha'])->name('tatausaha');
            Route::get('/manajemen',  [PiketController::class, 'kehadiranManajemen'])->name('manajemen');
            Route::post('/absensi',   [PiketController::class, 'store'])              ->name('absensi.store');

            // Presensi Guru Harian oleh Piket
            Route::post('/absensi-guru', [PiketController::class, 'storeAbsensiGuru'])->name('absensi-guru.store');

            // Presensi Tata Usaha oleh Piket
            Route::post('/absensi-tatausaha', function (\Illuminate\Http\Request $request) {
                $data = $request->validate([
                    'tatausaha_id' => 'required|exists:tatausaha,id',
                    'status'       => 'required|in:Hadir,Sakit,Izin,Alpha,Tugas_Sekolah',
                    'keterangan'   => 'nullable|string|max:500',
                ]);
                \App\Models\AbsensiTatausaha::updateOrCreate(
                    ['tatausaha_id' => $data['tatausaha_id'], 'tanggal' => today()->toDateString()],
                    ['status' => $data['status'], 'keterangan' => $data['keterangan'] ?? null, 'dicatat_oleh' => auth()->id()]
                );
                return back()->with('success', 'Presensi tata usaha berhasil disimpan.');
            })->name('absensi-tatausaha.store');
        });

    // Presensi Siswa Harian (Guru BK)
    Route::prefix('guru')->name('guru.')->middleware('role:guru|super_admin|kepala_sekolah|wakasek_kesiswaan')->group(function () {
        Route::get('presensi-harian',        [PresensiHarianController::class, 'index'])->name('presensi-harian.index');
        Route::post('presensi-harian',       [PresensiHarianController::class, 'store'])->name('presensi-harian.store');
        Route::get('presensi-harian/rekap',  [PresensiHarianController::class, 'rekap'])->name('presensi-harian.rekap');
    });

    // Guru area
    Route::prefix('guru')->name('guru.')->middleware('role:guru|kepala_sekolah|wakasek_kurikulum|super_admin')->group(function () {
        // Jadwal Saya
        Route::get('jadwal-saya', function () {
            $guru       = auth()->user()->guru;
            $pengaturan = \App\Models\PengaturanSekolah::current();
            $hariAktif  = $pengaturan->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            $tahunAktif = \App\Models\TahunAjaran::aktif();

            $hariMap = [0 => 'Ahad', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'];
            $hariIni = $hariMap[now()->dayOfWeek] ?? 'Senin';

            $jadwal = collect();
            if ($guru && $tahunAktif) {
                $jadwal = \App\Models\Jadwal::with(['pembelajaran.mataPelajaran', 'pembelajaran.rombel'])
                    ->whereHas('pembelajaran', fn ($q) => $q
                        ->where('guru_id', $guru->id)
                        ->where('tahun_ajaran_id', $tahunAktif->id)
                    )
                    ->where('is_aktif', true)
                    ->orderByRaw("FIELD(hari, '" . implode("','", $hariAktif) . "')")
                    ->orderBy('jam_ke')
                    ->get()
                    ->map(fn ($j) => [
                        'id'             => $j->id,
                        'hari'           => $j->hari,
                        'jam_ke'         => $j->jam_ke,
                        'jam_mulai'      => $j->jam_mulai,
                        'jam_selesai'    => $j->jam_selesai,
                        'mata_pelajaran' => $j->pembelajaran?->mataPelajaran?->nama,
                        'kode_mapel'     => $j->pembelajaran?->mataPelajaran?->kode,
                        'rombel'         => $j->pembelajaran?->rombel?->nama,
                        'pembelajaran_id' => $j->pembelajaran_id,
                    ]);
            }

            return Inertia::render('Guru/JadwalSaya/Index', [
                'jadwal'     => $jadwal,
                'hariAktif'  => $hariAktif,
                'hariIni'    => in_array($hariIni, $hariAktif) ? $hariIni : $hariAktif[0],
                'tahunAktif' => $tahunAktif ? $tahunAktif->nama . ' — ' . $tahunAktif->semester : null,
                'sekolah'    => [
                    'nama'          => $pengaturan->nama_sekolah,
                    'npsn'          => $pengaturan->npsn,
                    'alamat'        => $pengaturan->alamat,
                    'kota'          => $pengaturan->kota,
                    'telepon'       => $pengaturan->telepon,
                    'website'       => $pengaturan->website,
                    'kepala'        => $pengaturan->kepala_sekolah_nama,
                    'nip_kepala'    => $pengaturan->nip_kepala,
                    'logo_url'      => $pengaturan->logo_url,
                    'yayasan_dinas' => $pengaturan->yayasan_dinas,
                ],
            ]);
        })->name('jadwal-saya.index');

        // Detail jurnal mengajar per pembelajaran
        Route::get('jadwal-saya/detail/{pembelajaran}', function (\App\Models\Pembelajaran $pembelajaran) {
            $guruId  = auth()->user()->guru?->id;
            $isAdmin = auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
            abort_if(!$isAdmin && $pembelajaran->guru_id !== $guruId, 403);

            $pembelajaran->load('mataPelajaran', 'rombel', 'jurusan', 'guru.user');

            $jurnalList = \App\Models\JurnalMengajar::with('capaianPembelajaran')
                ->where('pembelajaran_id', $pembelajaran->id)
                ->orderBy('tanggal', 'desc')
                ->get()
                ->map(fn ($j) => [
                    'id'            => $j->id,
                    'tanggal'       => $j->tanggal?->format('Y-m-d'),
                    'pertemuan_ke'  => $j->pertemuan_ke,
                    'materi_pokok'  => $j->materi_pokok,
                    'uraian_materi' => $j->uraian_materi,
                    'metode'        => $j->metode,
                    'media_type'    => $j->media_type,
                    'media_link'    => $j->media_link,
                    'media_ref_judul' => $j->media_ref_judul,
                    'media_url'     => $j->media_url,
                    'jumlah_hadir'  => $j->jumlah_hadir,
                    'catatan'       => $j->catatan,
                    'capaian'       => $j->capaianPembelajaran->map(fn ($c) => [
                        'id'           => $c->id,
                        'kode_lengkap' => $c->kode_lengkap,
                        'capaian'      => $c->capaian,
                    ])->values(),
                ]);

            return Inertia::render('Guru/JadwalSaya/JurnalDetail', [
                'pembelajaran' => [
                    'id'            => $pembelajaran->id,
                    'mata_pelajaran' => $pembelajaran->mataPelajaran?->nama,
                    'kode_mapel'    => $pembelajaran->mataPelajaran?->kode,
                    'rombel'        => $pembelajaran->rombel?->nama,
                    'jurusan'       => $pembelajaran->jurusan?->nama,
                    'guru'          => $pembelajaran->guru?->user?->name,
                ],
                'jurnalList' => $jurnalList,
            ]);
        })->name('jadwal-saya.detail');

        // Absensi — per jurnal mengajar
        Route::get('absensi', [AbsensiController::class, 'index'])->name('absensi.index');
        Route::get('absensi/{jurnal}', [AbsensiController::class, 'show'])->name('absensi.show');
        Route::post('absensi/{jurnal}', [AbsensiController::class, 'store'])->name('absensi.store');

        // Capaian Pembelajaran
        Route::get('capaian-pembelajaran',                   [\App\Http\Controllers\Guru\CapaianPembelajaranController::class, 'index'])->name('capaian.index');
        Route::post('capaian-pembelajaran',                  [\App\Http\Controllers\Guru\CapaianPembelajaranController::class, 'store'])->name('capaian.store');
        Route::put('capaian-pembelajaran/{capaian}',         [\App\Http\Controllers\Guru\CapaianPembelajaranController::class, 'update'])->name('capaian.update');
        Route::delete('capaian-pembelajaran/{capaian}',      [\App\Http\Controllers\Guru\CapaianPembelajaranController::class, 'destroy'])->name('capaian.destroy');
        Route::get('capaian-pembelajaran/{capaian}/jurnal',  [\App\Http\Controllers\Guru\CapaianPembelajaranController::class, 'detailJurnal'])->name('capaian.jurnal');

        // Jurnal Mengajar
        Route::get('jurnal', [JurnalController::class, 'index'])->name('jurnal.index');
        Route::post('jurnal', [JurnalController::class, 'store'])->name('jurnal.store');
        Route::put('jurnal/{jurnal}', [JurnalController::class, 'update'])->name('jurnal.update');
        Route::delete('jurnal/{jurnal}', [JurnalController::class, 'destroy'])->name('jurnal.destroy');
        Route::get('jurnal/riwayat', [JurnalController::class, 'riwayat'])->name('jurnal.riwayat');

        // Nilai
        Route::get('nilai', [NilaiController::class, 'index'])->name('nilai.index');
        Route::get('nilai/{pembelajaran}', [NilaiController::class, 'show'])->name('nilai.show');
        Route::post('nilai', [NilaiController::class, 'store'])->name('nilai.store');
        Route::post('nilai/{pembelajaran}/jurnal/{jurnal}', [NilaiController::class, 'saveJurnal'])->name('nilai.save_jurnal');
        Route::get('nilai/{pembelajaran}/export', [NilaiController::class, 'export'])->name('nilai.export');

        // Media Pembelajaran
        Route::get('video-pembelajaran', function (\Illuminate\Http\Request $request) {
            $guruId  = auth()->user()->guru?->id;
            $isAdmin = auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
            $filterGuru = $isAdmin ? $request->guru_id : null;
            $mapelIds = $guruId && !$isAdmin
                ? \App\Models\Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
                : null;
            return Inertia::render('Guru/Media/VideoPembelajaran', [
                'items'         => \App\Models\VideoEdukasi::with(['mataPelajaran', 'guru.user'])
                    ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
                    ->when($filterGuru, fn ($q) => $q->where('guru_id', $filterGuru))
                    ->latest()->paginate(15),
                'mataPelajaran' => $mapelIds
                    ? \App\Models\MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get()
                    : \App\Models\MataPelajaran::where('is_aktif', true)->get(),
                'guruList'      => $isAdmin ? \App\Models\Guru::with('user')->get() : collect(),
                'isAdmin'       => $isAdmin,
                'filters'       => ['guru_id' => $filterGuru],
            ]);
        })->name('video-pembelajaran.index');
        Route::post('video-pembelajaran', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'judul'             => 'required|string|max:255',
                'url_video'         => 'required_without:file|nullable|url',
                'file'              => 'required_without:url_video|nullable|file|mimes:mp4,mkv,avi,mov,webm,m4v|max:204800',
                'sumber'            => 'nullable|string',
                'mata_pelajaran_id' => 'nullable|exists:mata_pelajaran,id',
                'deskripsi'         => 'nullable|string',
            ]);

            if ($request->hasFile('file')) {
                $path   = $request->file('file')->store('media/video', 'public');
                $urlVideo = $path;
                $sumber   = 'Upload';
            } else {
                $urlVideo = $request->url_video;
                $sumber   = $request->sumber ?? 'Lainnya';
            }

            \App\Models\VideoEdukasi::create([
                'judul'             => $request->judul,
                'url_video'         => $urlVideo,
                'sumber'            => $sumber,
                'mata_pelajaran_id' => $request->mata_pelajaran_id,
                'deskripsi'         => $request->deskripsi,
                'guru_id'           => auth()->user()->guru?->id,
                'is_publik'         => true,
            ]);
            return back()->with('success', 'Video berhasil ditambahkan.');
        })->name('video-pembelajaran.store');
        Route::delete('video-pembelajaran/{item}', function (\App\Models\VideoEdukasi $item) {
            $item->delete();
            return back()->with('success', 'Video berhasil dihapus.');
        })->name('video-pembelajaran.destroy');

        Route::get('presentasi', function (\Illuminate\Http\Request $request) {
            $guruId  = auth()->user()->guru?->id;
            $isAdmin = auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
            $filterGuru = $isAdmin ? $request->guru_id : null;
            $mapelIds = $guruId && !$isAdmin
                ? \App\Models\Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
                : null;
            return Inertia::render('Guru/Media/Presentasi', [
                'items'         => \App\Models\Presentasi::with(['mataPelajaran', 'guru.user'])
                    ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
                    ->when($filterGuru, fn ($q) => $q->where('guru_id', $filterGuru))
                    ->latest()->paginate(15),
                'mataPelajaran' => $mapelIds
                    ? \App\Models\MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get()
                    : \App\Models\MataPelajaran::where('is_aktif', true)->get(),
                'guruList'      => $isAdmin ? \App\Models\Guru::with('user')->get() : collect(),
                'isAdmin'       => $isAdmin,
                'filters'       => ['guru_id' => $filterGuru],
            ]);
        })->name('presentasi.index');
        Route::post('presentasi', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'judul'             => 'required|string|max:255',
                'file'              => 'required_without:url|file|mimes:pptx,ppt,pdf|max:51200',
                'url'               => 'required_without:file|nullable|url|max:500',
                'mata_pelajaran_id' => 'nullable|exists:mata_pelajaran,id',
                'deskripsi'         => 'nullable|string',
            ]);
            $data = [
                'guru_id'           => auth()->user()->guru?->id,
                'judul'             => $request->judul,
                'mata_pelajaran_id' => $request->mata_pelajaran_id,
                'deskripsi'         => $request->deskripsi,
                'platform'          => 'Upload',
            ];
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $data += [
                    'file_path' => $file->store('presentasi', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_ext'  => strtolower($file->getClientOriginalExtension()),
                    'file_size' => $file->getSize(),
                ];
            } else {
                $data['url'] = $request->url;
            }
            \App\Models\Presentasi::create($data);
            return back()->with('success', $request->hasFile('file') ? 'Presentasi berhasil diunggah.' : 'Link presentasi berhasil disimpan.');
        })->name('presentasi.store');
        Route::delete('presentasi/{item}', function (\App\Models\Presentasi $item) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($item->file_path);
            $item->delete();
            return back()->with('success', 'Presentasi berhasil dihapus.');
        })->name('presentasi.destroy');

        Route::get('modul-ajar', function (\Illuminate\Http\Request $request) {
            $guruId  = auth()->user()->guru?->id;
            $isAdmin = auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
            $filterGuru = $isAdmin ? $request->guru_id : null;
            $mapelIds = $guruId && !$isAdmin
                ? \App\Models\Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
                : null;
            return Inertia::render('Guru/Media/ModulAjar', [
                'items'         => \App\Models\ModulDigital::with(['mataPelajaran', 'guru.user'])
                    ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
                    ->when($filterGuru, fn ($q) => $q->where('guru_id', $filterGuru))
                    ->latest()->paginate(15),
                'mataPelajaran' => $mapelIds
                    ? \App\Models\MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get()
                    : \App\Models\MataPelajaran::where('is_aktif', true)->get(),
                'guruList'      => $isAdmin ? \App\Models\Guru::with('user')->get() : collect(),
                'isAdmin'       => $isAdmin,
                'filters'       => ['guru_id' => $filterGuru],
            ]);
        })->name('modul-ajar.index');
        Route::post('modul-ajar', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'judul'             => 'required|string|max:255',
                'file'              => 'required_without:url|file|mimes:pdf,doc,docx|max:51200',
                'url'               => 'required_without:file|nullable|url|max:500',
                'mata_pelajaran_id' => 'nullable|exists:mata_pelajaran,id',
                'deskripsi'         => 'nullable|string',
            ]);
            $data = [
                'guru_id'           => auth()->user()->guru?->id,
                'judul'             => $request->judul,
                'mata_pelajaran_id' => $request->mata_pelajaran_id,
                'deskripsi'         => $request->deskripsi,
                'tipe'              => 'Modul',
            ];
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $data += [
                    'file_path' => $file->store('modul-ajar', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_ext'  => strtolower($file->getClientOriginalExtension()),
                    'file_size' => $file->getSize(),
                ];
            } else {
                $data['url'] = $request->url;
            }
            \App\Models\ModulDigital::create($data);
            return back()->with('success', $request->hasFile('file') ? 'Modul ajar berhasil diunggah.' : 'Link modul ajar berhasil disimpan.');
        })->name('modul-ajar.store');
        Route::delete('modul-ajar/{item}', function (\App\Models\ModulDigital $item) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($item->file_path);
            $item->delete();
            return back()->with('success', 'Modul ajar berhasil dihapus.');
        })->name('modul-ajar.destroy');

        Route::get('jobsheet', function (\Illuminate\Http\Request $request) {
            $guruId  = auth()->user()->guru?->id;
            $isAdmin = auth()->user()->hasAnyRole(['super_admin', 'kepala_sekolah', 'wakasek_kurikulum']);
            $filterGuru = $isAdmin ? $request->guru_id : null;
            $mapelIds = $guruId && !$isAdmin
                ? \App\Models\Pembelajaran::where('guru_id', $guruId)->pluck('mata_pelajaran_id')->unique()
                : null;
            return Inertia::render('Guru/Media/Jobsheet', [
                'items'         => \App\Models\Jobsheet::with(['mataPelajaran', 'guru.user'])
                    ->when(!$isAdmin && $guruId, fn ($q) => $q->where('guru_id', $guruId))
                    ->when($filterGuru, fn ($q) => $q->where('guru_id', $filterGuru))
                    ->latest()->paginate(15),
                'mataPelajaran' => $mapelIds
                    ? \App\Models\MataPelajaran::whereIn('id', $mapelIds)->where('is_aktif', true)->get()
                    : \App\Models\MataPelajaran::where('is_aktif', true)->get(),
                'guruList'      => $isAdmin ? \App\Models\Guru::with('user')->get() : collect(),
                'isAdmin'       => $isAdmin,
                'filters'       => ['guru_id' => $filterGuru],
            ]);
        })->name('jobsheet.index');
        Route::post('jobsheet', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'judul'             => 'required|string|max:255',
                'file'              => 'required_without:url|file|mimes:pdf,doc,docx,xlsx,xlsm|max:51200',
                'url'               => 'required_without:file|nullable|url|max:500',
                'mata_pelajaran_id' => 'nullable|exists:mata_pelajaran,id',
                'deskripsi'         => 'nullable|string',
            ]);
            $data = [
                'guru_id'           => auth()->user()->guru?->id,
                'judul'             => $request->judul,
                'mata_pelajaran_id' => $request->mata_pelajaran_id,
                'deskripsi'         => $request->deskripsi,
            ];
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $data += [
                    'file_path' => $file->store('jobsheet', 'public'),
                    'file_name' => $file->getClientOriginalName(),
                    'file_ext'  => strtolower($file->getClientOriginalExtension()),
                    'file_size' => $file->getSize(),
                ];
            } else {
                $data['url'] = $request->url;
            }
            \App\Models\Jobsheet::create($data);
            return back()->with('success', $request->hasFile('file') ? 'Jobsheet berhasil diunggah.' : 'Link jobsheet berhasil disimpan.');
        })->name('jobsheet.store');
        Route::delete('jobsheet/{item}', function (\App\Models\Jobsheet $item) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($item->file_path);
            $item->delete();
            return back()->with('success', 'Jobsheet berhasil dihapus.');
        })->name('jobsheet.destroy');

        // Legacy redirects
        Route::get('video-edukasi', fn () => redirect('/guru/video-pembelajaran'))->name('video.index');
        Route::get('modul-digital', fn () => redirect('/guru/modul-ajar'))->name('modul.index');

        // Kuis & Asesmen (simpel: judul + tautan + kelas)
        Route::get('kuis-asesmen', [KuisAsesmenController::class, 'index'])->name('kuis-asesmen.index');
        Route::post('kuis-asesmen', [KuisAsesmenController::class, 'store'])->name('kuis-asesmen.store');
        Route::delete('kuis-asesmen/{kuisAsesmen}', [KuisAsesmenController::class, 'destroy'])->name('kuis-asesmen.destroy');

        // Legacy redirects untuk URL lama
        Route::get('kuis', fn () => redirect('/guru/kuis-asesmen'))->name('kuis.index');
        Route::get('assessment', fn () => redirect('/guru/kuis-asesmen'))->name('assessment.index');

        // Pengumpulan (guru upload)
        Route::get('pengumpulan',                               [GuruPengumpulanController::class, 'index'])->name('pengumpulan.index');
        Route::post('pengumpulan/{item}/upload',                [GuruPengumpulanController::class, 'upload'])->name('pengumpulan.upload');
        Route::delete('pengumpulan/{item}/file',                [GuruPengumpulanController::class, 'deleteFile'])->name('pengumpulan.file.delete');

        // Laporan KPI (baca sendiri untuk guru)
        Route::get('kpi', [\App\Http\Controllers\Admin\KpiController::class, 'guruIndex'])->name('kpi.index');

        // Catatan dari Kepala Sekolah (read-only untuk guru)
        Route::get('catatan-kepsek', function () {
            $guruId = auth()->user()->guru?->id;
            if (!$guruId) {
                return Inertia::render('Guru/CatatanKepsek/Index', ['catatan' => ['data' => []]]);
            }
            \App\Models\CatatanKepsek::where('guru_id', $guruId)
                ->where('status', 'Terkirim')
                ->update(['status' => 'Dibaca', 'dibaca_pada' => now()]);

            $catatan = \App\Models\CatatanKepsek::with('kepsek')
                ->where('guru_id', $guruId)
                ->latest()
                ->paginate(20);

            return Inertia::render('Guru/CatatanKepsek/Index', ['catatan' => $catatan]);
        })->name('catatan-kepsek.index');
    });

    // Pimpinan area (Kepala Sekolah, Wakasek, Kepala TU)
    Route::prefix('pimpinan')->name('pimpinan.')->middleware('role:kepala_sekolah|wakasek_kurikulum|wakasek_kesiswaan|wakasek_sarpras|wakasek_humas|kepala_tatausaha|bendahara_sekolah|tim_penjamin_mutu|kepala_konsentrasi_keahlian|super_admin')->group(function () {
        Route::get('kpi', [KpiManajemenController::class, 'pimpinanIndex'])->name('kpi.index');
        Route::get('jurnal',            [PimpinanJurnalController::class, 'index'])->name('jurnal.index');
        Route::post('jurnal',           [PimpinanJurnalController::class, 'store'])->name('jurnal.store');
        Route::put('jurnal/{jurnal}',   [PimpinanJurnalController::class, 'update'])->name('jurnal.update');
        Route::delete('jurnal/{jurnal}',[PimpinanJurnalController::class, 'destroy'])->name('jurnal.destroy');
        Route::get('jurnal/print',      [PimpinanJurnalController::class, 'print'])->name('jurnal.print');
        Route::get('jurnal/riwayat',    [PimpinanJurnalController::class, 'riwayat'])->name('jurnal.riwayat');
        Route::get('jurnal/bawahan',    [PimpinanJurnalBawahanController::class, 'index'])
            ->name('jurnal.bawahan')
            ->middleware('role:wakasek_kurikulum|wakasek_kesiswaan|kepala_tatausaha|super_admin');
    });

    // Pokja area
    Route::prefix('pokja')->name('pokja.')->middleware('role:pokja_kurikulum|pokja_kesiswaan|pokja_sarpras|pokja_humas|bimbingan_konseling|super_admin')->group(function () {
        Route::get('jurnal', [PokjaJurnalController::class, 'index'])->name('jurnal.index');
        Route::post('jurnal', [PokjaJurnalController::class, 'store'])->name('jurnal.store');
        Route::put('jurnal/{jurnal}', [PokjaJurnalController::class, 'update'])->name('jurnal.update');
        Route::delete('jurnal/{jurnal}', [PokjaJurnalController::class, 'destroy'])->name('jurnal.destroy');
        Route::get('jurnal/print',   [PokjaJurnalController::class, 'print'])->name('jurnal.print');
        Route::get('jurnal/riwayat', [PokjaJurnalController::class, 'riwayat'])->name('jurnal.riwayat');
    });

    // Tata Usaha area
    Route::prefix('tatausaha')->name('tatausaha.')->middleware('role:tatausaha|kepala_tatausaha|super_admin|kepala_sekolah')->group(function () {
        // Jurnal Karyawan
        Route::get('jurnal', [TUJurnalController::class, 'index'])->name('jurnal.index');
        Route::post('jurnal', [TUJurnalController::class, 'store'])->name('jurnal.store');
        Route::put('jurnal/{jurnal}', [TUJurnalController::class, 'update'])->name('jurnal.update');
        Route::delete('jurnal/{jurnal}', [TUJurnalController::class, 'destroy'])->name('jurnal.destroy');
        Route::get('jurnal/print',   [TUJurnalController::class, 'print'])->name('jurnal.print');
        Route::get('jurnal/riwayat', [TUJurnalController::class, 'riwayat'])->name('jurnal.riwayat');

        // Buat Surat (Generator)
        Route::get('buat-surat',           [\App\Http\Controllers\TataUsaha\BuatSuratController::class, 'index'])->name('buat-surat.index');
        Route::post('buat-surat/simpan',   [\App\Http\Controllers\TataUsaha\BuatSuratController::class, 'simpan'])->name('buat-surat.simpan');

        // Surat Masuk
        Route::get('surat-masuk',                   [\App\Http\Controllers\TataUsaha\SuratMasukController::class, 'index'])->name('surat-masuk.index');
        Route::post('surat-masuk',                  [\App\Http\Controllers\TataUsaha\SuratMasukController::class, 'store'])->name('surat-masuk.store');
        Route::put('surat-masuk/{suratMasuk}',       [\App\Http\Controllers\TataUsaha\SuratMasukController::class, 'update'])->name('surat-masuk.update');
        Route::delete('surat-masuk/{suratMasuk}',    [\App\Http\Controllers\TataUsaha\SuratMasukController::class, 'destroy'])->name('surat-masuk.destroy');
        Route::post('surat-masuk/{suratMasuk}/qr',   [\App\Http\Controllers\TataUsaha\SuratMasukController::class, 'generateQr'])->name('surat-masuk.generate-qr');

        // Surat Keluar
        Route::get('surat-keluar',                        [\App\Http\Controllers\TataUsaha\SuratKeluarController::class, 'index'])->name('surat-keluar.index');
        Route::post('surat-keluar',                       [\App\Http\Controllers\TataUsaha\SuratKeluarController::class, 'store'])->name('surat-keluar.store');
        Route::put('surat-keluar/{suratKeluar}',          [\App\Http\Controllers\TataUsaha\SuratKeluarController::class, 'update'])->name('surat-keluar.update');
        Route::delete('surat-keluar/{suratKeluar}',       [\App\Http\Controllers\TataUsaha\SuratKeluarController::class, 'destroy'])->name('surat-keluar.destroy');

        // TTE Surat Keluar
        Route::get('tte',                                 [TteController::class, 'index'])->name('tte.index');
        Route::post('surat-keluar/{suratKeluar}/tte',     [TteController::class, 'tandatangani'])->name('surat-keluar.tte');
        Route::delete('surat-keluar/{suratKeluar}/tte',   [TteController::class, 'batalTte'])->name('surat-keluar.tte.batal');

        // Catatan dari Kepala Sekolah (read-only)
        Route::get('catatan-kepsek', function () {
            $tuId = auth()->user()->tatausaha?->id;
            if (!$tuId) {
                return Inertia::render('TataUsaha/CatatanKepsek/Index', ['catatan' => ['data' => []]]);
            }
            \App\Models\CatatanKepsek::where('tatausaha_id', $tuId)
                ->where('status', 'Terkirim')
                ->update(['status' => 'Dibaca', 'dibaca_pada' => now()]);

            $catatan = \App\Models\CatatanKepsek::with('kepsek')
                ->where('tatausaha_id', $tuId)
                ->latest()
                ->paginate(20);

            return Inertia::render('TataUsaha/CatatanKepsek/Index', ['catatan' => $catatan]);
        })->name('catatan-kepsek.index');

        // Laporan KPI (baca sendiri untuk TU)
        Route::get('kpi', [KpiTatausahaController::class, 'tuIndex'])->name('kpi.index');
    });
});

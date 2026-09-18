<?php

use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\KehadiranGuruController;
use App\Http\Controllers\Api\KehadiranGuruJpController;
use App\Http\Controllers\Api\KehadiranGuruRekapController;
use App\Http\Controllers\Api\KehadiranTatausahaController;
use App\Http\Controllers\Api\KehadiranTatausahaRekapController;
use App\Http\Controllers\Api\TatausahaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// API publik untuk aplikasi eksternal (autentikasi via token Sanctum, dibuat lewat menu
// Admin > API Eksternal). Query params dinamis: is_aktif, search, jabatan, tanggal,
// tanggal_awal, tanggal_akhir, guru_id/tatausaha_id, status, per_page.
Route::middleware(['auth:sanctum', 'abilities:api:read'])->prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/guru', [GuruController::class, 'index'])->name('guru.index');
    Route::get('/tatausaha', [TatausahaController::class, 'index'])->name('tatausaha.index');
    Route::get('/kehadiran-guru', [KehadiranGuruController::class, 'index'])->name('kehadiran-guru.index');
    Route::get('/kehadiran-guru-jp', [KehadiranGuruJpController::class, 'index'])->name('kehadiran-guru-jp.index');
    Route::get('/kehadiran-guru-rekap', [KehadiranGuruRekapController::class, 'index'])->name('kehadiran-guru-rekap.index');
    Route::get('/kehadiran-tatausaha', [KehadiranTatausahaController::class, 'index'])->name('kehadiran-tatausaha.index');
    Route::get('/kehadiran-tatausaha-rekap', [KehadiranTatausahaRekapController::class, 'index'])->name('kehadiran-tatausaha-rekap.index');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::get('/rombel/{rombel}/siswa', function (\App\Models\Rombel $rombel) {
        return $rombel->siswa()->with('user')->where('status_siswa', 'Aktif')->get();
    });

    Route::get('/pembelajaran/{pembelajaran}/absensi', function (\App\Models\Pembelajaran $pembelajaran, Request $request) {
        return \App\Models\Absensi::where('pembelajaran_id', $pembelajaran->id)
            ->where('tanggal', $request->tanggal ?? now()->toDateString())
            ->get();
    });

    Route::get('/guru', function () {
        return \App\Models\Guru::with('user')->where('is_aktif', true)->get();
    });

    Route::get('/mata-pelajaran', function () {
        return \App\Models\MataPelajaran::where('is_aktif', true)->get();
    });
});

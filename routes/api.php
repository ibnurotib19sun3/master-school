<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

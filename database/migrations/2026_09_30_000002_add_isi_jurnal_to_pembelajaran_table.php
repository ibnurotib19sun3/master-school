<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pembelajaran', function (Blueprint $table) {
            // Menentukan apakah pembelajaran ini muncul di daftar "isi jurnal mengajar"
            // guru. Default true supaya semua mapel yang sudah ada tidak berubah
            // perilakunya — khusus Jam Literasi, default diset false lewat toggle
            // di halaman Jam Literasi (lihat kolom pengaturan_sekolah.literasi_isi_jurnal).
            $table->boolean('isi_jurnal')->default(true)->after('is_aktif');
        });
    }

    public function down(): void
    {
        Schema::table('pembelajaran', function (Blueprint $table) {
            $table->dropColumn('isi_jurnal');
        });
    }
};

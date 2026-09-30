<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            // Toggle global (dari halaman Jam Literasi): apakah Jam Literasi ikut
            // mengisi jurnal mengajar guru atau tidak. Default tidak (false).
            $table->boolean('literasi_isi_jurnal')->default(false)->after('hari_aktif');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->dropColumn('literasi_isi_jurnal');
        });
    }
};

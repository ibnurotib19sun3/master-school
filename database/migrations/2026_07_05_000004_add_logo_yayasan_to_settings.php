<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah logo & yayasan ke pengaturan_sekolah
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('nip_kepala');
            $table->string('yayasan_dinas')->nullable()->after('logo_path');
        });

        // Tambah yayasan override & perlebar prefix_kode di pengaturan_surat
        Schema::table('pengaturan_surat', function (Blueprint $table) {
            $table->string('yayasan_dinas')->nullable()->after('npsn_kop');
            $table->string('prefix_kode', 100)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'yayasan_dinas']);
        });
        Schema::table('pengaturan_surat', function (Blueprint $table) {
            $table->dropColumn('yayasan_dinas');
            $table->string('prefix_kode', 20)->nullable()->change();
        });
    }
};

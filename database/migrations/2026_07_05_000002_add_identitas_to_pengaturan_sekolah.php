<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->string('nama_sekolah')->default('SMK')->after('id');
            $table->string('npsn')->nullable()->after('nama_sekolah');
            $table->text('alamat')->nullable()->after('npsn');
            $table->string('kecamatan')->nullable()->after('alamat');
            $table->string('kota')->nullable()->after('kecamatan');
            $table->string('telepon')->nullable()->after('kota');
            $table->string('email_sekolah')->nullable()->after('telepon');
            $table->string('website')->nullable()->after('email_sekolah');
            $table->string('kepala_sekolah_nama')->nullable()->after('website');
            $table->string('nip_kepala')->nullable()->after('kepala_sekolah_nama');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->dropColumn([
                'nama_sekolah', 'npsn', 'alamat', 'kecamatan', 'kota',
                'telepon', 'email_sekolah', 'website', 'kepala_sekolah_nama', 'nip_kepala',
            ]);
        });
    }
};

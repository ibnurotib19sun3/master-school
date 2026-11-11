<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pengaturan_surat') && !Schema::hasColumn('pengaturan_surat', 'nomor_awal_surat')) {
            Schema::table('pengaturan_surat', function (Blueprint $table) {
                $table->unsignedInteger('nomor_awal_surat')->default(1)->after('prefix_kode');
            });
        }

        if (Schema::hasTable('surat_keluar') && !Schema::hasColumn('surat_keluar', 'file_tte')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->string('file_tte', 255)->nullable()->after('file_surat');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pengaturan_surat') && Schema::hasColumn('pengaturan_surat', 'nomor_awal_surat')) {
            Schema::table('pengaturan_surat', function (Blueprint $table) {
                $table->dropColumn('nomor_awal_surat');
            });
        }

        if (Schema::hasTable('surat_keluar') && Schema::hasColumn('surat_keluar', 'file_tte')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->dropColumn('file_tte');
            });
        }
    }
};

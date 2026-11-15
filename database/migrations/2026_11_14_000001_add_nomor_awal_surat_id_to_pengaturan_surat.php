<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pengaturan_surat') && !Schema::hasColumn('pengaturan_surat', 'nomor_awal_surat_id')) {
            Schema::table('pengaturan_surat', function (Blueprint $table) {
                $table->unsignedBigInteger('nomor_awal_surat_id')->nullable()->after('nomor_awal_surat');
            });

            // Set ID awal surat keluar saat ini agar input manual sebelumnya tidak dihitung sebagai offset
            $maxId = DB::table('surat_keluar')->max('id') ?? 0;
            DB::table('pengaturan_surat')->whereNull('nomor_awal_surat_id')->update(['nomor_awal_surat_id' => $maxId]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pengaturan_surat') && Schema::hasColumn('pengaturan_surat', 'nomor_awal_surat_id')) {
            Schema::table('pengaturan_surat', function (Blueprint $table) {
                $table->dropColumn('nomor_awal_surat_id');
            });
        }
    }
};

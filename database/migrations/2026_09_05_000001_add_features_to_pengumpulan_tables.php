<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengumpulan', function (Blueprint $table) {
            // Format file yang diizinkan (null = semua format)
            $table->json('format_file')->nullable()->after('batas_waktu');
            // Apakah boleh upload setelah batas waktu
            $table->boolean('allow_late_upload')->default(true)->after('format_file');
        });

        Schema::table('pengumpulan_item', function (Blueprint $table) {
            // null = ikut pengumpulan.allow_late_upload, 1 = paksa buka, 0 = paksa tutup
            $table->tinyInteger('portal_override')->nullable()->after('keterangan');
        });
    }

    public function down(): void
    {
        Schema::table('pengumpulan', function (Blueprint $table) {
            $table->dropColumn(['format_file', 'allow_late_upload']);
        });
        Schema::table('pengumpulan_item', function (Blueprint $table) {
            $table->dropColumn('portal_override');
        });
    }
};

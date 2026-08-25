<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Absensi sekarang per-JP (jadwal_id), data lama tidak relevan
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('absensi')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // jadwal_id column + FK (mungkin sudah ada dari partial run sebelumnya)
        if (!Schema::hasColumn('absensi', 'jadwal_id')) {
            Schema::table('absensi', function (Blueprint $table) {
                $table->foreignId('jadwal_id')
                    ->after('pembelajaran_id')
                    ->constrained('jadwal')
                    ->cascadeOnDelete();
            });
        }

        // Gunakan raw SQL dengan try-catch agar idempoten
        // FK harus di-drop sebelum index yang menyokongnya
        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_pembelajaran_id_siswa_id_tanggal_unique'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP FOREIGN KEY absensi_pembelajaran_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_pembelajaran_id_tanggal_index'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi ADD UNIQUE KEY absensi_jadwal_siswa_tanggal_unique (jadwal_id, siswa_id, tanggal)'); } catch (\Exception $e) {}
        try { DB::statement('CREATE INDEX absensi_jadwal_id_tanggal_index ON absensi (jadwal_id, tanggal)'); } catch (\Exception $e) {}
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            $table->dropUnique('absensi_jadwal_siswa_tanggal_unique');
            $table->dropIndex(['jadwal_id', 'tanggal']);
            $table->dropForeign(['jadwal_id']);
            $table->dropColumn('jadwal_id');
            $table->unique(['pembelajaran_id', 'siswa_id', 'tanggal']);
            $table->index(['pembelajaran_id', 'tanggal']);
        });
    }
};

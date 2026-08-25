<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Data lama (per jadwal_id) tidak relevan setelah perubahan ini
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('absensi')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Drop constraints lama
        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_jadwal_siswa_tanggal_unique'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_jadwal_id_tanggal_index'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP FOREIGN KEY absensi_jadwal_id_foreign'); } catch (\Exception $e) {}

        if (Schema::hasColumn('absensi', 'jadwal_id')) {
            Schema::table('absensi', function (Blueprint $table) {
                $table->dropColumn('jadwal_id');
            });
        }

        if (!Schema::hasColumn('absensi', 'jurnal_id')) {
            Schema::table('absensi', function (Blueprint $table) {
                $table->foreignId('jurnal_id')
                    ->nullable()
                    ->after('pembelajaran_id')
                    ->constrained('jurnal_mengajar')
                    ->cascadeOnDelete();
            });
        }

        try { DB::statement('ALTER TABLE absensi ADD UNIQUE KEY absensi_jurnal_siswa_unique (jurnal_id, siswa_id)'); } catch (\Exception $e) {}
        try { DB::statement('CREATE INDEX absensi_jurnal_id_index ON absensi (jurnal_id)'); } catch (\Exception $e) {}
    }

    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('absensi')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_jurnal_siswa_unique'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP INDEX absensi_jurnal_id_index'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE absensi DROP FOREIGN KEY absensi_jurnal_id_foreign'); } catch (\Exception $e) {}

        if (Schema::hasColumn('absensi', 'jurnal_id')) {
            Schema::table('absensi', function (Blueprint $table) {
                $table->dropColumn('jurnal_id');
            });
        }

        if (!Schema::hasColumn('absensi', 'jadwal_id')) {
            Schema::table('absensi', function (Blueprint $table) {
                $table->foreignId('jadwal_id')
                    ->nullable()
                    ->after('pembelajaran_id')
                    ->constrained('jadwal')
                    ->cascadeOnDelete();
            });
        }

        try { DB::statement('ALTER TABLE absensi ADD UNIQUE KEY absensi_jadwal_siswa_tanggal_unique (jadwal_id, siswa_id, tanggal)'); } catch (\Exception $e) {}
        try { DB::statement('CREATE INDEX absensi_jadwal_id_tanggal_index ON absensi (jadwal_id, tanggal)'); } catch (\Exception $e) {}
    }
};

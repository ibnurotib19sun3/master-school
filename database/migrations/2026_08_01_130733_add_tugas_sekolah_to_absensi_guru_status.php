<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE absensi_guru MODIFY COLUMN status ENUM('Hadir','Sakit','Izin','Alpha','Tugas_Sekolah') NOT NULL DEFAULT 'Hadir'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE absensi_guru MODIFY COLUMN status ENUM('Hadir','Sakit','Izin','Alpha') NOT NULL DEFAULT 'Hadir'");
    }
};

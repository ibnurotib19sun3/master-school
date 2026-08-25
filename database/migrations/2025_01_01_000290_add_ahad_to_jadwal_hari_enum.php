<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE jadwal MODIFY COLUMN hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE jadwal MODIFY COLUMN hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL");
    }
};

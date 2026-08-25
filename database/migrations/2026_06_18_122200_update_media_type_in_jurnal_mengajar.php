<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change enum to varchar to support new media types
        DB::statement("ALTER TABLE jurnal_mengajar MODIFY COLUMN media_type VARCHAR(30) NULL DEFAULT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE jurnal_mengajar MODIFY COLUMN media_type ENUM('Presentasi','Dokumen','Video','Papan Tulis','Link','Lainnya') NULL DEFAULT NULL");
    }
};

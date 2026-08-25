<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE presentasi MODIFY COLUMN platform ENUM('Canva','PowerPoint','Sway','Google Slides','Lainnya','Upload') NOT NULL DEFAULT 'Canva'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE presentasi MODIFY COLUMN platform ENUM('Canva','PowerPoint','Sway','Google Slides','Lainnya') NOT NULL DEFAULT 'Canva'");
    }
};

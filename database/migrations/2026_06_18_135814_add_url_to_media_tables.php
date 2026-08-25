<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['presentasi', 'modul_digital', 'jobsheet'] as $tbl) {
            Schema::table($tbl, function (Blueprint $table) {
                $table->string('url', 500)->nullable()->after('file_path');
            });
        }
    }

    public function down(): void
    {
        foreach (['presentasi', 'modul_digital', 'jobsheet'] as $tbl) {
            Schema::table($tbl, function (Blueprint $table) {
                $table->dropColumn('url');
            });
        }
    }
};

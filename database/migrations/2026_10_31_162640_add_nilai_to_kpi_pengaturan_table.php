<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kpi_pengaturan', function (Blueprint $table) {
            $table->longText('nilai')->nullable()->after('bobot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kpi_pengaturan', function (Blueprint $table) {
            $table->dropColumn('nilai');
        });
    }
};

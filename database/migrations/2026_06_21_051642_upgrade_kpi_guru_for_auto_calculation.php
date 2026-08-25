<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kpi_guru', function (Blueprint $table) {
            $table->string('bulan', 7)->nullable()->after('tahun_ajaran_id');
            $table->decimal('persen', 5, 2)->default(0)->after('nilai');
            $table->decimal('bobot_snapshot', 5, 2)->default(0)->after('persen');
        });

        Schema::table('kpi_guru', function (Blueprint $table) {
            $table->dropUnique(['guru_id', 'tahun_ajaran_id', 'kpi_indikator_id']);
            $table->unique(['guru_id', 'bulan', 'kpi_indikator_id'], 'kpi_guru_bulan_unique');
        });
    }

    public function down(): void
    {
        Schema::table('kpi_guru', function (Blueprint $table) {
            $table->dropUnique('kpi_guru_bulan_unique');
            $table->dropColumn(['bulan', 'persen', 'bobot_snapshot']);
            $table->unique(['guru_id', 'tahun_ajaran_id', 'kpi_indikator_id']);
        });
    }
};

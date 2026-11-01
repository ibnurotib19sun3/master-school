<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kpi_guru') && !Schema::hasColumn('kpi_guru', 'dibaca_pada')) {
            Schema::table('kpi_guru', function (Blueprint $table) {
                $table->timestamp('dibaca_pada')->nullable()->after('catatan');
            });
        }

        if (Schema::hasTable('kpi_tatausaha') && !Schema::hasColumn('kpi_tatausaha', 'dibaca_pada')) {
            Schema::table('kpi_tatausaha', function (Blueprint $table) {
                $table->timestamp('dibaca_pada')->nullable()->after('catatan');
            });
        }

        if (Schema::hasTable('kpi_manajemen') && !Schema::hasColumn('kpi_manajemen', 'dibaca_pada')) {
            Schema::table('kpi_manajemen', function (Blueprint $table) {
                $table->timestamp('dibaca_pada')->nullable()->after('catatan');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('kpi_guru') && Schema::hasColumn('kpi_guru', 'dibaca_pada')) {
            Schema::table('kpi_guru', function (Blueprint $table) {
                $table->dropColumn('dibaca_pada');
            });
        }

        if (Schema::hasTable('kpi_tatausaha') && Schema::hasColumn('kpi_tatausaha', 'dibaca_pada')) {
            Schema::table('kpi_tatausaha', function (Blueprint $table) {
                $table->dropColumn('dibaca_pada');
            });
        }

        if (Schema::hasTable('kpi_manajemen') && Schema::hasColumn('kpi_manajemen', 'dibaca_pada')) {
            Schema::table('kpi_manajemen', function (Blueprint $table) {
                $table->dropColumn('dibaca_pada');
            });
        }
    }
};

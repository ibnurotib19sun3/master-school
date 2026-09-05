<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kpi_pengaturan', function (Blueprint $table) {
            $table->string('kode', 40)->primary();
            $table->decimal('bobot', 5, 2)->default(50);
        });

        // Seed default values
        DB::table('kpi_pengaturan')->insert([
            ['kode' => 'BIASA_GURU',       'bobot' => 50],
            ['kode' => 'BIASA_JURNAL',      'bobot' => 50],
            ['kode' => 'MGT_GURU',          'bobot' => 40],
            ['kode' => 'MGT_JURNAL',        'bobot' => 30],
            ['kode' => 'MGT_MANAJEMEN',     'bobot' => 30],
            ['kode' => 'TU_KEAKTIFAN',      'bobot' => 50],
            ['kode' => 'TU_JURNAL',         'bobot' => 50],
        ]);

        // Tambah kolom type di kpi_guru agar bisa filter rekap per tab
        Schema::table('kpi_guru', function (Blueprint $table) {
            $table->enum('tipe_guru', ['biasa', 'manajemen'])->default('biasa')->after('guru_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_pengaturan');
        Schema::table('kpi_guru', function (Blueprint $table) {
            $table->dropColumn('tipe_guru');
        });
    }
};

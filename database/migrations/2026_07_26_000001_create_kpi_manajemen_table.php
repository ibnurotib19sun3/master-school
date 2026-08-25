<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_manajemen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->onDelete('cascade');
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran');
            $table->foreignId('kpi_indikator_id')->constrained('kpi_indikator');
            $table->string('bulan', 7); // Y-m
            $table->decimal('persen', 5, 2);
            $table->decimal('bobot_snapshot', 5, 2);
            $table->decimal('nilai', 5, 2);
            $table->text('catatan')->nullable();
            $table->foreignId('dinilai_oleh')->nullable()->constrained('users');
            $table->timestamps();
            $table->unique(['guru_id', 'kpi_indikator_id', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_manajemen');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_indikator', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->enum('kategori', ['Kedisiplinan', 'Pengajaran', 'Administrasi', 'Pengembangan', 'Karakter'])->default('Pengajaran');
            $table->decimal('bobot', 5, 2)->default(1.00);
            $table->decimal('target', 5, 2)->default(100);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('kpi_guru', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->foreignId('kpi_indikator_id')->constrained('kpi_indikator')->cascadeOnDelete();
            $table->decimal('nilai', 5, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->foreignId('dinilai_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['guru_id', 'tahun_ajaran_id', 'kpi_indikator_id']);
            $table->index(['guru_id', 'tahun_ajaran_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_guru');
        Schema::dropIfExists('kpi_indikator');
    }
};

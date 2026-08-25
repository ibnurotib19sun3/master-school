<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelajaran_id')->constrained('pembelajaran')->cascadeOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->text('instruksi')->nullable();
            $table->datetime('batas_waktu')->nullable();
            $table->decimal('nilai_maksimal', 5, 2)->default(100);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('pengumpulan_tugas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('assessment')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->text('jawaban')->nullable();
            $table->string('file_path')->nullable();
            $table->string('url_jawaban')->nullable();
            $table->enum('status', ['Belum', 'Terlambat', 'Dikumpulkan', 'Dinilai'])->default('Belum');
            $table->decimal('nilai', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->datetime('dikumpulkan_pada')->nullable();
            $table->timestamps();

            $table->unique(['assessment_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumpulan_tugas');
        Schema::dropIfExists('assessment');
    }
};

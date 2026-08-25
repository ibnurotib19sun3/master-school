<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kuis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelajaran_id')->nullable()->constrained('pembelajaran')->nullOnDelete();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->enum('tipe', ['Latihan', 'Ujian', 'Kompetisi'])->default('Latihan');
            $table->integer('durasi_menit')->default(60);
            $table->datetime('dibuka_pada')->nullable();
            $table->datetime('ditutup_pada')->nullable();
            $table->boolean('acak_soal')->default(false);
            $table->boolean('tampilkan_hasil')->default(true);
            $table->integer('max_percobaan')->default(1);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('soal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kuis_id')->constrained('kuis')->cascadeOnDelete();
            $table->integer('nomor')->default(1);
            $table->text('pertanyaan');
            $table->enum('tipe_soal', ['PG', 'Essay', 'Benar_Salah', 'Isian'])->default('PG');
            $table->decimal('bobot', 5, 2)->default(1.00);
            $table->string('media')->nullable(); // image path
            $table->timestamps();
        });

        Schema::create('jawaban_soal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')->constrained('soal')->cascadeOnDelete();
            $table->string('teks_jawaban');
            $table->boolean('is_benar')->default(false);
            $table->string('penjelasan')->nullable();
            $table->timestamps();
        });

        Schema::create('hasil_kuis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kuis_id')->constrained('kuis')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->integer('percobaan_ke')->default(1);
            $table->decimal('nilai', 5, 2)->default(0);
            $table->integer('durasi_detik')->nullable();
            $table->datetime('dimulai_pada')->nullable();
            $table->datetime('selesai_pada')->nullable();
            $table->json('jawaban_siswa')->nullable();
            $table->timestamps();

            $table->index(['kuis_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hasil_kuis');
        Schema::dropIfExists('jawaban_soal');
        Schema::dropIfExists('soal');
        Schema::dropIfExists('kuis');
    }
};

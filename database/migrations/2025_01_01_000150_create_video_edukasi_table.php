<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_edukasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('url_video'); // YouTube, Vimeo, or file path
            $table->enum('sumber', ['YouTube', 'Vimeo', 'Upload', 'Lainnya'])->default('YouTube');
            $table->string('thumbnail')->nullable();
            $table->integer('durasi')->nullable(); // in seconds
            $table->enum('jenjang', ['SD', 'SMP', 'SMA', 'SMK', 'Semua'])->default('Semua');
            $table->boolean('is_publik')->default(true);
            $table->integer('views')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['mata_pelajaran_id', 'guru_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_edukasi');
    }
};

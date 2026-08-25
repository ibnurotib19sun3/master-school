<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modul_digital', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->enum('tipe', ['Modul', 'EBook', 'Buku_Paket', 'MGMP', 'Lainnya'])->default('Modul');
            $table->string('file_path')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('url_external')->nullable();
            $table->enum('jenjang', ['SD', 'SMP', 'SMA', 'SMK', 'Semua'])->default('Semua');
            $table->boolean('is_publik')->default(true);
            $table->integer('download_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['mata_pelajaran_id', 'tipe']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modul_digital');
    }
};

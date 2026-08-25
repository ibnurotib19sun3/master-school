<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_penilaian', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // Ulangan Harian, PTS, PAS, PAT
            $table->decimal('bobot', 5, 2)->default(1.00);
            $table->text('deskripsi')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('teknik_penilaian', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // Tes Tulis, Tes Lisan, Praktik, Portofolio
            $table->text('deskripsi')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teknik_penilaian');
        Schema::dropIfExists('jenis_penilaian');
    }
};

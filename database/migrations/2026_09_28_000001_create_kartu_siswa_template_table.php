<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kartu_siswa_template', function (Blueprint $table) {
            $table->id();
            $table->string('nama');

            // Ukuran & orientasi kartu (nilai lebar/tinggi sudah final setelah
            // memperhitungkan orientasi — orientasi murni kenyamanan input di form).
            $table->decimal('lebar_mm', 6, 2)->default(54);
            $table->decimal('tinggi_mm', 6, 2)->default(85.6);
            $table->enum('orientasi', ['portrait', 'landscape'])->default('portrait');
            $table->string('background_path')->nullable();

            // Field data yang ditampilkan di kartu, mis. ["nama","nis","kelas","foto"]
            $table->json('fields')->nullable();

            // Pengaturan cetak: ukuran kertas + jarak antar kartu, semua dalam mm.
            $table->string('kertas', 20)->default('A4');
            $table->decimal('kertas_lebar_mm', 6, 2)->default(210);
            $table->decimal('kertas_tinggi_mm', 6, 2)->default(297);
            $table->decimal('margin_mm', 5, 2)->default(10);
            $table->decimal('jarak_x_mm', 5, 2)->default(5);
            $table->decimal('jarak_y_mm', 5, 2)->default(5);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kartu_siswa_template');
    }
};

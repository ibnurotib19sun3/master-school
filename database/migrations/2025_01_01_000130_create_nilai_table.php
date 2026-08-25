<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelajaran_id')->constrained('pembelajaran')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('jenis_penilaian_id')->constrained('jenis_penilaian');
            $table->foreignId('teknik_penilaian_id')->nullable()->constrained('teknik_penilaian')->nullOnDelete();
            $table->string('nama_penilaian'); // UH 1, UH 2, PTS, etc
            $table->date('tanggal');
            $table->decimal('nilai', 5, 2)->default(0);
            $table->decimal('nilai_maksimal', 5, 2)->default(100);
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['pembelajaran_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai');
    }
};

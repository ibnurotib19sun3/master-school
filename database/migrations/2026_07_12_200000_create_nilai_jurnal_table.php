<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai_jurnal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jurnal_mengajar_id')->constrained('jurnal_mengajar')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('capaian_pembelajaran_id')->constrained('capaian_pembelajaran')->cascadeOnDelete();
            $table->decimal('nilai', 5, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['jurnal_mengajar_id', 'siswa_id', 'capaian_pembelajaran_id'], 'nilai_jurnal_unique');
            $table->index('siswa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai_jurnal');
    }
};

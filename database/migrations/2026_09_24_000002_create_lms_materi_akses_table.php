<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_materi_akses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lms_materi_id')->constrained('lms_materi')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->timestamp('dilihat_at')->nullable();
            $table->timestamp('diunduh_at')->nullable();
            $table->timestamps();

            $table->unique(['lms_materi_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_materi_akses');
    }
};

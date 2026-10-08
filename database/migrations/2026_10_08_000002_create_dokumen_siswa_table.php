<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumen_siswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('dokumen_jenis_id')->constrained('dokumen_jenis')->cascadeOnDelete();
            $table->string('file_path');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Satu file per jenis dokumen per siswa — upload ulang mengganti yang lama.
            $table->unique(['siswa_id', 'dokumen_jenis_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_siswa');
    }
};

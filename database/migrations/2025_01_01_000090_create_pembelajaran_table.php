<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembelajaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->foreignId('rombel_id')->constrained('rombel')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran');
            $table->foreignId('guru_id')->constrained('guru');
            $table->integer('jam_per_minggu')->default(2);
            $table->string('hari')->nullable(); // Senin, Selasa, etc (bisa JSON)
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();

            $table->unique(['tahun_ajaran_id', 'rombel_id', 'mata_pelajaran_id']);
            $table->index(['rombel_id', 'guru_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembelajaran');
    }
};

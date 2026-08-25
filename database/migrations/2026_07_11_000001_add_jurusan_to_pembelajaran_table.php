<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pembelajaran', function (Blueprint $table) {
            // FK pada tahun_ajaran_id bergantung ke unique composite index.
            // Buat plain index dulu agar FK tetap punya index setelah unique di-drop.
            $table->index('tahun_ajaran_id', 'pembelajaran_tahun_ajaran_id_index');

            // Drop unique constraint yang tidak bisa menangani split-class
            $table->dropUnique(['tahun_ajaran_id', 'rombel_id', 'mata_pelajaran_id']);

            // Kelompok jurusan (null = gabungan/semua siswa)
            $table->foreignId('jurusan_id')
                ->nullable()
                ->after('mata_pelajaran_id')
                ->constrained('jurusan')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pembelajaran', function (Blueprint $table) {
            $table->dropConstrainedForeignId('jurusan_id');
            $table->unique(['tahun_ajaran_id', 'rombel_id', 'mata_pelajaran_id']);
            $table->dropIndex('pembelajaran_tahun_ajaran_id_index');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('orang_tua_id')->nullable()->constrained('orang_tua')->nullOnDelete();
            $table->string('nis', 20)->unique();
            $table->string('nisn', 20)->unique()->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->enum('agama', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'])->nullable();
            $table->enum('status_siswa', ['Aktif', 'Mutasi', 'Lulus', 'DO'])->default('Aktif');
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran')->nullOnDelete();
            $table->foreignId('rombel_id')->nullable()->constrained('rombel')->nullOnDelete();
            $table->date('tanggal_masuk')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['nis', 'nisn']);
            $table->index('rombel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('siswa');
    }
};

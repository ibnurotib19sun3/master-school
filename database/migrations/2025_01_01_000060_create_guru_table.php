<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guru', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nip', 30)->unique()->nullable();
            $table->string('nuptk', 20)->unique()->nullable();
            $table->string('gelar_depan', 50)->nullable();
            $table->string('gelar_belakang', 50)->nullable();
            $table->enum('status_kepegawaian', ['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer'])->default('GTY');
            $table->string('pendidikan_terakhir', 10)->nullable(); // S1, S2, S3
            $table->string('bidang_studi')->nullable();
            $table->date('tanggal_masuk')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru');
    }
};

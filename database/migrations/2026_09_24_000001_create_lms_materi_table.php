<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_materi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelajaran_id')->constrained('pembelajaran')->cascadeOnDelete();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->unsignedInteger('pertemuan_ke')->nullable();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_ext', 20)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('url')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['pembelajaran_id', 'pertemuan_ke']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_materi');
    }
};

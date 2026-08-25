<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presentasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->enum('platform', ['Canva', 'PowerPoint', 'Sway', 'Google Slides', 'Lainnya'])->default('Canva');
            $table->string('url_embed')->nullable(); // embed URL
            $table->string('file_path')->nullable();
            $table->boolean('is_publik')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presentasi');
    }
};

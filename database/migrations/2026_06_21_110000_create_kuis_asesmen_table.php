<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kuis_asesmen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->enum('jenis', ['Kuis', 'Asesmen']);
            $table->string('judul');
            $table->string('tautan', 500);
            $table->foreignId('rombel_id')->nullable()->constrained('rombel')->nullOnDelete();
            $table->timestamps();

            $table->index(['guru_id', 'rombel_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kuis_asesmen');
    }
};

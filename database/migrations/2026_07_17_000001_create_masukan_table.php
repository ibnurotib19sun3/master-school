<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('masukan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('kategori', 50);   // Saran | Bug/Error | Pertanyaan | Lainnya
            $table->string('judul', 200);
            $table->text('isi');
            $table->string('status', 30)->default('Baru'); // Baru | Dibaca | Ditindaklanjuti
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('masukan');
    }
};

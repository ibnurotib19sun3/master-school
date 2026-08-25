<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturan_sekolah', function (Blueprint $table) {
            $table->id();
            $table->time('jam_mulai_sekolah')->default('07:00');
            $table->unsignedTinyInteger('durasi_jp')->default(45);   // menit per jam pelajaran
            $table->unsignedTinyInteger('jumlah_jp')->default(10);   // jumlah JP dalam satu hari
            $table->json('istirahat')->nullable();                   // [{setelah_jp:3,durasi_menit:15},...]
            $table->json('hari_aktif')->nullable();                  // ["Senin","Selasa",...]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturan_sekolah');
    }
};

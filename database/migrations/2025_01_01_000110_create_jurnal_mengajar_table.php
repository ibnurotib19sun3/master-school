<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jurnal_mengajar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelajaran_id')->constrained('pembelajaran')->cascadeOnDelete();
            $table->date('tanggal');
            $table->integer('pertemuan_ke');
            $table->string('materi_pokok');
            $table->text('uraian_materi');
            $table->text('tujuan_pembelajaran');
            $table->enum('metode', ['Ceramah', 'Diskusi', 'Praktik', 'Proyek', 'Kooperatif', 'Lainnya'])->default('Ceramah');
            $table->text('media_alat')->nullable();
            $table->text('catatan')->nullable();
            $table->integer('jumlah_hadir')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['pembelajaran_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurnal_mengajar');
    }
};

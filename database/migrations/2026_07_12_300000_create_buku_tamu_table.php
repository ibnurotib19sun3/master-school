<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buku_tamu', function (Blueprint $table) {
            $table->id();
            $table->string('nama_tamu');
            $table->string('instansi')->nullable();
            $table->string('nomor_hp')->nullable();
            $table->text('keperluan');
            $table->string('yang_dituju_tipe')->default('guru'); // guru|tatausaha|lainnya
            $table->unsignedBigInteger('yang_dituju_id')->nullable();
            $table->string('yang_dituju_nama');
            $table->string('yang_dituju_jabatan')->nullable();
            $table->date('tanggal');
            $table->time('jam_masuk');
            $table->time('jam_keluar')->nullable();
            $table->enum('status', ['menunggu', 'diterima', 'selesai', 'tidak_diterima'])->default('menunggu');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buku_tamu');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_masuk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dibuat_oleh')->constrained('users')->cascadeOnDelete();
            $table->string('nomor_surat');
            $table->string('perihal');
            $table->string('pengirim');
            $table->date('tgl_surat');
            $table->date('tgl_diterima');
            $table->string('kategori')->default('Umum');
            $table->enum('disposisi', ['Diarsip', 'Diproses', 'Diteruskan'])->default('Diarsip');
            $table->text('keterangan')->nullable();
            $table->string('file_surat')->nullable();
            $table->timestamps();
        });

        Schema::create('surat_keluar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dibuat_oleh')->constrained('users')->cascadeOnDelete();
            $table->string('nomor_surat');
            $table->string('perihal');
            $table->string('tujuan');
            $table->date('tgl_surat');
            $table->date('tgl_keluar');
            $table->string('kategori')->default('Umum');
            $table->enum('status', ['Draft', 'Terkirim'])->default('Terkirim');
            $table->text('keterangan')->nullable();
            $table->string('file_surat')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_keluar');
        Schema::dropIfExists('surat_masuk');
    }
};

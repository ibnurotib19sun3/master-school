<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumpulan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran')->nullOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->dateTime('batas_waktu');
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('pengumpulan_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengumpulan_id')->constrained('pengumpulan')->cascadeOnDelete();
            $table->foreignId('pembelajaran_id')->constrained('pembelajaran')->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->timestamp('tgl_upload')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->unique(['pengumpulan_id', 'pembelajaran_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumpulan_item');
        Schema::dropIfExists('pengumpulan');
    }
};

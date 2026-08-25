<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catatan_kepsek', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->foreignId('kepsek_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('jurnal_mengajar_id')->nullable()->constrained('jurnal_mengajar')->nullOnDelete();
            $table->enum('kategori', ['Evaluasi', 'Saran', 'Perbaikan', 'Apresiasi', 'Peringatan'])->default('Evaluasi');
            $table->string('judul');
            $table->text('catatan');
            $table->enum('status', ['Draft', 'Terkirim', 'Dibaca'])->default('Terkirim');
            $table->datetime('dibaca_pada')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['guru_id', 'kepsek_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catatan_kepsek');
    }
};

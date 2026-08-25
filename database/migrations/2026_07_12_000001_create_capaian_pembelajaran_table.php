<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capaian_pembelajaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->tinyInteger('tingkat');
            $table->tinyInteger('semester');
            $table->string('kode', 5);
            $table->text('capaian');
            $table->timestamps();

            $table->unique(['guru_id', 'mata_pelajaran_id', 'tingkat', 'semester', 'kode'], 'cp_guru_mapel_tingkat_smt_kode_unique');
        });

        Schema::create('jurnal_capaian', function (Blueprint $table) {
            $table->foreignId('jurnal_mengajar_id')->constrained('jurnal_mengajar')->cascadeOnDelete();
            $table->foreignId('capaian_pembelajaran_id')->constrained('capaian_pembelajaran')->cascadeOnDelete();
            $table->primary(['jurnal_mengajar_id', 'capaian_pembelajaran_id']);
        });

        // buat tujuan_pembelajaran nullable (data lama tetap ada)
        Schema::table('jurnal_mengajar', function (Blueprint $table) {
            $table->text('tujuan_pembelajaran')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('jurnal_mengajar', function (Blueprint $table) {
            $table->text('tujuan_pembelajaran')->nullable(false)->change();
        });
        Schema::dropIfExists('jurnal_capaian');
        Schema::dropIfExists('capaian_pembelajaran');
    }
};

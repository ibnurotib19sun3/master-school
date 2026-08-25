<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('absensi_tatausaha', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tatausaha_id')->constrained('tatausaha')->onDelete('cascade');
            $table->date('tanggal');
            $table->enum('status', ['Hadir', 'Sakit', 'Izin', 'Alpha'])->default('Hadir');
            $table->string('keterangan', 500)->nullable();
            $table->unsignedBigInteger('dicatat_oleh')->nullable();
            $table->timestamps();
            $table->unique(['tatausaha_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensi_tatausaha');
    }
};

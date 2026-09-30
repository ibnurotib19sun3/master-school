<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kartu_siswa_template', function (Blueprint $table) {
            $table->enum('bingkai_foto', ['kotak', 'lingkaran'])->default('kotak')->after('fields');
        });
    }

    public function down(): void
    {
        Schema::table('kartu_siswa_template', function (Blueprint $table) {
            $table->dropColumn('bingkai_foto');
        });
    }
};

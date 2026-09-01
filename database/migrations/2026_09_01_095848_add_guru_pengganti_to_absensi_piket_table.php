<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_piket', function (Blueprint $table) {
            $table->foreignId('guru_pengganti_id')
                ->nullable()
                ->after('dicatat_oleh')
                ->constrained('guru')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('absensi_piket', function (Blueprint $table) {
            $table->dropForeign(['guru_pengganti_id']);
            $table->dropColumn('guru_pengganti_id');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->string('kode_tte', 20)->nullable()->unique()->after('file_surat');
            $table->timestamp('tte_at')->nullable()->after('kode_tte');
            $table->foreignId('tte_oleh')->nullable()->constrained('users')->nullOnDelete()->after('tte_at');
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropForeign(['tte_oleh']);
            $table->dropColumn(['kode_tte', 'tte_at', 'tte_oleh']);
        });
    }
};

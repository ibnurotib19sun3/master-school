<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->boolean('is_maintenance')->default(false)->after('hari_aktif');
            $table->string('maintenance_message', 500)->nullable()->after('is_maintenance');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sekolah', function (Blueprint $table) {
            $table->dropColumn(['is_maintenance', 'maintenance_message']);
        });
    }
};

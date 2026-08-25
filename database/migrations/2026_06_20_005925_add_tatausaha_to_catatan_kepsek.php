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
        Schema::table('catatan_kepsek', function (Blueprint $table) {
            $table->foreignId('tatausaha_id')->nullable()->after('guru_id')->constrained('tatausaha')->nullOnDelete();
            // guru_id boleh null ketika catatan ditujukan ke tatausaha
            $table->unsignedBigInteger('guru_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('catatan_kepsek', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tatausaha_id');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jurnal_mengajar', function (Blueprint $table) {
            $table->enum('media_type', ['Presentasi','Dokumen','Video','Papan Tulis','Link','Lainnya'])->nullable()->after('media_alat');
            $table->unsignedBigInteger('media_ref_id')->nullable()->after('media_type');
            $table->string('media_url', 500)->nullable()->after('media_ref_id');
        });
    }

    public function down(): void
    {
        Schema::table('jurnal_mengajar', function (Blueprint $table) {
            $table->dropColumn(['media_type', 'media_ref_id', 'media_url']);
        });
    }
};

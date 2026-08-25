<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Convert existing string values to JSON arrays before changing column type
        DB::table('guru')->whereNotNull('bidang_studi')->get()->each(function ($row) {
            $val = $row->bidang_studi;
            // If it's already valid JSON array, skip
            $decoded = json_decode($val, true);
            if (is_array($decoded)) return;
            // Wrap string into JSON array
            DB::table('guru')->where('id', $row->id)->update([
                'bidang_studi' => json_encode(array_filter(array_map('trim', explode(',', $val)))),
            ]);
        });

        Schema::table('guru', function (Blueprint $table) {
            $table->json('bidang_studi')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->string('bidang_studi')->nullable()->change();
        });
    }
};

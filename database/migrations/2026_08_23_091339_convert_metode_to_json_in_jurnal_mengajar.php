<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Change ENUM to VARCHAR first so JSON arrays can be stored
        Schema::table('jurnal_mengajar', function (Blueprint $table) {
            $table->string('metode', 255)->nullable()->change();
        });

        // Step 2: Convert existing string values to JSON arrays
        $rows = DB::table('jurnal_mengajar')->whereNotNull('metode')->get(['id', 'metode']);
        foreach ($rows as $row) {
            $val = $row->metode;
            if ($val && !str_starts_with(trim($val), '[')) {
                DB::table('jurnal_mengajar')
                    ->where('id', $row->id)
                    ->update(['metode' => json_encode([$val])]);
            }
        }
    }

    public function down(): void
    {
        // Revert JSON arrays back to first element string
        $rows = DB::table('jurnal_mengajar')->whereNotNull('metode')->get(['id', 'metode']);
        foreach ($rows as $row) {
            $decoded = json_decode($row->metode, true);
            if (is_array($decoded)) {
                DB::table('jurnal_mengajar')
                    ->where('id', $row->id)
                    ->update(['metode' => $decoded[0] ?? 'Ceramah']);
            }
        }
    }
};

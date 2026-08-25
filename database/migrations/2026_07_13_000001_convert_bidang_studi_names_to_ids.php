<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $mapelByName = DB::table('mata_pelajaran')
            ->pluck('id', 'nama')
            ->mapWithKeys(fn ($id, $nama) => [strtolower(trim($nama)) => $id])
            ->all();

        DB::table('guru')->whereNotNull('bidang_studi')->get()->each(function ($row) use ($mapelByName) {
            $current = json_decode($row->bidang_studi, true);
            if (!is_array($current) || empty($current)) return;

            // Already IDs (all items are numeric) → skip
            if (collect($current)->every(fn ($v) => is_numeric($v))) return;

            $ids = array_values(array_filter(
                array_map(fn ($name) => $mapelByName[strtolower(trim((string) $name))] ?? null, $current)
            ));

            DB::table('guru')->where('id', $row->id)->update([
                'bidang_studi' => json_encode($ids),
            ]);
        });
    }

    public function down(): void
    {
        $mapelById = DB::table('mata_pelajaran')->pluck('nama', 'id')->all();

        DB::table('guru')->whereNotNull('bidang_studi')->get()->each(function ($row) use ($mapelById) {
            $current = json_decode($row->bidang_studi, true);
            if (!is_array($current) || empty($current)) return;

            if (!collect($current)->every(fn ($v) => is_numeric($v))) return;

            $names = array_values(array_filter(
                array_map(fn ($id) => $mapelById[$id] ?? null, $current)
            ));

            DB::table('guru')->where('id', $row->id)->update([
                'bidang_studi' => json_encode($names),
            ]);
        });
    }
};

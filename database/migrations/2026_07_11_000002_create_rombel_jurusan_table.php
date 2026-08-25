<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rombel_jurusan', function (Blueprint $table) {
            $table->foreignId('rombel_id')->constrained('rombel')->cascadeOnDelete();
            $table->foreignId('jurusan_id')->constrained('jurusan')->cascadeOnDelete();
            $table->primary(['rombel_id', 'jurusan_id']);
        });

        // Seed dari data jurusan_id yang sudah ada di rombel
        DB::table('rombel')
            ->whereNotNull('jurusan_id')
            ->get(['id', 'jurusan_id'])
            ->each(fn ($r) => DB::table('rombel_jurusan')->insertOrIgnore([
                'rombel_id'  => $r->id,
                'jurusan_id' => $r->jurusan_id,
            ]));
    }

    public function down(): void
    {
        Schema::dropIfExists('rombel_jurusan');
    }
};

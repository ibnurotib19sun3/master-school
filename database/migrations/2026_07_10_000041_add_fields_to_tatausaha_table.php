<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tatausaha', function (Blueprint $table) {
            $table->string('gelar_depan', 50)->nullable()->after('nip');
            $table->string('gelar_belakang', 50)->nullable()->after('gelar_depan');
            $table->string('status_kepegawaian', 50)->nullable()->after('jabatan');
            $table->date('tanggal_masuk')->nullable()->after('status_kepegawaian');
            $table->string('pendidikan_terakhir', 50)->nullable()->after('tanggal_masuk');
        });
    }

    public function down(): void
    {
        Schema::table('tatausaha', function (Blueprint $table) {
            $table->dropColumn(['gelar_depan', 'gelar_belakang', 'status_kepegawaian', 'tanggal_masuk', 'pendidikan_terakhir']);
        });
    }
};

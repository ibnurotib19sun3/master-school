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
        Schema::table('presentasi', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('file_path');
            $table->string('file_ext', 10)->nullable()->after('file_name');
            $table->unsignedInteger('file_size')->default(0)->after('file_ext');
        });

        Schema::table('modul_digital', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('file_path');
            $table->string('file_ext', 10)->nullable()->after('file_name');
            $table->unsignedInteger('file_size')->default(0)->after('file_ext');
        });
    }

    public function down(): void
    {
        Schema::table('presentasi', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'file_ext', 'file_size']);
        });
        Schema::table('modul_digital', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'file_ext', 'file_size']);
        });
    }
};

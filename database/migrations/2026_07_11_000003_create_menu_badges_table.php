<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_badges', function (Blueprint $table) {
            $table->id();
            $table->string('path')->unique();
            $table->enum('badge', ['beta', 'maintenance', 'pengembangan']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_badges');
    }
};

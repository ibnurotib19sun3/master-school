<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'bendahara_sekolah',  'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'bimbingan_konseling', 'guard_name' => 'web']);
    }

    public function down(): void
    {
        Role::where('name', 'bendahara_sekolah')->delete();
        Role::where('name', 'bimbingan_konseling')->delete();
    }
};

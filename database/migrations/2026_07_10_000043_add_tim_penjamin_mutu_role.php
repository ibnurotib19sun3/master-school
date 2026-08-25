<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        Role::firstOrCreate(['name' => 'tim_penjamin_mutu',          'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'kepala_konsentrasi_keahlian', 'guard_name' => 'web']);
    }

    public function down(): void
    {
        Role::where('name', 'tim_penjamin_mutu')->delete();
        Role::where('name', 'kepala_konsentrasi_keahlian')->delete();
    }
};

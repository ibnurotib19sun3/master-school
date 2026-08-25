<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        // ── Super Admin ───────────────────────────────────────────────────────
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@apikmas-djurnal.id'],
            ['name' => 'Super Admin', 'password' => Hash::make('apikmasdjurnal'), 'username' => 'superadmin', 'is_active' => true]
        );
        $superAdmin->syncRoles(['super_admin']);

        // ── Guru Piket ────────────────────────────────────────────────────────
        $piket = User::firstOrCreate(
            ['email' => 'piket@apikmas-djurnal.id'],
            ['name' => 'Guru Piket', 'password' => Hash::make('apikmasdjurnal'), 'is_active' => true]
        );
        $piket->syncRoles(['guru_piket']);
    }
}

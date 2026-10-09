<?php
use App\Models\User;
use App\Models\Tatausaha;
use Illuminate\Support\Facades\Hash;

try {
    $u = User::firstOrCreate(
        ['email' => 'temp.qa.tu8@example.test'],
        ['name' => 'Temp QA TU8', 'password' => Hash::make('password123'), 'email_verified_at' => now()]
    );
    $u->syncRoles(['tatausaha']);
    Tatausaha::updateOrCreate(
        ['user_id' => $u->id],
        ['nip' => '999008', 'jabatan' => 'Tatausaha', 'is_aktif' => true]
    );
    echo "ready: {$u->email} id={$u->id}\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

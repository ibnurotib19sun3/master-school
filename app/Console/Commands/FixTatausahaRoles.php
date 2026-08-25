<?php

namespace App\Console\Commands;

use App\Models\Tatausaha;
use Illuminate\Console\Command;

class FixTatausahaRoles extends Command
{
    protected $signature   = 'fix:tatausaha-roles';
    protected $description = 'Kembalikan role tatausaha ke user yang profil TU-nya aktif';

    public function handle(): int
    {
        $list = Tatausaha::with('user')->where('is_aktif', true)->get();
        $fixed = 0;

        foreach ($list as $tu) {
            if (!$tu->user) continue;

            if (!$tu->user->hasRole('tatausaha')) {
                $tu->user->assignRole('tatausaha');
                $this->line("Fixed: {$tu->user->name}");
                $fixed++;
            }
        }

        $this->info($fixed > 0 ? "{$fixed} user berhasil diperbaiki." : 'Semua user sudah benar, tidak ada yang perlu diperbaiki.');
        return self::SUCCESS;
    }
}

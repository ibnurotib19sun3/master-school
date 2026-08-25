<?php

namespace App\Console\Commands;

use App\Models\Guru;
use Illuminate\Console\Command;

class SyncGuruRoles extends Command
{
    protected $signature   = 'guru:sync-roles';
    protected $description = 'Sinkronkan Spatie roles semua guru berdasarkan jabatan yang tersimpan di database';

    private array $map = [
        'Kepala Sekolah'               => 'kepala_sekolah',
        'Wakasek Kurikulum'            => 'wakasek_kurikulum',
        'Wakasek Kesiswaan'            => 'wakasek_kesiswaan',
        'Wakasek Sarana Prasarana'     => 'wakasek_sarpras',
        'Wakasek Humas'                => 'wakasek_humas',
        'Tim Penjamin Mutu Sekolah'    => 'tim_penjamin_mutu',
        'Kepala Konsentrasi Keahlian'  => 'kepala_konsentrasi_keahlian',
        'Kepala Tata Usaha'            => 'kepala_tatausaha',
        'Guru Piket'                   => 'guru_piket',
        'Pokja Kurikulum'              => 'pokja_kurikulum',
        'Pokja Kesiswaan'              => 'pokja_kesiswaan',
        'Pokja Sarpras'                => 'pokja_sarpras',
        'Pokja Humas'                  => 'pokja_humas',
        'Bendahara Sekolah'            => 'bendahara_sekolah',
        'Bimbingan Konseling'          => 'bimbingan_konseling',
    ];

    /** Role yang dikelola sistem guru — boleh di-reset saat sync. */
    private function guruManagedRoles(): array
    {
        return array_merge(['guru'], array_values($this->map));
    }

    public function handle(): int
    {
        $guru = Guru::with('user')->get();
        $bar  = $this->output->createProgressBar($guru->count());
        $bar->start();

        $updated = 0;

        foreach ($guru as $g) {
            if (! $g->user) {
                $bar->advance();
                continue;
            }

            $jabatan = is_array($g->jabatan) ? $g->jabatan : [];
            $roles   = ['guru'];

            foreach ($jabatan as $j) {
                if (isset($this->map[$j])) {
                    $roles[] = $this->map[$j];
                }
            }

            // Preserve role non-guru (mis. tatausaha) agar tidak terhapus saat sync
            $guruManaged = $this->guruManagedRoles();
            $preserved   = $g->user->roles->pluck('name')
                ->reject(fn ($r) => in_array($r, $guruManaged))
                ->toArray();

            $roles = array_unique(array_merge($roles, $preserved));
            $g->user->syncRoles($roles);
            $updated++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Selesai: {$updated} guru berhasil disinkronkan.");

        return self::SUCCESS;
    }
}

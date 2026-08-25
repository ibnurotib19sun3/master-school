<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Users
            'users.view', 'users.create', 'users.edit', 'users.delete',
            // Tahun Ajaran
            'tahun_ajaran.view', 'tahun_ajaran.create', 'tahun_ajaran.edit', 'tahun_ajaran.delete',
            // Kelas & Jurusan
            'kelas.view', 'kelas.create', 'kelas.edit', 'kelas.delete',
            'jurusan.view', 'jurusan.create', 'jurusan.edit', 'jurusan.delete',
            'rombel.view', 'rombel.create', 'rombel.edit', 'rombel.delete',
            // Mata Pelajaran
            'mata_pelajaran.view', 'mata_pelajaran.create', 'mata_pelajaran.edit', 'mata_pelajaran.delete',
            // Guru & Siswa
            'guru.view', 'guru.create', 'guru.edit', 'guru.delete',
            'siswa.view', 'siswa.create', 'siswa.edit', 'siswa.delete',
            'orang_tua.view', 'orang_tua.create', 'orang_tua.edit', 'orang_tua.delete',
            // Pembelajaran
            'pembelajaran.view', 'pembelajaran.create', 'pembelajaran.edit', 'pembelajaran.delete',
            // Absensi & Piket
            'absensi.view', 'absensi.create', 'absensi.edit',
            'piket.manage',
            // Jurnal Mengajar
            'jurnal.view', 'jurnal.create', 'jurnal.edit', 'jurnal.delete',
            // Nilai
            'nilai.view', 'nilai.create', 'nilai.edit', 'nilai.delete',
            'jenis_penilaian.view', 'jenis_penilaian.create', 'jenis_penilaian.edit',
            // KPI
            'kpi.view', 'kpi.create', 'kpi.edit', 'kpi.delete',
            // Media
            'video_edukasi.view', 'video_edukasi.create', 'video_edukasi.edit', 'video_edukasi.delete',
            'presentasi.view', 'presentasi.create', 'presentasi.edit', 'presentasi.delete',
            'kuis.view', 'kuis.create', 'kuis.edit', 'kuis.delete',
            // E-Learning
            'modul_digital.view', 'modul_digital.create', 'modul_digital.edit', 'modul_digital.delete',
            'assessment.view', 'assessment.create', 'assessment.edit', 'assessment.delete',
            // Catatan Kepsek
            'catatan_kepsek.view', 'catatan_kepsek.create', 'catatan_kepsek.edit', 'catatan_kepsek.delete',
            // Activity Logs
            'activity_logs.view',
            // Reports
            'reports.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Roles
        $superAdmin      = Role::firstOrCreate(['name' => 'super_admin']);
        $kepsek          = Role::firstOrCreate(['name' => 'kepala_sekolah']);
        $wakasekKur      = Role::firstOrCreate(['name' => 'wakasek_kurikulum']);
        $wakasekKes      = Role::firstOrCreate(['name' => 'wakasek_kesiswaan']);
        $guru            = Role::firstOrCreate(['name' => 'guru']);
        $guruPiket       = Role::firstOrCreate(['name' => 'guru_piket']);
        $siswa           = Role::firstOrCreate(['name' => 'siswa']);
        $orangTua        = Role::firstOrCreate(['name' => 'orang_tua']);
        $tatausaha       = Role::firstOrCreate(['name' => 'tatausaha']);
        $kepalaTatausaha = Role::firstOrCreate(['name' => 'kepala_tatausaha']);
        $pokjaKur        = Role::firstOrCreate(['name' => 'pokja_kurikulum']);
        $pokjaKes        = Role::firstOrCreate(['name' => 'pokja_kesiswaan']);
        $pokjaSar        = Role::firstOrCreate(['name' => 'pokja_sarpras']);
        $pokjaHum        = Role::firstOrCreate(['name' => 'pokja_humas']);
        $wakasekSar      = Role::firstOrCreate(['name' => 'wakasek_sarpras']);
        $wakasekHum      = Role::firstOrCreate(['name' => 'wakasek_humas']);
        $timPM           = Role::firstOrCreate(['name' => 'tim_penjamin_mutu']);
        $bendahara       = Role::firstOrCreate(['name' => 'bendahara_sekolah']);
        $kepalaKK        = Role::firstOrCreate(['name' => 'kepala_konsentrasi_keahlian']);

        // Super Admin: all permissions
        $superAdmin->syncPermissions(Permission::all());

        // Kepala Sekolah
        $kepsek->syncPermissions([
            'users.view', 'guru.view', 'siswa.view', 'rombel.view', 'kelas.view',
            'pembelajaran.view', 'absensi.view', 'jurnal.view',
            'nilai.view', 'kpi.view', 'kpi.create', 'kpi.edit',
            'catatan_kepsek.view', 'catatan_kepsek.create', 'catatan_kepsek.edit',
            'video_edukasi.view', 'presentasi.view', 'kuis.view',
            'modul_digital.view', 'activity_logs.view', 'reports.view',
        ]);

        // Wakasek Kurikulum
        $wakasekKur->syncPermissions([
            'tahun_ajaran.view', 'tahun_ajaran.create', 'tahun_ajaran.edit',
            'kelas.view', 'kelas.create', 'kelas.edit',
            'jurusan.view', 'jurusan.create', 'jurusan.edit',
            'rombel.view', 'rombel.create', 'rombel.edit',
            'mata_pelajaran.view', 'mata_pelajaran.create', 'mata_pelajaran.edit',
            'guru.view', 'siswa.view', 'pembelajaran.view', 'pembelajaran.create', 'pembelajaran.edit',
            'nilai.view', 'jurnal.view', 'absensi.view',
            'kpi.view', 'reports.view',
        ]);

        // Wakasek Kesiswaan
        $wakasekKes->syncPermissions([
            'siswa.view', 'siswa.create', 'siswa.edit',
            'orang_tua.view', 'orang_tua.create', 'orang_tua.edit',
            'rombel.view', 'absensi.view', 'reports.view',
        ]);

        // Guru
        $guru->syncPermissions([
            'pembelajaran.view',
            'absensi.view', 'absensi.create', 'absensi.edit',
            'jurnal.view', 'jurnal.create', 'jurnal.edit',
            'nilai.view', 'nilai.create', 'nilai.edit',
            'video_edukasi.view', 'video_edukasi.create', 'video_edukasi.edit',
            'presentasi.view', 'presentasi.create', 'presentasi.edit',
            'kuis.view', 'kuis.create', 'kuis.edit',
            'modul_digital.view', 'modul_digital.create', 'modul_digital.edit',
            'assessment.view', 'assessment.create', 'assessment.edit',
            'catatan_kepsek.view',
        ]);

        // Guru Piket
        $guruPiket->syncPermissions([
            'piket.manage',
            'absensi.view', 'absensi.create', 'absensi.edit',
        ]);

        // Siswa
        $siswa->syncPermissions([
            'pembelajaran.view',
            'absensi.view',
            'nilai.view',
            'video_edukasi.view',
            'presentasi.view',
            'kuis.view',
            'modul_digital.view',
            'assessment.view',
        ]);

        // Orang Tua
        $orangTua->syncPermissions([
            'siswa.view',
            'absensi.view',
            'nilai.view',
        ]);

        // Tata Usaha
        $tatausaha->syncPermissions([
            'catatan_kepsek.view',
            'reports.view',
        ]);

        // Kepala Tata Usaha
        $kepalaTatausaha->syncPermissions([
            'catatan_kepsek.view',
            'reports.view',
            'absensi.view',
        ]);

        // Pokja (all 4 groups share same basic permissions)
        $pokjaPerms = ['catatan_kepsek.view', 'reports.view'];
        $pokjaKur->syncPermissions($pokjaPerms);
        $pokjaKes->syncPermissions($pokjaPerms);
        $pokjaSar->syncPermissions($pokjaPerms);
        $pokjaHum->syncPermissions($pokjaPerms);

        // Wakasek Sarpras & Waka Humas
        $wakasekPerms = ['catatan_kepsek.view', 'reports.view', 'absensi.view', 'jurnal.view'];
        $wakasekSar->syncPermissions($wakasekPerms);
        $wakasekHum->syncPermissions($wakasekPerms);

        // Tim Penjamin Mutu, Bendahara, Kepala KK
        $pimpinanPerms = ['catatan_kepsek.view', 'reports.view'];
        $timPM->syncPermissions($pimpinanPerms);
        $bendahara->syncPermissions($pimpinanPerms);
        $kepalaKK->syncPermissions($pimpinanPerms);
    }
}

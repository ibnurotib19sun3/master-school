<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UsersExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    private string $tab;

    public function __construct(string $tab = 'staff')
    {
        $this->tab = $tab;
    }

    public function query()
    {
        $staffRoles   = ['super_admin', 'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
                         'guru', 'tatausaha', 'kepala_tatausaha', 'guru_piket',
                         'pokja_keahlian', 'pokja_kurikulum', 'pokja_kesiswaan', 'pokja_sarpras',
                         'bimbingan_konseling', 'bendahara_sekolah', 'tim_penjamin_mutu', 'kepala_konsentrasi_keahlian'];
        $studentRoles = ['siswa', 'orang_tua'];

        $roles = $this->tab === 'murid' ? $studentRoles : $staffRoles;

        return User::with('roles')
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $roles))
            ->orderBy('name');
    }

    public function headings(): array
    {
        return ['No', 'Nama', 'Email', 'Username', 'Password', 'Role', 'Status'];
    }

    public function map($user): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $user->name,
            $user->email,
            $user->username ?? '-',
            $user->plain_password ?? 'apikmasdjurnal',
            $user->roles->pluck('name')->join(', '),
            $user->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF1F2D3D']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }
}

<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KehadiranSiswaExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private $rekap, private string $bulan) {}

    public function collection()
    {
        return collect($this->rekap)->map(fn ($r) => [
            $r['nis'],
            $r['nama'],
            $r['rombel'],
            $r['hadir'],
            $r['sakit'],
            $r['izin'],
            $r['alpha'],
            $r['total'],
            $r['persen'] . '%',
        ]);
    }

    public function headings(): array
    {
        return ['NIS', 'Nama Siswa', 'Rombel', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Total', '% Kehadiran'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'D1FAE5']],
            ],
        ];
    }

    public function title(): string
    {
        [$y, $m] = explode('-', $this->bulan);
        $nama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][(int)$m - 1] ?? $m;
        return "Kehadiran Siswa {$nama} {$y}";
    }
}

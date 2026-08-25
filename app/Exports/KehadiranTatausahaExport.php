<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KehadiranTatausahaExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private $rekap, private string $bulan, private int $hariKerja) {}

    public function collection()
    {
        return collect($this->rekap)->map(fn ($r) => [
            $r['nama'],
            $r['nip'] ?? '-',
            $r['jabatan'] ?? '-',
            $this->hariKerja,
            $r['hadir'],
            $r['sakit'],
            $r['izin'],
            $r['alpha'],
            $r['total'],
            $r['tidak_absen'],
            $r['persen'] . '%',
        ]);
    }

    public function headings(): array
    {
        return [
            'Nama', 'NIP/NIPY', 'Jabatan', 'Hari Kerja',
            'Hadir', 'Sakit', 'Izin', 'Alpha', 'Total Absen',
            'Tidak Absen', '% Kehadiran',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();

        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'EDE9FE']],
        ]);

        // Center-align numeric columns D–K (Hari Kerja … % Kehadiran)
        $sheet->getStyle("D1:K{$lastRow}")->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        return [];
    }

    public function title(): string
    {
        [$y, $m] = explode('-', $this->bulan);
        $nama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][(int)$m - 1] ?? $m;
        return "Kehadiran TU {$nama} {$y}";
    }
}

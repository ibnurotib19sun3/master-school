<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KehadiranGuruExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private $rekap, private string $bulan) {}

    public function collection()
    {
        return collect($this->rekap)->map(fn ($r) => [
            $r['nama'],
            $r['nip'] ?? '-',
            $r['hadir'],
            $r['sakit'],
            $r['izin'],
            $r['alpha'],
            $r['total'],
            $r['persen_hari'] . '%',
            $r['jam_terjadwal'],
            $r['jp_hadir'],
            $r['jp_tugas_sekolah'],
            $r['jp_tidak_hadir'],
            $r['jp_sakit'],
            $r['jp_izin'],
            $r['jp_alpha'],
            $r['persen_mengajar'] . '%',
            $r['persen_tidak_hadir'] . '%',
        ]);
    }

    public function headings(): array
    {
        return [
            'Nama Guru', 'NIP/NIPY',
            'Hari Hadir', 'Hari Sakit', 'Hari Izin', 'Hari Alpha', 'Total Hari', '% Kehadiran Hari',
            'Jam Terjadwal', 'JP Hadir Mengajar', 'JP Tugas Sekolah', 'JP Tidak Hadir',
            '  JP Sakit', '  JP Izin', '  JP Alpha',
            '% Mengajar', '% Tidak Hadir',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();

        // Header
        $sheet->getStyle('A1:Q1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'E0E7FF']],
        ]);

        // Center-align numeric columns C–Q (Hari Hadir … % Tidak Hadir)
        $sheet->getStyle("C1:Q{$lastRow}")->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        return [];
    }

    public function title(): string
    {
        if (preg_match('/^\d{4}-\d{2}$/', $this->bulan)) {
            [$y, $m] = explode('-', $this->bulan);
            $nama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][(int)$m - 1] ?? $m;
            return "Kehadiran Guru {$nama} {$y}";
        }
        return "Kehadiran Guru {$this->bulan}";
    }
}

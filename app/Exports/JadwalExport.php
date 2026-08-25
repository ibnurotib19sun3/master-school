<?php

namespace App\Exports;

use App\Models\Jadwal;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class JadwalExport implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    private array $hariOrder = ['Senin' => 0, 'Selasa' => 1, 'Rabu' => 2, 'Kamis' => 3, 'Jumat' => 4, 'Sabtu' => 5, 'Ahad' => 6];

    public function __construct(private ?int $rombelId = null) {}

    public function title(): string { return 'Data Jadwal'; }

    public function array(): array
    {
        $jadwal = Jadwal::with(['pembelajaran.rombel', 'pembelajaran.mataPelajaran', 'pembelajaran.guru.user'])
            ->where('is_aktif', true)
            ->when($this->rombelId, fn ($q) => $q->whereHas('pembelajaran', fn ($p) => $p->where('rombel_id', $this->rombelId)))
            ->get()
            ->sortBy([
                fn ($a, $b) => strcmp($a->pembelajaran?->rombel?->nama ?? '', $b->pembelajaran?->rombel?->nama ?? ''),
                fn ($a, $b) => ($this->hariOrder[$a->hari] ?? 9) - ($this->hariOrder[$b->hari] ?? 9),
                fn ($a, $b) => $a->jam_ke - $b->jam_ke,
            ]);

        $rows = [['Rombel', 'Hari', 'JP', 'Jam Mulai', 'Jam Selesai', 'Mata Pelajaran', 'Guru']];
        foreach ($jadwal as $j) {
            $rows[] = [
                $j->pembelajaran?->rombel?->nama ?? '',
                $j->hari,
                $j->jam_ke,
                substr((string) $j->jam_mulai, 0, 5),
                substr((string) $j->jam_selesai, 0, 5),
                $j->pembelajaran?->mataPelajaran?->nama ?? '',
                $j->pembelajaran?->guru?->user?->name ?? '',
            ];
        }
        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 22, 'B' => 10, 'C' => 5, 'D' => 12, 'E' => 12, 'F' => 32, 'G' => 32];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $sheet->getRowDimension(1)->setRowHeight(24);
                $sheet->freezePane('A2');
                $sheet->getStyle('A1:G1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '3730A3']]],
                ]);
            },
        ];
    }
}

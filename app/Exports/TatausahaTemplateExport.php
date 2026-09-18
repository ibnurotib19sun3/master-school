<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class TatausahaTemplateExport implements WithMultipleSheets
{
    private const JABATAN_LIST = ['Tatausaha', 'Keuangan', 'Operator', 'Kebersihan', 'Keamanan', 'Penjaga Kantin', 'Toolman'];
    private const STATUS_LIST  = ['PNS', 'PPPK', 'PTY', 'Honor', 'PTT', 'Kontrak'];
    private const PENDIDIKAN_LIST = ['SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];

    public function sheets(): array
    {
        return [
            new TatausahaDataSheet(self::JABATAN_LIST, self::STATUS_LIST, self::PENDIDIKAN_LIST),
            new TatausahaPanduanSheet(self::JABATAN_LIST, self::STATUS_LIST, self::PENDIDIKAN_LIST),
        ];
    }
}

/* ─── Sheet 1: Data ─────────────────────────────────────── */
class TatausahaDataSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    public function __construct(private array $jabatanList, private array $statusList, private array $pendidikanList) {}

    public function title(): string { return 'Data Tata Usaha'; }

    public function array(): array
    {
        return [
            // Header — nama kolom harus cocok dengan alias di TatausahaImport
            [
                'Nama', 'Email', 'NIP/NIPY',
                'Gelar Depan', 'Gelar Belakang', 'Gender',
                'Jabatan', 'Status Kepegawaian', 'Pendidikan Terakhir',
                'Tanggal Masuk', 'Nomor WA', 'Password',
            ],
            // Contoh baris
            [
                'Siti Aminah', '', '20020619202107001',
                '', 'A.Md.', 'P',
                'Tatausaha', 'PTY', 'D3',
                '2021-07-01', '081234567890', '',
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28, 'B' => 32, 'C' => 22,
            'D' => 14, 'E' => 16, 'F' => 14,
            'G' => 18, 'H' => 20, 'I' => 20,
            'J' => 26, 'K' => 18, 'L' => 18,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C3AED']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ],
            2 => [
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F5F3FF']],
                'font' => ['italic' => true, 'color' => ['rgb' => '4B5563']],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $sheet->getRowDimension(1)->setRowHeight(36);
                $sheet->getRowDimension(2)->setRowHeight(20);
                $sheet->freezePane('A2');

                $sheet->getStyle('A1:L1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '5B21B6']]],
                ]);

                $this->addDropdown($sheet, 'F3:F2000', '"L,P"');
                $this->addDropdown($sheet, 'G3:G2000', '"' . implode(',', $this->jabatanList) . '"');
                $this->addDropdown($sheet, 'H3:H2000', '"' . implode(',', $this->statusList) . '"');
                $this->addDropdown($sheet, 'I3:I2000', '"' . implode(',', $this->pendidikanList) . '"');

                $sheet->getComment('B1')->getText()->createTextRun(
                    'Kosongkan untuk auto-generate dari nama.' . "\n"
                    . 'Format: nama.depan.belakang@apikmas-djurnal.id'
                );
                $sheet->getComment('L1')->getText()->createTextRun(
                    'Kosongkan untuk menggunakan password default: apikmasdjurnal'
                );
            },
        ];
    }

    private function addDropdown(Worksheet $sheet, string $range, string $formula): void
    {
        $validation = $sheet->getDataValidation($range);
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_WARNING);
        $validation->setAllowBlank(true);
        $validation->setShowDropDown(true);
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Nilai tidak valid');
        $validation->setError('Pilih nilai dari daftar yang tersedia.');
        $validation->setFormula1($formula);
    }
}

/* ─── Sheet 2: Panduan ──────────────────────────────────── */
class TatausahaPanduanSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private array $jabatanList, private array $statusList, private array $pendidikanList) {}

    public function title(): string { return 'Panduan'; }

    public function array(): array
    {
        $rows = [
            ['PANDUAN IMPORT DATA TATA USAHA', '', '', ''],
            [''],
            ['KOLOM', 'KETERANGAN', 'NILAI YANG DITERIMA', 'WAJIB?'],
            ['Nama',               'Nama lengkap staf (tanpa gelar)',                    'Teks bebas',                                'Ya'],
            ['Email',              'Kosongkan = auto-generate dari nama',                'Format email / kosong',                     'Tidak'],
            ['NIP/NIPY',           'Nomor Induk Pegawai (harus unik)',                   'Angka / kosong',                            'Tidak'],
            ['Gelar Depan',        'Contoh: Drs., Dr.',                                  'Teks bebas',                                'Tidak'],
            ['Gelar Belakang',     'Contoh: A.Md., S.E.',                                'Teks bebas',                                'Tidak'],
            ['Gender',             'Jenis kelamin',                                      'L atau P',                                  'Tidak'],
            ['Jabatan',            'Jabatan tata usaha. Pilih dari dropdown.',           implode(' / ', $this->jabatanList),          'Tidak (default: Tatausaha)'],
            ['Status Kepegawaian', 'Status kepegawaian',                                 implode(' / ', $this->statusList),           'Tidak'],
            ['Pendidikan Terakhir','Jenjang pendidikan terakhir',                        implode(' / ', $this->pendidikanList),       'Tidak'],
            ['Tanggal Masuk',      'Tanggal mulai bertugas',                             'Format: YYYY-MM-DD atau DD/MM/YYYY',        'Tidak'],
            ['Nomor WA',           'Nomor WhatsApp aktif',                               'Contoh: 081234567890',                      'Tidak'],
            ['Password',           'Kosongkan = password default "apikmasdjurnal"',      'Teks / kosong',                             'Tidak'],
        ];

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 30, 'B' => 50, 'C' => 44, 'D' => 22];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '3B0764']]],
            3 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C3AED']],
            ],
        ];
    }
}

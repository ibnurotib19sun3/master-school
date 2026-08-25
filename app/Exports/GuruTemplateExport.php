<?php

namespace App\Exports;

use App\Models\MataPelajaran;
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

class GuruTemplateExport implements WithMultipleSheets
{
    private const JABATAN_LIST = [
        'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan',
        'Wakasek Sarana Prasarana', 'Wakasek Humas', 'Kepala Tata Usaha',
        'Guru Piket', 'Pokja Kurikulum', 'Pokja Kesiswaan', 'Pokja Sarpras',
        'Pokja Humas', 'Wali Kelas', 'Bimbingan Konseling',
        'Kepala Laboratorium', 'Kepala Perpustakaan', 'Pembina OSIS',
        'Koordinator Pramuka', 'Koordinator PMR', 'Bendahara Sekolah',
        'Tim Penjamin Mutu Sekolah', 'Kepala Konsentrasi Keahlian',
    ];

    public function sheets(): array
    {
        $mapel = MataPelajaran::orderBy('nama')->get(['id', 'nama'])->toArray();

        return [
            new GuruDataSheet($mapel, self::JABATAN_LIST),
            new GuruPanduanSheet($mapel, self::JABATAN_LIST),
            new GuruMapelHelperSheet($mapel),
        ];
    }
}

/* ─── Sheet 1: Data ─────────────────────────────────────── */
class GuruDataSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    private string $exampleBidang;

    public function __construct(private array $mapelList, private array $jabatanList)
    {
        // Contoh bidang studi = nama dari 2 mapel pertama
        if (!empty($mapelList)) {
            $names = array_slice(array_column($mapelList, 'nama'), 0, 2);
            $this->exampleBidang = implode(', ', $names);
        } else {
            $this->exampleBidang = '';
        }
    }

    public function title(): string { return 'Data Guru'; }

    public function array(): array
    {
        return [
            // Header — nama kolom harus cocok dengan alias di GuruImport
            [
                'Nama', 'Email', 'NIP', 'NUPTK',
                'Gelar Depan', 'Gelar Belakang', 'Gender',
                'Status Kepegawaian', 'Pendidikan Terakhir',
                'Bidang Studi', 'Jabatan', 'Tanggal Masuk',
                'Nomor WA', 'Password',
            ],
            // Contoh baris
            [
                'Ahmad Fauzi', '', '197001011990011001', '1234567890123456',
                'Drs.', 'M.Pd.', 'L',
                'PNS', 'S2',
                $this->exampleBidang, 'Wali Kelas', '2015-07-01',
                '081234567890', '',
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28, 'B' => 32, 'C' => 22, 'D' => 22,
            'E' => 14, 'F' => 16, 'G' => 14,
            'H' => 22, 'I' => 20,
            'J' => 28, 'K' => 36, 'L' => 26,
            'M' => 18, 'N' => 18,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ],
            2 => [
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EEF2FF']],
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

                $sheet->getStyle('A1:N1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '3730A3']]],
                ]);

                // ── Dropdown: Gender ──
                $this->addDropdown($sheet, 'G3:G2000', '"L,P"');

                // ── Dropdown: Status Kepegawaian ──
                $this->addDropdown($sheet, 'H3:H2000', '"PNS,PPPK,GTY,GTT,Honorer"');

                // ── Dropdown: Pendidikan ──
                $this->addDropdown($sheet, 'I3:I2000', '"D3,D4,S1,S2,S3"');

                // ── Dropdown: Bidang Studi — referensi ke sheet helper tersembunyi ──
                $mCount = count($this->mapelList);
                if ($mCount > 0) {
                    $this->addDropdown($sheet, 'J3:J2000', "MapelHelper!\$A\$1:\$A\${$mCount}");
                }

                // ── Dropdown: Jabatan — list ditulis ke kolom Q (hidden) ──
                $n = count($this->jabatanList);
                foreach ($this->jabatanList as $i => $jabatan) {
                    $sheet->setCellValue('Q' . ($i + 1), $jabatan);
                }
                $sheet->getColumnDimension('Q')->setVisible(false);
                $this->addDropdown($sheet, 'K3:K2000', '$Q$1:$Q$' . $n);

                // ── Komentar kolom ──
                $sheet->getComment('J1')->getText()->createTextRun(
                    'Pilih mata pelajaran dari dropdown.' . "\n"
                    . 'Untuk lebih dari satu, ketik manual pisahkan koma.' . "\n"
                    . 'Contoh: ' . $this->exampleBidang
                );
                $sheet->getComment('K1')->getText()->createTextRun(
                    'Pilih satu jabatan dari dropdown.' . "\n"
                    . 'Lihat sheet "Panduan" untuk daftar lengkap.'
                );
                $sheet->getComment('B1')->getText()->createTextRun(
                    'Kosongkan untuk auto-generate dari nama.' . "\n"
                    . 'Format: nama.depan.belakang@apikmas-djurnal.id'
                );
                $sheet->getComment('N1')->getText()->createTextRun(
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
class GuruPanduanSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private array $mapelList, private array $jabatanList) {}

    public function title(): string { return 'Panduan'; }

    public function array(): array
    {
        $rows = [
            ['PANDUAN IMPORT DATA GURU', '', '', ''],
            [''],
            ['KOLOM', 'KETERANGAN', 'NILAI YANG DITERIMA', 'WAJIB?'],
            ['Nama',               'Nama lengkap guru (tanpa gelar)',                                        'Teks bebas',                            'Ya'],
            ['Email',              'Kosongkan = auto-generate dari nama',                                    'Format email / kosong',                 'Tidak'],
            ['NIP',                'Nomor Induk Pegawai (harus unik)',                                       'Angka / kosong',                        'Tidak'],
            ['NUPTK',              'Nomor Unik PTK (harus unik)',                                            'Angka / kosong',                        'Tidak'],
            ['Gelar Depan',        'Contoh: Drs., Dr., Ir.',                                                'Teks bebas',                            'Tidak'],
            ['Gelar Belakang',     'Contoh: M.Pd., S.T.',                                                   'Teks bebas',                            'Tidak'],
            ['Gender',             'Jenis kelamin',                                                         'L atau P',                              'Tidak'],
            ['Status Kepegawaian', 'Status kepegawaian guru',                                               'PNS / PPPK / GTY / GTT / Honorer',      'Ya'],
            ['Pendidikan Terakhir','Jenjang pendidikan terakhir',                                            'D3 / D4 / S1 / S2 / S3',               'Tidak'],
            ['Bidang Studi',       'Nama mata pelajaran. Pilih dari dropdown. Untuk lebih dari satu, ketik manual pisahkan koma.', 'Nama mapel, contoh: Matematika, Fisika', 'Tidak'],
            ['Jabatan',            'Jabatan struktural guru. Pilih dari dropdown di sheet Data Guru.',       'Lihat daftar jabatan di bawah',         'Tidak'],
            ['Tanggal Masuk',      'Tanggal mulai bertugas',                                                'Format: YYYY-MM-DD atau DD/MM/YYYY',    'Tidak'],
            ['Nomor WA',           'Nomor WhatsApp aktif',                                                  'Contoh: 081234567890',                  'Tidak'],
            ['Password',           'Kosongkan = password default "apikmasdjurnal"',                          'Teks / kosong',                         'Tidak'],
            [''],
            ['DAFTAR JABATAN (pilih satu dari dropdown di sheet Data Guru)', '', '', ''],
        ];

        foreach ($this->jabatanList as $j) {
            $rows[] = ['', $j, '', ''];
        }

        $rows[] = [''];
        $rows[] = ['DAFTAR MATA PELAJARAN — pilih dari dropdown kolom Bidang Studi, atau ketik nama persis berikut (pisahkan koma jika lebih dari satu)', '', '', ''];
        $rows[] = ['', 'No', 'Nama Mata Pelajaran', ''];
        foreach ($this->mapelList as $idx => $m) {
            $rows[] = ['', $idx + 1, $m['nama'], ''];
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 30, 'B' => 60, 'C' => 44, 'D' => 10];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1E1B4B']]],
            3 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
            ],
        ];
    }
}

/* ─── Sheet 3: Helper Mapel (hidden, sumber dropdown) ───── */
class GuruMapelHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $mapelList) {}

    public function title(): string { return 'MapelHelper'; }

    public function array(): array
    {
        return array_map(fn ($m) => [$m['nama']], $this->mapelList);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $event->sheet->getDelegate()->setSheetState(
                    \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN
                );
            },
        ];
    }
}

<?php

namespace App\Exports;

use App\Models\Rombel;
use App\Models\TahunAjaran;
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
use PhpOffice\PhpSpreadsheet\NamedRange;

class SiswaTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        $tahunAjaran = TahunAjaran::aktif();
        $rombel = Rombel::with(['jurusanList'])
            ->when($tahunAjaran, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaran->id))
            ->orderBy('nama')
            ->get();

        return [
            new SiswaDataSheet($rombel),
            new SiswaPanduanSheet($rombel, $tahunAjaran),
        ];
    }
}

/* ─── Sheet 1: Data ─────────────────────────────────────── */
class SiswaDataSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    public function __construct(private \Illuminate\Support\Collection $rombelList) {}

    public function title(): string { return 'Data Siswa'; }

    public function array(): array
    {
        return [
            // Header (A–J)
            ['NIS', 'NISN', 'Nama Lengkap', 'Email', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Rombel', 'Jurusan'],
            // Contoh baris
            ['240001', '0012345678', 'Budi Santoso', '', 'L', 'Jakarta', '2008-05-15', 'Islam', '10 RPL 1', 'Rekayasa Perangkat Lunak'],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 14, 'B' => 16, 'C' => 28, 'D' => 30,
            'E' => 16, 'F' => 20, 'G' => 22, 'H' => 14,
            'I' => 22, 'J' => 32,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
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
                $sheet       = $event->sheet->getDelegate();
                $spreadsheet = $sheet->getParent();

                $sheet->getRowDimension(1)->setRowHeight(36);
                $sheet->getRowDimension(2)->setRowHeight(20);
                $sheet->freezePane('A2');

                $sheet->getStyle('A1:J1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '3730A3']]],
                ]);

                // Dropdown tetap: Jenis Kelamin & Agama
                $this->addDropdown($sheet, 'E3:E2000', '"L,P"');
                $this->addDropdown($sheet, 'H3:H2000', '"Islam,Kristen,Katolik,Hindu,Buddha,Konghucu"');

                // ── Rombel dropdown + Jurusan dependent dropdown ──────────
                $rombelCount = $this->rombelList->count();
                if ($rombelCount > 0) {
                    // Kolom K (tersembunyi): daftar nama rombel → sumber dropdown kolom I
                    foreach ($this->rombelList as $i => $r) {
                        $sheet->setCellValue('K' . ($i + 1), $r->nama);
                    }
                    $sheet->getColumnDimension('K')->setVisible(false);
                    $this->addDropdown($sheet, 'I3:I2000', '$K$1:$K$' . $rombelCount);

                    // Kolom L, M, N, ... (tersembunyi): jurusan per rombel
                    // Named range JR1, JR2, ... dipakai INDIRECT di kolom J
                    $colIdx = 12; // L = indeks 12 (A=1)
                    foreach ($this->rombelList as $i => $r) {
                        $jurusanList = $r->jurusanList;
                        $colLetter   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);

                        if ($jurusanList->isEmpty()) {
                            $sheet->setCellValue($colLetter . '1', '');
                            $jCount = 1;
                        } else {
                            foreach ($jurusanList as $j => $jurusan) {
                                $sheet->setCellValue($colLetter . ($j + 1), $jurusan->nama);
                            }
                            $jCount = $jurusanList->count();
                        }

                        $sheet->getColumnDimension($colLetter)->setVisible(false);
                        $spreadsheet->addNamedRange(new NamedRange(
                            'JLIST' . ($i + 1),
                            $sheet,
                            '$' . $colLetter . '$1:$' . $colLetter . '$' . $jCount
                        ));
                        $colIdx++;
                    }

                    // Jurusan dropdown: INDIRECT pilih named range berdasarkan rombel di kolom I
                    $this->addDropdown(
                        $sheet, 'J3:J2000',
                        'INDIRECT("JLIST"&MATCH(I3,$K$1:$K$' . $rombelCount . ',0))'
                    );
                }

                // ── Komentar header ───────────────────────────────────────
                $sheet->getComment('A1')->getText()->createTextRun('NIS wajib diisi dan harus unik. Password siswa = NIS.');
                $sheet->getComment('D1')->getText()->createTextRun('Kosongkan untuk auto-generate dari NIS.' . "\n" . 'Format: {nis}@siswa.sch.id');
                $sheet->getComment('I1')->getText()->createTextRun(
                    'Pilih rombel dari dropdown.' . "\n"
                    . 'Hanya rombel tahun ajaran aktif yang tersedia.'
                );
                $sheet->getComment('J1')->getText()->createTextRun(
                    'Pilih jurusan dari dropdown (setelah memilih rombel).' . "\n"
                    . 'Jika rombel hanya 1 jurusan, kolom ini bisa dikosongkan (otomatis).' . "\n"
                    . 'Wajib diisi jika rombel memiliki lebih dari satu jurusan.'
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
class SiswaPanduanSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private \Illuminate\Support\Collection $rombelList, private mixed $tahunAjaran) {}

    public function title(): string { return 'Panduan'; }

    public function array(): array
    {
        $rows = [
            ['PANDUAN IMPORT DATA SISWA', '', '', ''],
            [''],
            ['KOLOM', 'KETERANGAN', 'NILAI YANG DITERIMA', 'WAJIB?'],
            ['NIS',           'Nomor Induk Siswa (harus unik). Dipakai sebagai password awal.', 'Angka / teks',                                  'Ya'],
            ['NISN',          'Nomor Induk Siswa Nasional',                                     'Angka / kosong',                                'Tidak'],
            ['Nama Lengkap',  'Nama lengkap siswa',                                             'Teks bebas',                                    'Ya'],
            ['Email',         'Kosongkan = auto-generate dari NIS. Format: {nis}@siswa.sch.id', 'Format email / kosong',                         'Tidak'],
            ['Jenis Kelamin', 'Jenis kelamin siswa',                                            'L atau P',                                      'Tidak'],
            ['Tempat Lahir',  'Kota/kabupaten tempat lahir',                                    'Teks bebas',                                    'Tidak'],
            ['Tanggal Lahir', 'Tanggal lahir siswa',                                            'Format: YYYY-MM-DD atau DD/MM/YYYY',             'Tidak'],
            ['Agama',         'Agama siswa',                                                    'Islam/Kristen/Katolik/Hindu/Buddha/Konghucu',   'Tidak'],
            ['Rombel',        'Nama kelas/rombel. Harus cocok persis dengan daftar di bawah.',  'Lihat daftar rombel di bawah',                  'Tidak'],
            ['Jurusan',       'Wajib jika rombel punya lebih dari 1 jurusan. Boleh kosong jika rombel hanya 1 jurusan (otomatis).', 'Lihat daftar jurusan per rombel di bawah', 'Kondisional'],
            [''],
            ['CATATAN PENTING', '', '', ''],
            ['', '• NIS yang sudah ada di database akan dilewati (tidak diimport ulang).', '', ''],
            ['', '• Jika email dikosongkan, akan dibuat otomatis: {NIS}@siswa.sch.id', '', ''],
            ['', '• Password awal siswa = NIS siswa.', '', ''],
            ['', '• Jika Rombel tidak diisi / tidak cocok, siswa diimport tanpa kelas.', '', ''],
            ['', '• Jika Rombel hanya punya 1 jurusan, kolom Jurusan bisa dikosongkan.', '', ''],
            [''],
        ];

        if ($this->rombelList->isNotEmpty()) {
            $taLabel = $this->tahunAjaran?->nama ?? '';
            $rows[] = ['DAFTAR ROMBEL & JURUSAN' . ($taLabel ? " — Tahun Ajaran: $taLabel" : ''), '', '', ''];
            $rows[] = ['', 'Nama Rombel', 'Jurusan yang Tersedia', 'Keterangan'];

            foreach ($this->rombelList as $r) {
                $jurusanList = $r->jurusanList;
                if ($jurusanList->isEmpty()) {
                    $rows[] = ['', $r->nama, '(tidak ada jurusan)', 'Kolom Jurusan boleh kosong'];
                } elseif ($jurusanList->count() === 1) {
                    $rows[] = ['', $r->nama, $jurusanList->first()->nama, 'Kolom Jurusan boleh kosong (otomatis)'];
                } else {
                    $first = true;
                    foreach ($jurusanList as $j) {
                        $rows[] = ['', $first ? $r->nama : '', $j->nama, $first ? 'Isi kolom Jurusan jika perlu' : ''];
                        $first  = false;
                    }
                }
            }
        } else {
            $rows[] = ['', 'Belum ada data rombel aktif. Tambahkan rombel terlebih dahulu.', '', ''];
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 32, 'B' => 36, 'C' => 36, 'D' => 36];
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

<?php

namespace App\Exports;

use App\Models\Guru;
use App\Models\Jurusan;
use App\Models\MataPelajaran;
use App\Models\Pembelajaran;
use App\Models\Rombel;
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

class PembelajaranTemplateExport implements WithMultipleSheets
{
    public function __construct(private ?int $rombelId = null) {}

    public function sheets(): array
    {
        $mapel   = MataPelajaran::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama'])->toArray();
        $guru    = Guru::with('user')->get()->sortBy(fn ($g) => $g->user?->name ?? '')->values()
                       ->map(fn ($g) => ['nama' => $g->user?->name ?? ''])->toArray();
        $jurusan = Jurusan::where('is_aktif', true)->orderBy('nama')->get(['id', 'nama'])->toArray();

        $existing    = [];
        $rombelNama  = null;
        if ($this->rombelId) {
            $rombel     = Rombel::find($this->rombelId);
            $rombelNama = $rombel?->nama;
            $existing   = Pembelajaran::with(['mataPelajaran', 'guru.user', 'jurusan'])
                ->where('rombel_id', $this->rombelId)->where('is_aktif', true)->get()
                ->map(fn ($p) => [
                    'mapel'   => $p->mataPelajaran?->nama ?? '',
                    'guru'    => $p->guru?->user?->name ?? '',
                    'jurusan' => $p->jurusan?->nama ?? '',
                ])->toArray();
        }

        return [
            new PembelajaranDataSheet($mapel, $guru, $jurusan, $existing, $rombelNama),
            new PembelajaranPanduanSheet(),
            new PembelajaranMapelHelperSheet($mapel),
            new PembelajaranGuruHelperSheet($guru),
            new PembelajaranJurusanHelperSheet($jurusan),
        ];
    }
}

/* ─── Sheet 1: Data ─────────────────────────────────────── */
class PembelajaranDataSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    public function __construct(
        private array  $mapelList,
        private array  $guruList,
        private array  $jurusanList,
        private array  $existing,
        private ?string $rombelNama,
    ) {}

    public function title(): string { return 'Data Pembelajaran'; }

    public function array(): array
    {
        $rows = [['Mata Pelajaran', 'Guru', 'Jurusan (opsional)']];

        if (!empty($this->existing)) {
            foreach ($this->existing as $row) {
                $rows[] = [$row['mapel'], $row['guru'], $row['jurusan']];
            }
        } else {
            $rows[] = ['', '', ''];
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 36, 'B' => 36, 'C' => 28];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $sheet->getRowDimension(1)->setRowHeight(28);
                $sheet->freezePane('A2');

                $sheet->getStyle('A1:C1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '3730A3']]],
                ]);

                // Warnai baris existing (pre-filled) agar berbeda dari baris kosong baru
                if (!empty($this->existing)) {
                    $lastRow = count($this->existing) + 1;
                    $sheet->getStyle("A2:C{$lastRow}")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EEF2FF']],
                        'font' => ['color' => ['rgb' => '4338CA']],
                    ]);
                }

                $mCount = count($this->mapelList);
                $gCount = count($this->guruList);
                $jCount = count($this->jurusanList);

                if ($mCount > 0) $this->addDropdown($sheet, 'A2:A2000', "MapelHelper!\$A\$1:\$A\${$mCount}");
                if ($gCount > 0) $this->addDropdown($sheet, 'B2:B2000', "GuruHelper!\$A\$1:\$A\${$gCount}");
                if ($jCount > 0) $this->addDropdown($sheet, 'C2:C2000', "JurusanHelper!\$A\$1:\$A\${$jCount}");

                if ($this->rombelNama) {
                    $sheet->getComment('A1')->getText()->createTextRun(
                        "Template untuk rombel: {$this->rombelNama}\n"
                        . "Baris biru = data sudah ada (boleh diubah/hapus).\n"
                        . "Tambah baris baru di bawahnya."
                    );
                }
            },
        ];
    }

    private function addDropdown(Worksheet $sheet, string $range, string $formula): void
    {
        $v = $sheet->getDataValidation($range);
        $v->setType(DataValidation::TYPE_LIST);
        $v->setErrorStyle(DataValidation::STYLE_WARNING);
        $v->setAllowBlank(true);
        $v->setShowDropDown(true);
        $v->setShowErrorMessage(true);
        $v->setErrorTitle('Nilai tidak valid');
        $v->setError('Pilih nilai dari daftar yang tersedia.');
        $v->setFormula1($formula);
    }
}

/* ─── Sheet 2: Panduan ──────────────────────────────────── */
class PembelajaranPanduanSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function title(): string { return 'Panduan'; }

    public function array(): array
    {
        return [
            ['PANDUAN IMPORT DATA PEMBELAJARAN', '', ''],
            [''],
            ['KOLOM', 'KETERANGAN', 'WAJIB?'],
            ['Mata Pelajaran', 'Pilih dari dropdown. Nama harus persis sama dengan data di sistem.', 'Ya'],
            ['Guru',           'Pilih dari dropdown. Nama harus persis sama dengan data di sistem.', 'Ya'],
            ['Jurusan (opsional)', 'Pilih dari dropdown jika pembelajaran hanya untuk jurusan tertentu. Kosongkan jika untuk semua.', 'Tidak'],
            [''],
            ['CATATAN', '', ''],
            ['• Kolom "Rombel" tidak perlu diisi di file ini — rombel dipilih saat upload di aplikasi.', '', ''],
            ['• Baris yang sudah berwarna biru = data yang sudah ada di sistem.', '', ''],
            ['• Anda boleh mengubah/menghapus baris tersebut atau menambah baris baru.', '', ''],
            ['• Import akan menambah atau memperbarui data, tidak menghapus data yang tidak ada di file.', '', ''],
        ];
    }

    public function columnWidths(): array { return ['A' => 40, 'B' => 70, 'C' => 10]; }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1E1B4B']]],
            3 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
            ],
            8 => ['font' => ['bold' => true, 'color' => ['rgb' => '1E1B4B']]],
        ];
    }
}

/* ─── Sheet helper tersembunyi ──────────────────────────── */
class PembelajaranMapelHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $list) {}
    public function title(): string { return 'MapelHelper'; }
    public function array(): array { return array_map(fn ($m) => [$m['nama']], $this->list); }
    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $e) {
            $e->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }];
    }
}

class PembelajaranGuruHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $list) {}
    public function title(): string { return 'GuruHelper'; }
    public function array(): array { return array_map(fn ($g) => [$g['nama']], $this->list); }
    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $e) {
            $e->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }];
    }
}

class PembelajaranJurusanHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $list) {}
    public function title(): string { return 'JurusanHelper'; }
    public function array(): array { return array_map(fn ($j) => [$j['nama']], $this->list); }
    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $e) {
            $e->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }];
    }
}

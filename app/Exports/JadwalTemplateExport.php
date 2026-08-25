<?php

namespace App\Exports;

use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
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

class JadwalTemplateExport implements WithMultipleSheets
{
    public function __construct(private ?int $rombelId = null) {}

    public function sheets(): array
    {
        $pengaturan = PengaturanSekolah::current();
        $slots      = collect($pengaturan->getJamSlots())->sortBy('jam_ke');
        $maxJp      = $slots->max('jam_ke') ?? 12;
        $hariAktif  = $pengaturan->hari_aktif ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        $existing    = [];
        $rombelNama  = null;
        $mapelNames  = [];
        $guruNames   = [];

        if ($this->rombelId) {
            $rombel     = Rombel::find($this->rombelId);
            $rombelNama = $rombel?->nama;

            $pembelajaran = Pembelajaran::with(['mataPelajaran', 'guru.user'])
                ->where('rombel_id', $this->rombelId)->where('is_aktif', true)->get();

            foreach ($pembelajaran as $p) {
                $mapel = $p->mataPelajaran?->nama ?? '';
                $guru  = $p->guru?->user?->name ?? '';
                if ($mapel && !in_array($mapel, $mapelNames)) $mapelNames[] = $mapel;
                if ($guru  && !in_array($guru,  $guruNames))  $guruNames[]  = $guru;
                $existing[] = ['mapel' => $mapel, 'guru' => $guru];
            }
            sort($mapelNames);
            sort($guruNames);
        }

        return [
            new JadwalDataSheet($hariAktif, $maxJp, $mapelNames, $guruNames, $existing, $rombelNama),
            new JadwalPanduanSheet($hariAktif, $maxJp),
            new JadwalMapelHelperSheet($mapelNames),
            new JadwalGuruHelperSheet($guruNames),
        ];
    }
}

/* ─── Sheet 1: Data ─────────────────────────────────────── */
class JadwalDataSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithEvents
{
    public function __construct(
        private array   $hariAktif,
        private int     $maxJp,
        private array   $mapelNames,
        private array   $guruNames,
        private array   $existing,
        private ?string $rombelNama,
    ) {}

    public function title(): string { return 'Data Jadwal'; }

    public function array(): array
    {
        $rows = [['Hari', 'JP', 'Mata Pelajaran', 'Guru']];
        if (!empty($this->existing)) {
            foreach ($this->existing as $row) {
                $rows[] = ['', '', $row['mapel'], $row['guru']];
            }
        } else {
            $rows[] = ['', '', '', ''];
        }
        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 12, 'B' => 6, 'C' => 36, 'D' => 36];
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

                $sheet->getStyle('A1:D1')->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '3730A3']]],
                ]);

                // Warnai baris pre-filled (Mapel + Guru sudah terisi)
                if (!empty($this->existing)) {
                    $lastRow = count($this->existing) + 1;
                    $sheet->getStyle("C2:D{$lastRow}")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EEF2FF']],
                        'font' => ['color' => ['rgb' => '4338CA']],
                    ]);
                }

                // Dropdown Hari (inline formula, max 7 nilai)
                $hariFormula = '"' . implode(',', $this->hariAktif) . '"';
                $this->addDropdown($sheet, 'A2:A2000', $hariFormula);

                // Dropdown JP (inline, 1-N)
                $jpValues    = implode(',', range(1, $this->maxJp));
                $this->addDropdown($sheet, 'B2:B2000', '"' . $jpValues . '"');

                // Dropdown Mapel + Guru dari helper sheet
                $mCount = count($this->mapelNames);
                $gCount = count($this->guruNames);
                if ($mCount > 0) $this->addDropdown($sheet, 'C2:C2000', "JadwalMapelHelper!\$A\$1:\$A\${$mCount}");
                if ($gCount > 0) $this->addDropdown($sheet, 'D2:D2000', "JadwalGuruHelper!\$A\$1:\$A\${$gCount}");

                if ($this->rombelNama) {
                    $sheet->getComment('C1')->getText()->createTextRun(
                        "Template untuk rombel: {$this->rombelNama}\n"
                        . "Kolom biru = pembelajaran sudah ada.\n"
                        . "Isi Hari dan JP untuk setiap baris."
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
class JadwalPanduanSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private array $hariAktif, private int $maxJp) {}
    public function title(): string { return 'Panduan'; }

    public function array(): array
    {
        return [
            ['PANDUAN IMPORT JADWAL PELAJARAN', '', ''],
            [''],
            ['KOLOM', 'KETERANGAN', 'WAJIB?'],
            ['Hari',           'Pilih dari dropdown: ' . implode(', ', $this->hariAktif), 'Ya'],
            ['JP',             'Jam ke berapa (1–' . $this->maxJp . '). Pilih dari dropdown.',           'Ya'],
            ['Mata Pelajaran', 'Pilih dari dropdown. Harus sesuai dengan Pembelajaran rombel ini.',      'Ya'],
            ['Guru',           'Pilih dari dropdown. Harus sesuai dengan Pembelajaran rombel ini.',      'Ya'],
            [''],
            ['CATATAN', '', ''],
            ['• Rombel dipilih saat upload di aplikasi — tidak perlu diisi di file.', '', ''],
            ['• Kombinasi Mapel + Guru harus terdaftar sebagai Pembelajaran untuk rombel tersebut.', '', ''],
            ['• Jika guru sudah terjadwal di hari+JP yang sama, baris tersebut akan dilewati.', '', ''],
            ['• Import tidak menghapus jadwal yang ada — hanya menambah/memperbarui.', '', ''],
        ];
    }

    public function columnWidths(): array { return ['A' => 20, 'B' => 75, 'C' => 10]; }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1E1B4B']]],
            3 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4338CA']],
            ],
            9 => ['font' => ['bold' => true, 'color' => ['rgb' => '1E1B4B']]],
        ];
    }
}

/* ─── Helper sheets tersembunyi ─────────────────────────── */
class JadwalMapelHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $list) {}
    public function title(): string { return 'JadwalMapelHelper'; }
    public function array(): array { return array_map(fn ($n) => [$n], $this->list); }
    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $e) {
            $e->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }];
    }
}

class JadwalGuruHelperSheet implements FromArray, WithTitle, WithEvents
{
    public function __construct(private array $list) {}
    public function title(): string { return 'JadwalGuruHelper'; }
    public function array(): array { return array_map(fn ($n) => [$n], $this->list); }
    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $e) {
            $e->sheet->getDelegate()->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }];
    }
}

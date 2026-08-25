<?php

namespace App\Exports;

use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SiswaExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithEvents
{
    public function __construct(private ?int $rombelId = null, private bool $templateOnly = false) {}

    public function collection()
    {
        if ($this->templateOnly) {
            return collect(); // template kosong — hanya header + dropdown
        }

        return Siswa::with(['user', 'rombel'])
            ->when($this->rombelId, fn ($q) => $q->where('rombel_id', $this->rombelId))
            ->orderBy('nis')
            ->get()
            ->map(fn ($s) => [
                'NIS'           => $s->nis,
                'NISN'          => $s->nisn ?? '',
                'Nama Lengkap'  => $s->user?->name ?? '',
                'Email'         => $s->user?->email ?? '',
                'Jenis Kelamin' => $s->user?->gender === 'L' ? 'Laki-laki' : ($s->user?->gender === 'P' ? 'Perempuan' : ''),
                'Tempat Lahir'  => $s->tempat_lahir ?? '',
                'Tanggal Lahir' => $s->user?->tanggal_lahir?->format('Y-m-d') ?? '',
                'Agama'         => $s->agama ?? '',
                'Rombel'        => $s->rombel?->nama ?? '',
                'Status'        => $s->status_siswa,
            ]);
    }

    public function headings(): array
    {
        return ['NIS', 'NISN', 'Nama Lengkap', 'Email', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Rombel', 'Status'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'E0E7FF']]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $spreadsheet = $event->sheet->getDelegate()->getParent();
                $mainSheet   = $event->sheet->getDelegate();

                $tahunAktif = TahunAjaran::aktif();
                $rombelList = Rombel::when($tahunAktif, fn ($q) => $q->where('tahun_ajaran_id', $tahunAktif->id))
                    ->orderBy('nama')
                    ->pluck('nama')
                    ->toArray();

                // Sheet tersembunyi sebagai sumber dropdown rombel
                if (!empty($rombelList)) {
                    $helper = new Worksheet($spreadsheet, '_Rombel');
                    $spreadsheet->addSheet($helper);
                    foreach ($rombelList as $i => $nama) {
                        $helper->setCellValue('A' . ($i + 1), $nama);
                    }
                    $helper->setSheetState(Worksheet::SHEETSTATE_HIDDEN);

                    $count = count($rombelList);
                    for ($row = 2; $row <= 500; $row++) {
                        $v = $mainSheet->getCell("I{$row}")->getDataValidation();
                        $v->setType(DataValidation::TYPE_LIST)
                            ->setErrorStyle(DataValidation::STYLE_STOP)
                            ->setAllowBlank(true)
                            ->setShowDropDown(false)
                            ->setShowErrorMessage(true)
                            ->setErrorTitle('Rombel tidak valid')
                            ->setError('Pilih rombel dari daftar dropdown.')
                            ->setFormula1("_Rombel!\$A\$1:\$A\${$count}");
                    }
                }

                // Dropdown statis — kolom E (Jenis Kelamin)
                for ($row = 2; $row <= 500; $row++) {
                    $v = $mainSheet->getCell("E{$row}")->getDataValidation();
                    $v->setType(DataValidation::TYPE_LIST)
                        ->setAllowBlank(true)->setShowDropDown(false)
                        ->setFormula1('"Laki-laki,Perempuan"');
                }

                // Dropdown statis — kolom H (Agama)
                for ($row = 2; $row <= 500; $row++) {
                    $v = $mainSheet->getCell("H{$row}")->getDataValidation();
                    $v->setType(DataValidation::TYPE_LIST)
                        ->setAllowBlank(true)->setShowDropDown(false)
                        ->setFormula1('"Islam,Kristen,Katolik,Hindu,Buddha,Khonghucu"');
                }

                // Dropdown statis — kolom J (Status) — hanya untuk export data, bukan template
                if (!$this->templateOnly) {
                    for ($row = 2; $row <= 500; $row++) {
                        $v = $mainSheet->getCell("J{$row}")->getDataValidation();
                        $v->setType(DataValidation::TYPE_LIST)
                            ->setAllowBlank(true)->setShowDropDown(false)
                            ->setFormula1('"Aktif,Tidak Aktif,Lulus,Pindah,Dikeluarkan"');
                    }
                }

                // Freeze baris header
                $mainSheet->freezePane('A2');
            },
        ];
    }
}

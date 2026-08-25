<?php

namespace App\Exports;

use App\Models\JurnalMengajar;
use App\Models\NilaiJurnal;
use App\Models\Pembelajaran;
use App\Models\Siswa;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NilaiJurnalExport implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected Pembelajaran $pembelajaran;
    protected array $rows;
    protected array $headings;
    protected int $capaianCount;

    public function __construct(Pembelajaran $pembelajaran)
    {
        $this->pembelajaran = $pembelajaran->load('mataPelajaran', 'rombel');
        $this->build();
    }

    private function build(): void
    {
        $jurnalIds = JurnalMengajar::where('pembelajaran_id', $this->pembelajaran->id)
            ->pluck('id');

        // All capaian across all journals for this pembelajaran
        $allCapaian = \DB::table('jurnal_capaian')
            ->join('capaian_pembelajaran', 'jurnal_capaian.capaian_pembelajaran_id', '=', 'capaian_pembelajaran.id')
            ->whereIn('jurnal_capaian.jurnal_mengajar_id', $jurnalIds)
            ->select('capaian_pembelajaran.id', 'capaian_pembelajaran.tingkat',
                     'capaian_pembelajaran.semester', 'capaian_pembelajaran.kode',
                     'capaian_pembelajaran.capaian')
            ->distinct()
            ->orderByRaw("CONCAT(tingkat, semester, LPAD(kode, 2, '0'))")
            ->get();

        // Build kode_lengkap for each capaian
        $capaianList = $allCapaian->map(fn($c) => [
            'id'          => $c->id,
            'kode_lengkap'=> $c->tingkat . $c->semester . str_pad($c->kode, 2, '0', STR_PAD_LEFT),
            'capaian'     => $c->capaian,
        ])->values()->all();

        $this->capaianCount = count($capaianList);

        // Siswa in rombel, filtered by jurusan if pembelajaran has one
        $siswaList = Siswa::where('rombel_id', $this->pembelajaran->rombel_id)
            ->where('status_siswa', 'Aktif')
            ->when($this->pembelajaran->jurusan_id, function ($q) {
                $q->where(function ($inner) {
                    $inner->where('jurusan_id', $this->pembelajaran->jurusan_id)
                          ->orWhereNull('jurusan_id');
                });
            })
            ->with('user')
            ->orderBy('id')
            ->get();

        // All nilai
        $nilaiRaw = NilaiJurnal::whereIn('jurnal_mengajar_id', $jurnalIds)
            ->get(['jurnal_mengajar_id', 'siswa_id', 'capaian_pembelajaran_id', 'nilai']);

        // jurnalCapaianMap[jurnal_id] = Set of capaian ids in that jurnal
        $jurnalCapaian = \DB::table('jurnal_capaian')
            ->whereIn('jurnal_mengajar_id', $jurnalIds)
            ->get(['jurnal_mengajar_id', 'capaian_pembelajaran_id']);

        $jurnalCapaianMap = [];
        foreach ($jurnalCapaian as $jc) {
            $jurnalCapaianMap[$jc->jurnal_mengajar_id][] = $jc->capaian_pembelajaran_id;
        }

        // nilaiMap[jurnal_id][siswa_id][capaian_id] = nilai
        $nilaiMap = [];
        foreach ($nilaiRaw as $n) {
            $nilaiMap[$n->jurnal_mengajar_id][$n->siswa_id][$n->capaian_pembelajaran_id] = (float) $n->nilai;
        }

        // Build headings
        $this->headings = ['No', 'NIS', 'Nama Siswa'];
        foreach ($capaianList as $cp) {
            $this->headings[] = $cp['kode_lengkap'];
        }
        $this->headings[] = 'Nilai Akhir (Rata-rata)';

        // Build rows
        $this->rows = [];
        $no = 1;
        foreach ($siswaList as $siswa) {
            $row = [$no++, $siswa->nis, $siswa->user->name ?? '-'];

            $capaianAvgs = [];
            foreach ($capaianList as $cp) {
                $values = [];
                foreach ($jurnalIds as $jurnalId) {
                    if (in_array($cp['id'], $jurnalCapaianMap[$jurnalId] ?? [])) {
                        $val = $nilaiMap[$jurnalId][$siswa->id][$cp['id']] ?? null;
                        if ($val !== null) {
                            $values[] = $val;
                        }
                    }
                }
                $avg = count($values) > 0 ? round(array_sum($values) / count($values), 2) : null;
                $capaianAvgs[] = $avg;
                $row[]         = $avg ?? '';
            }

            $finalValues = array_filter($capaianAvgs, fn($v) => $v !== null);
            $row[] = count($finalValues) > 0
                ? round(array_sum($finalValues) / count($finalValues), 2)
                : '';

            $this->rows[] = $row;
        }
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        $mapel  = $this->pembelajaran->mataPelajaran->nama ?? 'Nilai';
        $rombel = $this->pembelajaran->rombel->nama ?? '';
        return substr("$mapel $rombel", 0, 31); // Excel sheet name max 31 chars
    }

    public function styles(Worksheet $sheet): array
    {
        $lastCol  = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(3 + $this->capaianCount + 1);
        $lastRow  = count($this->rows) + 1;

        // Header row style
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '10B981']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Borders
        $sheet->getStyle("A1:{$lastCol}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D1D5DB']],
            ],
        ]);

        // Last column (Nilai Akhir) header
        $lastColIdx = 3 + $this->capaianCount + 1;
        $lastColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($lastColIdx);
        $sheet->getStyle("{$lastColLetter}1:{$lastColLetter}{$lastRow}")->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'ECFDF5']],
        ]);

        return [];
    }
}

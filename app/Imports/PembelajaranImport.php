<?php

namespace App\Imports;

use App\Models\Guru;
use App\Models\Jurusan;
use App\Models\MataPelajaran;
use App\Models\Pembelajaran;
use App\Models\TahunAjaran;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class PembelajaranImport implements ToCollection, SkipsEmptyRows, WithMultipleSheets
{
    public int   $imported = 0;
    public int   $skipped  = 0;
    public array $errors   = [];

    public function __construct(private int $rombelId) {}

    public function sheets(): array { return [0 => $this]; }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) return;

        $tahun = TahunAjaran::where('is_aktif', true)->first();

        // Build lookup maps
        $mapelMap = MataPelajaran::where('is_aktif', true)->get(['id', 'nama'])
            ->mapWithKeys(fn ($m) => [mb_strtolower(trim($m->nama)) => $m->id])->all();

        $guruMap = Guru::with('user')->get()
            ->mapWithKeys(fn ($g) => [mb_strtolower(trim($g->user?->name ?? '')) => $g->id])->all();

        $jurusanMap = Jurusan::where('is_aktif', true)->get(['id', 'nama'])
            ->mapWithKeys(fn ($j) => [mb_strtolower(trim($j->nama)) => $j->id])->all();

        // Detect header row
        $headerIdx = null;
        $colMap    = [];
        foreach ($rows as $i => $row) {
            $arr = array_values($row->toArray());
            $map = $this->buildColMap($arr);
            if (isset($map['mapel']) && count($map) >= 2) {
                $headerIdx = $i;
                $colMap    = $map;
                break;
            }
        }

        if ($headerIdx === null) {
            $this->errors[] = 'Header tidak ditemukan. Pastikan ada kolom "Mata Pelajaran".';
            return;
        }

        foreach ($rows->slice($headerIdx + 1) as $rowNum => $row) {
            $arr       = array_values($row->toArray());
            $mapelNama = mb_strtolower(trim((string) ($arr[$colMap['mapel']]    ?? '')));
            $guruNama  = mb_strtolower(trim((string) ($arr[$colMap['guru']]     ?? '')));
            $jurNama   = mb_strtolower(trim((string) ($arr[$colMap['jurusan']]  ?? '')));

            if (!$mapelNama || !$guruNama) { $this->skipped++; continue; }

            $mapelId = $mapelMap[$mapelNama] ?? null;
            if (!$mapelId) {
                $this->errors[] = "Mapel tidak ditemukan: " . ($arr[$colMap['mapel']] ?? '');
                $this->skipped++;
                continue;
            }

            $guruId = $guruMap[$guruNama] ?? null;
            if (!$guruId) {
                $this->errors[] = "Guru tidak ditemukan: " . ($arr[$colMap['guru']] ?? '');
                $this->skipped++;
                continue;
            }

            $jurusanId = $jurNama ? ($jurusanMap[$jurNama] ?? null) : null;

            try {
                Pembelajaran::updateOrCreate(
                    [
                        'rombel_id'        => $this->rombelId,
                        'mata_pelajaran_id' => $mapelId,
                        'guru_id'          => $guruId,
                        'tahun_ajaran_id'  => $tahun?->id,
                    ],
                    ['jurusan_id' => $jurusanId, 'is_aktif' => true]
                );
                $this->imported++;
            } catch (\Throwable $e) {
                $this->errors[] = "Gagal import baris " . ($headerIdx + $rowNum + 2) . ": " . $e->getMessage();
                $this->skipped++;
            }
        }
    }

    private function buildColMap(array $arr): array
    {
        $aliases = [
            'mapel'   => ['mata pelajaran', 'mata_pelajaran', 'mapel', 'pelajaran'],
            'guru'    => ['guru', 'nama guru', 'pengajar'],
            'jurusan' => ['jurusan', 'jurusan (opsional)', 'konsentrasi'],
        ];
        $map = [];
        foreach ($arr as $idx => $cell) {
            $norm = mb_strtolower(trim((string) $cell));
            if ($norm === '') continue;
            foreach ($aliases as $key => $list) {
                if (!isset($map[$key]) && in_array($norm, $list, true)) {
                    $map[$key] = $idx;
                }
            }
        }
        return $map;
    }
}

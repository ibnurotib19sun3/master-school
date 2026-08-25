<?php

namespace App\Imports;

use App\Models\Jadwal;
use App\Models\Pembelajaran;
use App\Models\PengaturanSekolah;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class JadwalImport implements ToCollection, SkipsEmptyRows, WithMultipleSheets
{
    public int   $imported = 0;
    public int   $skipped  = 0;
    public array $errors   = [];

    private const HARI_VALID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

    public function __construct(private int $rombelId) {}

    public function sheets(): array { return [0 => $this]; }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) return;

        $pengaturan = PengaturanSekolah::current();
        $slots      = collect($pengaturan->getJamSlots())->keyBy('jam_ke');

        // Detect header
        $headerIdx = null;
        $colMap    = [];
        foreach ($rows as $i => $row) {
            $arr = array_values($row->toArray());
            $map = $this->buildColMap($arr);
            if (isset($map['hari'], $map['jp'], $map['mapel'], $map['guru'])) {
                $headerIdx = $i;
                $colMap    = $map;
                break;
            }
        }

        if ($headerIdx === null) {
            $this->errors[] = 'Header tidak ditemukan. Pastikan ada kolom Hari, JP, Mata Pelajaran, Guru.';
            return;
        }

        foreach ($rows->slice($headerIdx + 1) as $rowNum => $row) {
            $arr      = array_values($row->toArray());
            $hari     = trim((string) ($arr[$colMap['hari']]  ?? ''));
            $jpRaw    = trim((string) ($arr[$colMap['jp']]    ?? ''));
            $mapelRaw = trim((string) ($arr[$colMap['mapel']] ?? ''));
            $guruRaw  = trim((string) ($arr[$colMap['guru']]  ?? ''));

            if (!$hari || !$jpRaw || !$mapelRaw || !$guruRaw) { $this->skipped++; continue; }

            if (!in_array($hari, self::HARI_VALID)) {
                $this->errors[] = "Hari tidak valid: {$hari}";
                $this->skipped++;
                continue;
            }

            $jamKe = (int) $jpRaw;
            $slot  = $slots->get($jamKe);
            if (!$slot) {
                $this->errors[] = "JP tidak valid: {$jamKe}";
                $this->skipped++;
                continue;
            }

            $pembelajaran = Pembelajaran::whereHas('mataPelajaran', fn ($q) => $q->whereRaw('LOWER(nama) = ?', [mb_strtolower($mapelRaw)]))
                ->whereHas('guru.user', fn ($q) => $q->whereRaw('LOWER(name) = ?', [mb_strtolower($guruRaw)]))
                ->where('rombel_id', $this->rombelId)->where('is_aktif', true)->first();

            if (!$pembelajaran) {
                $this->errors[] = "Pembelajaran tidak ditemukan: {$mapelRaw} / {$guruRaw}";
                $this->skipped++;
                continue;
            }

            $conflict = Jadwal::where('hari', $hari)->where('jam_ke', $jamKe)->where('is_aktif', true)
                ->whereHas('pembelajaran', fn ($q) => $q->where('guru_id', $pembelajaran->guru_id))
                ->where('pembelajaran_id', '!=', $pembelajaran->id)->exists();

            if ($conflict) {
                $this->errors[] = "Konflik: {$guruRaw} sudah terjadwal {$hari} JP {$jamKe}";
                $this->skipped++;
                continue;
            }

            try {
                Jadwal::updateOrCreate(
                    ['pembelajaran_id' => $pembelajaran->id, 'hari' => $hari, 'jam_ke' => $jamKe],
                    ['jam_mulai' => $slot['jam_mulai'], 'jam_selesai' => $slot['jam_selesai'], 'is_aktif' => true]
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
            'hari'  => ['hari'],
            'jp'    => ['jp', 'jam ke', 'jam_ke', 'jam'],
            'mapel' => ['mata pelajaran', 'mata_pelajaran', 'mapel', 'pelajaran'],
            'guru'  => ['guru', 'nama guru', 'pengajar'],
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

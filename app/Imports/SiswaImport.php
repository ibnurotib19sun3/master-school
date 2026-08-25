<?php

namespace App\Imports;

use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SiswaImport implements ToCollection, SkipsEmptyRows, WithMultipleSheets
{
    public int $imported = 0;
    public int $skipped  = 0;
    public int $duplikat = 0;
    public array $errors = [];

    private const EMAIL_DOMAIN = 'siswa.sch.id';

    private const ALIASES = [
        'nis'           => ['nis', 'no_nis', 'no nis', 'nomor induk', 'nomor_induk', 'no induk', 'no.induk', 'no. induk'],
        'nama_lengkap'  => ['nama lengkap', 'nama_lengkap', 'nama', 'name', 'nama siswa', 'nama_siswa'],
        'nisn'          => ['nisn', 'no nisn', 'no_nisn'],
        'email'         => ['email'],
        'jenis_kelamin' => ['jenis kelamin', 'jenis_kelamin', 'gender', 'kelamin', 'l/p', 'l_p'],
        'tempat_lahir'  => ['tempat lahir', 'tempat_lahir', 'tempat', 'kota lahir'],
        'tanggal_lahir' => ['tanggal lahir', 'tanggal_lahir', 'tgl lahir', 'tgl_lahir', 'tanggal'],
        'agama'         => ['agama'],
        'rombel'        => ['rombel', 'kelas', 'class'],
        'jurusan'       => ['jurusan', 'nama jurusan', 'jurusan_siswa', 'program keahlian'],
    ];

    public function __construct(
        private ?int $rombelIdOverride  = null,
        private ?int $jurusanIdOverride = null,
    ) {}

    public function sheets(): array
    {
        return [0 => $this]; // selalu baca sheet pertama (Data Siswa), bukan active sheet
    }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) return;

        // ── Detect header row ──────────────────────────────────────────
        $headerIdx = null;
        $colMap    = [];

        foreach ($rows as $i => $row) {
            $arr   = array_values($row->toArray());
            $found = $this->buildColMap($arr);
            if (isset($found['nis']) && isset($found['nama_lengkap'])) {
                $headerIdx = $i;
                $colMap    = $found;
                break;
            }
        }

        if ($headerIdx === null) {
            $sample = collect($rows->first()->toArray())->filter()->values()->implode(', ');
            throw new \Exception(
                'Baris header tidak ditemukan. Pastikan ada baris yang berisi "NIS" dan "Nama Lengkap". '
                . 'Baris pertama yang terbaca: [' . $sample . '].'
            );
        }

        // ── Load rombel map: lowercase nama → id, with jurusan ────────
        $tahunAjaran    = TahunAjaran::aktif();
        $rombelRows     = Rombel::with('jurusanList')
            ->when($tahunAjaran, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaran->id))
            ->get();
        $rombelMap      = $rombelRows->mapWithKeys(fn ($r) => [strtolower(trim($r->nama)) => $r->id])->all();
        $rombelById     = $rombelRows->keyBy('id'); // for jurusan lookup

        // ── Process data rows ──────────────────────────────────────────
        foreach ($rows->slice($headerIdx + 1) as $rowNum => $row) {
            $arr  = array_values($row->toArray());
            $nis  = trim((string) ($arr[$colMap['nis']] ?? ''));
            $nama = trim((string) ($arr[$colMap['nama_lengkap']] ?? ''));

            if (!$nis || !$nama) {
                $this->skipped++;
                continue;
            }

            if (Siswa::where('nis', $nis)->exists()) {
                $this->duplikat++;
                $this->errors[] = "Baris " . ($headerIdx + $rowNum + 2) . " (NIS $nis): sudah ada di database, dilewati.";
                continue;
            }

            // ── Email: generate dari NIS jika kosong ──────────────────
            $email = trim((string) ($arr[$colMap['email'] ?? -1] ?? ''));
            if (!$email) {
                $email = $nis . '@' . self::EMAIL_DOMAIN;
            }
            if (User::where('email', $email)->exists()) {
                $email = $nis . '_' . time() . '@' . self::EMAIL_DOMAIN;
            }

            // ── Rombel ────────────────────────────────────────────────
            if ($this->rombelIdOverride) {
                $rombelId = $this->rombelIdOverride;
            } else {
                $rombelId  = null;
                $rombelVal = trim((string) ($arr[$colMap['rombel'] ?? -1] ?? ''));
                if ($rombelVal !== '') {
                    $rombelId = $rombelMap[strtolower($rombelVal)] ?? null;
                }
            }

            // ── Jurusan: override dari UI → auto 1 jurusan → lookup nama ──
            if ($this->jurusanIdOverride !== null) {
                $jurusanId = $this->jurusanIdOverride;
            } else {
                $jurusanId = null;
                if ($rombelId) {
                    $rombelObj   = $rombelById->get($rombelId);
                    $jurusanList = $rombelObj?->jurusanList ?? collect();
                    if ($jurusanList->count() === 1) {
                        $jurusanId = $jurusanList->first()->id;
                    } elseif ($jurusanList->count() > 1) {
                        $jurusanVal = trim((string) ($arr[$colMap['jurusan'] ?? -1] ?? ''));
                        if ($jurusanVal !== '') {
                            $found     = $jurusanList->first(
                                fn ($j) => strtolower(trim($j->nama)) === strtolower($jurusanVal)
                            );
                            $jurusanId = $found?->id;
                        }
                    }
                }
            }

            // ── Gender ────────────────────────────────────────────────
            $gender = match (strtolower(trim((string) ($arr[$colMap['jenis_kelamin'] ?? -1] ?? '')))) {
                'l', 'laki-laki', 'laki', 'male' => 'L',
                'p', 'perempuan', 'female'        => 'P',
                default                           => null,
            };

            // ── Agama ─────────────────────────────────────────────────
            $agamaValid = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
            $agamaRaw   = trim((string) ($arr[$colMap['agama'] ?? -1] ?? ''));
            $agama      = in_array($agamaRaw, $agamaValid) ? $agamaRaw : 'Islam';

            $tanggalLahir = $this->parseDate($arr[$colMap['tanggal_lahir'] ?? -1] ?? null);

            try {
                DB::transaction(function () use (
                    $arr, $colMap, $nis, $nama, $email, $gender, $agama,
                    $rombelId, $jurusanId, $tanggalLahir, $tahunAjaran
                ) {
                    $user = User::create([
                        'name'          => $nama,
                        'email'         => $email,
                        'password'      => Hash::make($nis),
                        'gender'        => $gender,
                        'tanggal_lahir' => $tanggalLahir,
                        'is_active'     => true,
                    ]);
                    $user->assignRole('siswa');

                    Siswa::create([
                        'user_id'         => $user->id,
                        'nis'             => $nis,
                        'nisn'            => trim((string) ($arr[$colMap['nisn'] ?? -1] ?? '')) ?: null,
                        'tempat_lahir'    => trim((string) ($arr[$colMap['tempat_lahir'] ?? -1] ?? '')) ?: null,
                        'agama'           => $agama,
                        'rombel_id'       => $rombelId,
                        'jurusan_id'      => $jurusanId,
                        'tahun_ajaran_id' => $tahunAjaran?->id,
                        'status_siswa'    => 'Aktif',
                        'tanggal_masuk'   => now()->toDateString(),
                    ]);
                });

                $this->imported++;
            } catch (\Throwable $e) {
                $this->skipped++;
                $this->errors[] = "Gagal import \"$nama\" (NIS $nis): " . $e->getMessage();
            }
        }
    }

    private function buildColMap(array $rowValues): array
    {
        $map = [];
        foreach ($rowValues as $idx => $cell) {
            $norm = strtolower(trim((string) $cell));
            if ($norm === '') continue;
            foreach (self::ALIASES as $internal => $aliases) {
                if (!isset($map[$internal]) && in_array($norm, $aliases, true)) {
                    $map[$internal] = $idx;
                }
            }
        }
        return $map;
    }

    private function parseDate(mixed $value): ?string
    {
        if ($value === null || $value === '') return null;

        if (is_numeric($value) && $value > 1000) {
            try {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $value)
                    ->format('Y-m-d');
            } catch (\Throwable) {}
        }

        $str = trim((string) $value);
        foreach (['d/m/Y', 'd-m-Y', 'Y-m-d', 'Y/m/d', 'd/m/y', 'd-m-y'] as $fmt) {
            $dt = \DateTime::createFromFormat($fmt, $str);
            if ($dt && $dt->format($fmt) === $str) return $dt->format('Y-m-d');
        }

        return $str ?: null;
    }
}

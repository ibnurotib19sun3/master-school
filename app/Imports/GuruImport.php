<?php

namespace App\Imports;

use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class GuruImport implements ToCollection, SkipsEmptyRows, WithMultipleSheets
{
    public int $imported = 0;
    public int $skipped  = 0;
    public int $duplikat = 0;
    public array $errors = [];

    private const EMAIL_DOMAIN = 'apikmas-djurnal.id';
    private const DEFAULT_PASSWORD = 'apikmasdjurnal';

    private const STATUS_VALID = ['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer'];

    private const JABATAN_MAP = [
        'Kepala Sekolah'            => 'kepala_sekolah',
        'Wakasek Kurikulum'         => 'wakasek_kurikulum',
        'Wakasek Kesiswaan'         => 'wakasek_kesiswaan',
        'Kepala Tata Usaha'         => 'kepala_tatausaha',
        'Guru Piket'                => 'guru_piket',
        'Pokja Kurikulum'           => 'pokja_kurikulum',
        'Pokja Kesiswaan'           => 'pokja_kesiswaan',
        'Pokja Sarpras'             => 'pokja_sarpras',
        'Pokja Humas'               => 'pokja_humas',
    ];

    private const ALIASES = [
        'nama'                => ['nama', 'nama lengkap', 'nama_lengkap', 'name', 'nama guru'],
        'email'               => ['email'],
        'nip'                 => ['nip', 'no nip', 'nomor induk pegawai'],
        'nuptk'               => ['nuptk'],
        'gelar_depan'         => ['gelar depan', 'gelar_depan', 'gelar awal'],
        'gelar_belakang'      => ['gelar belakang', 'gelar_belakang', 'gelar akhir'],
        'gender'              => ['gender', 'jenis kelamin', 'jenis_kelamin', 'l/p', 'gender (l/p)'],
        'status_kepegawaian'  => ['status kepegawaian', 'status_kepegawaian', 'status'],
        'pendidikan_terakhir' => ['pendidikan terakhir', 'pendidikan_terakhir', 'pendidikan'],
        'bidang_studi'        => ['bidang studi', 'bidang_studi', 'mata pelajaran', 'mapel', 'bidang studi (id)'],
        'jabatan'             => ['jabatan', 'jabatan struktural'],
        'tanggal_masuk'       => ['tanggal masuk', 'tanggal_masuk', 'tgl masuk', 'tmt', 'tanggal masuk (yyyy-mm-dd)'],
        'nomor_wa'            => ['nomor wa', 'nomor_wa', 'wa', 'whatsapp', 'no wa', 'no hp'],
        'password'            => ['password', 'kata sandi'],
    ];

    public function sheets(): array
    {
        return [0 => $this]; // selalu baca sheet pertama (Data Guru), bukan active sheet
    }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) return;

        // ── Detect header row ───────────────────────────────────────
        $headerIdx = null;
        $colMap    = [];

        foreach ($rows as $i => $row) {
            $arr   = array_values($row->toArray());
            $found = $this->buildColMap($arr);
            if (isset($found['nama']) && count($found) >= 3) {
                $headerIdx = $i;
                $colMap    = $found;
                break;
            }
        }

        if ($headerIdx === null) {
            throw new \Exception('Header tidak ditemukan. Pastikan ada kolom "Nama" di baris header.');
        }

        // ── Load mata pelajaran: lowercase nama → id, dan id string → id ─
        $mapelByName = MataPelajaran::get(['id', 'nama'])
            ->mapWithKeys(fn ($m) => [strtolower(trim($m->nama)) => $m->id])
            ->all();
        $mapelById   = MataPelajaran::pluck('id')
            ->mapWithKeys(fn ($id) => [(string) $id => $id])
            ->all();
        $mapelValid  = $mapelByName + $mapelById; // nama lookup diutamakan

        // ── Process data rows ────────────────────────────────────────
        foreach ($rows->slice($headerIdx + 1) as $rowNum => $row) {
            $arr  = array_values($row->toArray());
            $nama = trim((string) ($arr[$colMap['nama']] ?? ''));

            if (!$nama) {
                $this->skipped++;
                continue;
            }

            $nip   = $this->str($arr, $colMap, 'nip') ?: null;
            $nuptk = $this->str($arr, $colMap, 'nuptk') ?: null;

            // Skip duplikat NIP/NUPTK
            if ($nip && Guru::where('nip', $nip)->exists()) {
                $this->duplikat++;
                $this->errors[] = "Baris " . ($headerIdx + $rowNum + 2) . " (NIP $nip): sudah ada di database, dilewati.";
                continue;
            }
            if ($nuptk && Guru::where('nuptk', $nuptk)->exists()) {
                $this->duplikat++;
                $this->errors[] = "Baris " . ($headerIdx + $rowNum + 2) . " (NUPTK $nuptk): sudah ada di database, dilewati.";
                continue;
            }

            // ── Email: generate jika kosong ─────────────────────────
            $email = $this->str($arr, $colMap, 'email') ?: null;
            if (!$email) {
                $email = $this->generateEmail($nama);
            }
            // Pastikan unik
            if (User::where('email', $email)->exists()) {
                $email = $this->generateEmail($nama, true);
            }

            // ── Password ────────────────────────────────────────────
            $password = $this->str($arr, $colMap, 'password') ?: self::DEFAULT_PASSWORD;

            // ── Gender ──────────────────────────────────────────────
            $gender = match (strtolower($this->str($arr, $colMap, 'gender'))) {
                'l', 'laki-laki', 'laki', 'male' => 'L',
                'p', 'perempuan', 'female'        => 'P',
                default                           => null,
            };

            // ── Status kepegawaian ──────────────────────────────────
            $statusRaw = $this->str($arr, $colMap, 'status_kepegawaian');
            $status    = in_array($statusRaw, self::STATUS_VALID) ? $statusRaw : 'GTY';

            // ── Pendidikan ──────────────────────────────────────────
            $pendidikan = $this->str($arr, $colMap, 'pendidikan_terakhir') ?: null;

            // ── Bidang studi: comma-separated names → array of IDs ──
            $bidangRaw   = $this->str($arr, $colMap, 'bidang_studi');
            $bidangStudi = [];
            if ($bidangRaw) {
                foreach (explode(',', $bidangRaw) as $item) {
                    $clean = strtolower(trim($item));
                    if (isset($mapelValid[$clean])) {
                        $bidangStudi[] = $mapelValid[$clean]; // ID integer
                    }
                }
                $bidangStudi = array_values(array_unique($bidangStudi));
            }

            // ── Jabatan: comma-separated → array of strings ─────────
            $jabatanRaw = $this->str($arr, $colMap, 'jabatan');
            $jabatan    = [];
            if ($jabatanRaw) {
                foreach (explode(',', $jabatanRaw) as $item) {
                    $clean = trim($item);
                    if ($clean) $jabatan[] = $clean;
                }
                $jabatan = array_unique($jabatan);
            }

            // ── Roles dari jabatan ───────────────────────────────────
            $roles = ['guru'];
            foreach ($jabatan as $j) {
                if (isset(self::JABATAN_MAP[$j])) {
                    $roles[] = self::JABATAN_MAP[$j];
                }
            }
            $roles = array_unique($roles);

            // ── Tanggal masuk ────────────────────────────────────────
            $tanggalMasuk = $this->parseDate($arr[$colMap['tanggal_masuk'] ?? -1] ?? null);

            // ── Nomor WA ─────────────────────────────────────────────
            $nomorWa = $this->str($arr, $colMap, 'nomor_wa') ?: null;
            if ($nomorWa && Guru::where('nomor_wa', $nomorWa)->exists()) {
                $nomorWa = null;
            }

            try {
                DB::transaction(function () use (
                    $nama, $email, $password, $gender, $roles,
                    $nip, $nuptk, $status, $pendidikan, $bidangStudi, $jabatan,
                    $tanggalMasuk, $nomorWa,
                    $arr, $colMap
                ) {
                    $user = User::create([
                        'name'      => $nama,
                        'email'     => $email,
                        'password'  => Hash::make($password),
                        'gender'    => $gender,
                        'is_active' => true,
                    ]);
                    $user->syncRoles($roles);

                    Guru::create([
                        'user_id'             => $user->id,
                        'nip'                 => $nip,
                        'nuptk'               => $nuptk,
                        'gelar_depan'         => $this->str($arr, $colMap, 'gelar_depan') ?: null,
                        'gelar_belakang'      => $this->str($arr, $colMap, 'gelar_belakang') ?: null,
                        'status_kepegawaian'  => $status,
                        'pendidikan_terakhir' => $pendidikan,
                        'bidang_studi'        => $bidangStudi,
                        'jabatan'             => $jabatan,
                        'tanggal_masuk'       => $tanggalMasuk,
                        'nomor_wa'            => $nomorWa,
                    ]);
                });

                $this->imported++;
            } catch (\Throwable $e) {
                $this->skipped++;
                $this->errors[] = "Gagal import \"$nama\": " . $e->getMessage();
            }
        }
    }

    // ── Helpers ────────────────────────────────────────────────────

    private function str(array $arr, array $colMap, string $key): string
    {
        $idx = $colMap[$key] ?? -1;
        return trim((string) ($arr[$idx] ?? ''));
    }

    private function generateEmail(string $nama, bool $withSuffix = false): string
    {
        $clean = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $nama));
        $parts = array_filter(explode(' ', $clean));
        $prefix = implode('.', $parts);
        if (!$prefix) $prefix = 'guru';

        $base  = "{$prefix}@" . self::EMAIL_DOMAIN;
        if (!$withSuffix || !User::where('email', $base)->exists()) {
            return $base;
        }

        $i = 2;
        while (User::where('email', "{$prefix}{$i}@" . self::EMAIL_DOMAIN)->exists()) {
            $i++;
        }
        return "{$prefix}{$i}@" . self::EMAIL_DOMAIN;
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

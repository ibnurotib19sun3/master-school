<?php

namespace App\Imports;

use App\Models\Tatausaha;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class TatausahaImport implements ToCollection, SkipsEmptyRows, WithMultipleSheets
{
    public int $imported = 0;
    public int $skipped  = 0;
    public int $duplikat = 0;
    public array $errors = [];

    private const EMAIL_DOMAIN = 'apikmas-djurnal.id';
    private const DEFAULT_PASSWORD = 'apikmasdjurnal';

    private const JABATAN_VALID = ['Tatausaha', 'Keuangan', 'Operator', 'Kebersihan', 'Keamanan', 'Penjaga Kantin', 'Toolman'];
    private const STATUS_VALID  = ['PNS', 'PPPK', 'PTY', 'Honor', 'PTT', 'Kontrak'];

    private const ALIASES = [
        'nama'                => ['nama', 'nama lengkap', 'nama_lengkap', 'name'],
        'email'               => ['email'],
        'nip'                 => ['nip', 'nipy', 'nip/nipy', 'no nip', 'nomor induk pegawai'],
        'gelar_depan'         => ['gelar depan', 'gelar_depan', 'gelar awal'],
        'gelar_belakang'      => ['gelar belakang', 'gelar_belakang', 'gelar akhir'],
        'gender'              => ['gender', 'jenis kelamin', 'jenis_kelamin', 'l/p', 'gender (l/p)'],
        'jabatan'             => ['jabatan'],
        'status_kepegawaian'  => ['status kepegawaian', 'status_kepegawaian', 'status'],
        'pendidikan_terakhir' => ['pendidikan terakhir', 'pendidikan_terakhir', 'pendidikan'],
        'tanggal_masuk'       => ['tanggal masuk', 'tanggal_masuk', 'tgl masuk', 'tmt', 'tanggal masuk (yyyy-mm-dd)'],
        'nomor_wa'            => ['nomor wa', 'nomor_wa', 'wa', 'whatsapp', 'no wa', 'no hp'],
        'password'            => ['password', 'kata sandi'],
    ];

    public function sheets(): array
    {
        return [0 => $this]; // selalu baca sheet pertama (Data Tata Usaha)
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

        foreach ($rows->slice($headerIdx + 1) as $rowNum => $row) {
            $arr  = array_values($row->toArray());
            $nama = trim((string) ($arr[$colMap['nama']] ?? ''));

            if (!$nama) {
                $this->skipped++;
                continue;
            }

            $nip = $this->str($arr, $colMap, 'nip') ?: null;

            // Skip duplikat NIP/NIPY
            if ($nip && Tatausaha::where('nip', $nip)->exists()) {
                $this->duplikat++;
                $this->errors[] = "Baris " . ($headerIdx + $rowNum + 2) . " (NIP/NIPY $nip): sudah ada di database, dilewati.";
                continue;
            }

            // ── Email: generate jika kosong ─────────────────────────
            $email = $this->str($arr, $colMap, 'email') ?: null;
            if (!$email) {
                $email = $this->generateEmail($nama);
            }
            if (User::where('email', $email)->exists()) {
                $email = $this->generateEmail($nama, true);
            }

            $password = $this->str($arr, $colMap, 'password') ?: self::DEFAULT_PASSWORD;

            $gender = match (strtolower($this->str($arr, $colMap, 'gender'))) {
                'l', 'laki-laki', 'laki', 'male' => 'L',
                'p', 'perempuan', 'female'        => 'P',
                default                           => null,
            };

            $jabatanRaw = $this->str($arr, $colMap, 'jabatan');
            $jabatan    = in_array($jabatanRaw, self::JABATAN_VALID, true) ? $jabatanRaw : 'Tatausaha';

            $statusRaw = $this->str($arr, $colMap, 'status_kepegawaian');
            $status    = in_array($statusRaw, self::STATUS_VALID, true) ? $statusRaw : null;

            $pendidikan = $this->str($arr, $colMap, 'pendidikan_terakhir') ?: null;

            $tanggalMasuk = $this->parseDate($arr[$colMap['tanggal_masuk'] ?? -1] ?? null);

            $nomorWa = $this->str($arr, $colMap, 'nomor_wa') ?: null;
            if ($nomorWa && Tatausaha::where('nomor_wa', $nomorWa)->exists()) {
                $nomorWa = null;
            }

            try {
                DB::transaction(function () use (
                    $nama, $email, $password, $gender,
                    $nip, $jabatan, $status, $pendidikan,
                    $tanggalMasuk, $nomorWa, $arr, $colMap
                ) {
                    $user = User::create([
                        'name'      => $nama,
                        'email'     => $email,
                        'password'  => Hash::make($password),
                        'gender'    => $gender,
                        'is_active' => true,
                    ]);
                    $user->assignRole('tatausaha');

                    Tatausaha::create([
                        'user_id'             => $user->id,
                        'nip'                 => $nip,
                        'gelar_depan'         => $this->str($arr, $colMap, 'gelar_depan') ?: null,
                        'gelar_belakang'      => $this->str($arr, $colMap, 'gelar_belakang') ?: null,
                        'jabatan'             => $jabatan,
                        'status_kepegawaian'  => $status,
                        'pendidikan_terakhir' => $pendidikan,
                        'tanggal_masuk'       => $tanggalMasuk,
                        'nomor_wa'            => $nomorWa,
                        'is_aktif'            => true,
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
        if (!$prefix) $prefix = 'tatausaha';

        $base = "{$prefix}@" . self::EMAIL_DOMAIN;
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

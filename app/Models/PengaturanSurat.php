<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class PengaturanSurat extends Model
{
    protected $table = 'pengaturan_surat';

    protected $fillable = [
        'nama_instansi', 'sub_nama', 'yayasan_dinas', 'alamat_kop', 'telepon_kop',
        'website_kop', 'email_kop', 'npsn_kop', 'logo_path',
        'separator', 'format_bagian', 'prefix_kode', 'nomor_awal_surat', 'nomor_awal_surat_id',
    ];

    protected $casts = [
        'format_bagian'       => 'array',
        'nomor_awal_surat'    => 'integer',
        'nomor_awal_surat_id' => 'integer',
    ];

    public static function current(): self
    {
        return static::first() ?? static::create([
            'separator'     => '/',
            'format_bagian' => ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'],
        ]);
    }

    /**
     * Ekstrak nomor urut (angka) dari string nomor surat.
     * Mengabaikan tahun 4 digit dan mencocokkan indeks bagian 'seq' jika memungkinkan.
     */
    public function extractSeqFromNomor(?string $nomorSurat): ?int
    {
        if (empty($nomorSurat)) {
            return null;
        }

        $nomorSurat = trim($nomorSurat);
        $sep = $this->separator ?: '/';
        $bagian = $this->format_bagian ?? ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'];
        $seqIdx = array_search('seq', $bagian, true);

        // 1. Coba cocokkan posisi seq berdasarkan konfigurasi format_bagian
        $tokens = explode($sep, $nomorSurat);
        if ($seqIdx !== false && isset($tokens[$seqIdx])) {
            $candidate = trim($tokens[$seqIdx]);
            if (preg_match('/^(\d{1,5})$/', $candidate, $m)) {
                return (int) $m[1];
            }
        }

        // 2. Jika pemisah berbeda atau urutan berbeda, cari token angka yang bukan tahun & bukan prefix
        $currentYear = (int) now()->year;
        $prefix = (string) ($this->prefix_kode ?? '');
        foreach ($tokens as $t) {
            $candidate = trim($t);
            if ($prefix !== '' && $candidate === $prefix) {
                continue;
            }
            if (preg_match('/^(\d{1,5})$/', $candidate, $m)) {
                $num = (int) $m[1];
                if ($num >= ($currentYear - 2) && $num <= ($currentYear + 2)) {
                    continue;
                }
                return $num;
            }
        }

        // 3. Regex fallback global mencari angka yang bukan tahun
        if (preg_match_all('/\b(\d{1,5})\b/', $nomorSurat, $matches)) {
            foreach ($matches[1] as $numStr) {
                if ($prefix !== '' && $numStr === $prefix) {
                    continue;
                }
                $num = (int) $numStr;
                if ($num >= ($currentYear - 2) && $num <= ($currentYear + 2)) {
                    continue;
                }
                return $num;
            }
        }

        return null;
    }

    /**
     * Hitung nomor urut berikutnya.
     * Menggunakan nomor_awal_surat yang dikonfigurasi sebagai nomor awal.
     * Inputan surat keluar sebelumnya (misal manual nomor lama) tidak akan menaikkan nomor awal,
     * kecuali sudah ada surat baru yang nomor urutnya >= nomor_awal_surat.
     */
    public function getNextSeq(): int
    {
        $nomorAwal = (int) ($this->nomor_awal_surat ?? 0);
        if ($nomorAwal <= 0) {
            return 0; // 0 menandakan belum ada nomor awal / penomoran diinput manual
        }

        $startId   = (int) ($this->nomor_awal_surat_id ?? 0);

        // Ambil surat keluar tahun berjalan
        $query = SuratKeluar::where(function ($q) {
            $q->whereYear('tgl_keluar', now()->year)
              ->orWhereYear('tgl_surat', now()->year);
        });

        if ($startId > 0) {
            $query->where('id', '>', $startId);
        }

        $letters = $query->get(['id', 'nomor_surat']);

        if ($letters->isEmpty()) {
            return $nomorAwal;
        }

        $maxSeq = null;
        foreach ($letters as $s) {
            $seqVal = $this->extractSeqFromNomor($s->nomor_surat);
            if ($seqVal !== null && $seqVal >= $nomorAwal && $seqVal < 99999) {
                $maxSeq = ($maxSeq === null) ? $seqVal : max($maxSeq, $seqVal);
            }
        }

        return ($maxSeq === null) ? $nomorAwal : ($maxSeq + 1);
    }

    /**
     * Format nomor surat lengkap.
     * Jika nomor urut di bawah 1000, diberi awalan 0 di depan (format minimal 4 digit, cth: 0813, 0001).
     */
    public function formatNomor(int $seq, string $kodeJenis = '', string $kodeDept = '', ?string $date = null): string
    {
        $date   = $date ? Carbon::parse($date) : now();
        $roman  = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
        $sep    = $this->separator ?: '/';
        $seqStr = $seq <= 0 ? '' : ($seq < 1000 ? str_pad($seq, 4, '0', STR_PAD_LEFT) : (string) $seq);

        $parts = $this->format_bagian ?? ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'];
        $map   = [
            'prefix'          => $this->prefix_kode ?? '',
            'seq'             => $seqStr,
            'kode_jenis'      => $kodeJenis,
            'kode_dept'       => $kodeDept,
            'kode_jenis_dept' => $kodeJenis && $kodeDept ? "{$kodeJenis}.{$kodeDept}" : ($kodeJenis ?: $kodeDept),
            'kode_dept_jenis' => $kodeDept && $kodeJenis ? "{$kodeDept}.{$kodeJenis}" : ($kodeDept ?: $kodeJenis),
            'bulan_romawi'    => $roman[$date->month],
            'tahun'           => (string) $date->year,
        ];

        return implode($sep, array_filter(
            array_map(fn ($p) => $map[$p] ?? '', $parts),
            fn ($v) => $v !== ''
        ));
    }
}

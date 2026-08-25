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
        'separator', 'format_bagian', 'prefix_kode',
    ];

    protected $casts = ['format_bagian' => 'array'];

    public static function current(): self
    {
        return static::first() ?? static::create([
            'separator'     => '/',
            'format_bagian' => ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'],
        ]);
    }

    public function formatNomor(int $seq, string $kodeJenis = '', string $kodeDept = '', ?string $date = null): string
    {
        $date   = $date ? Carbon::parse($date) : now();
        $roman  = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
        $sep    = $this->separator ?: '/';
        $seqStr = str_pad($seq, 3, '0', STR_PAD_LEFT);

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

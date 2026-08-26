<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratKeluar extends Model
{
    protected $table    = 'surat_keluar';
    protected $fillable = [
        'dibuat_oleh', 'nomor_surat', 'perihal', 'tujuan',
        'tgl_surat', 'tgl_keluar', 'kategori', 'status',
        'keterangan', 'file_surat',
        'kode_tte', 'tte_at', 'tte_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tgl_surat'  => 'date:Y-m-d',
            'tgl_keluar' => 'date:Y-m-d',
            'tte_at'     => 'datetime',
        ];
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function ttePenandatangan()
    {
        return $this->belongsTo(User::class, 'tte_oleh');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_surat ? '/storage/' . $this->file_surat : null;
    }

    protected $appends = ['file_url'];
}

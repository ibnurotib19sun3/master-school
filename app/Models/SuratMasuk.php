<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratMasuk extends Model
{
    protected $table    = 'surat_masuk';
    protected $fillable = [
        'dibuat_oleh', 'nomor_surat', 'perihal', 'pengirim',
        'tgl_surat', 'tgl_diterima', 'kategori', 'disposisi',
        'keterangan', 'file_surat', 'kode_ref',
    ];
    protected function casts(): array
    {
        return ['tgl_surat' => 'date', 'tgl_diterima' => 'date'];
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_surat ? '/storage/' . $this->file_surat : null;
    }

    protected $appends = ['file_url'];
}

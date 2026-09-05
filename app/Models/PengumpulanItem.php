<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengumpulanItem extends Model
{
    protected $table    = 'pengumpulan_item';
    protected $fillable = ['pengumpulan_id', 'pembelajaran_id', 'file_path', 'tgl_upload', 'keterangan', 'portal_override'];
    protected $casts    = ['tgl_upload' => 'datetime'];
    protected $appends  = ['file_url'];

    public function pengumpulan()
    {
        return $this->belongsTo(Pengumpulan::class);
    }

    public function pembelajaran()
    {
        return $this->belongsTo(Pembelajaran::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }
}

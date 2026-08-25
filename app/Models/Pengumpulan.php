<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengumpulan extends Model
{
    protected $table    = 'pengumpulan';
    protected $fillable = ['created_by', 'tahun_ajaran_id', 'judul', 'deskripsi', 'batas_waktu', 'is_aktif'];
    protected $casts    = [
        'batas_waktu' => 'datetime',
        'is_aktif'    => 'boolean',
    ];

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function items()
    {
        return $this->hasMany(PengumpulanItem::class);
    }
}

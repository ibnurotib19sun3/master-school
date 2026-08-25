<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assessment extends Model
{
    use SoftDeletes;
    protected $table = 'assessment';
    protected $fillable = ['pembelajaran_id', 'judul', 'deskripsi', 'instruksi', 'batas_waktu', 'nilai_maksimal', 'is_aktif'];
    protected function casts(): array {
        return ['batas_waktu' => 'datetime', 'nilai_maksimal' => 'decimal:2', 'is_aktif' => 'boolean'];
    }

    public function pembelajaran() { return $this->belongsTo(Pembelajaran::class); }
    public function pengumpulan() { return $this->hasMany(PengumpulanTugas::class); }
}

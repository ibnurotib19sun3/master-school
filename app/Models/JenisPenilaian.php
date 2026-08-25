<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisPenilaian extends Model
{
    protected $table = 'jenis_penilaian';
    protected $fillable = ['nama', 'bobot', 'deskripsi', 'is_aktif'];
    protected function casts(): array { return ['is_aktif' => 'boolean', 'bobot' => 'decimal:2']; }
    public function nilai() { return $this->hasMany(Nilai::class); }
}

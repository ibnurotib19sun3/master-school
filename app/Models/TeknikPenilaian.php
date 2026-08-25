<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeknikPenilaian extends Model
{
    protected $table = 'teknik_penilaian';
    protected $fillable = ['nama', 'deskripsi', 'is_aktif'];
    protected function casts(): array { return ['is_aktif' => 'boolean']; }
    public function nilai() { return $this->hasMany(Nilai::class); }
}

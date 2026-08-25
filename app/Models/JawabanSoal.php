<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JawabanSoal extends Model
{
    protected $table = 'jawaban_soal';
    protected $fillable = ['soal_id', 'teks_jawaban', 'is_benar', 'penjelasan'];
    protected function casts(): array { return ['is_benar' => 'boolean']; }

    public function soal() { return $this->belongsTo(Soal::class); }
}

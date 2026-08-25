<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    protected $table = 'soal';
    protected $fillable = ['kuis_id', 'nomor', 'pertanyaan', 'tipe_soal', 'bobot', 'media'];
    protected function casts(): array { return ['bobot' => 'decimal:2']; }

    public function kuis() { return $this->belongsTo(Kuis::class); }
    public function jawaban() { return $this->hasMany(JawabanSoal::class); }
}

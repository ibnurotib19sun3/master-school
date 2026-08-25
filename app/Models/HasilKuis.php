<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilKuis extends Model
{
    protected $table = 'hasil_kuis';
    protected $fillable = ['kuis_id', 'siswa_id', 'percobaan_ke', 'nilai', 'durasi_detik', 'dimulai_pada', 'selesai_pada', 'jawaban_siswa'];
    protected function casts(): array {
        return ['nilai' => 'decimal:2', 'dimulai_pada' => 'datetime', 'selesai_pada' => 'datetime', 'jawaban_siswa' => 'array'];
    }

    public function kuis() { return $this->belongsTo(Kuis::class); }
    public function siswa() { return $this->belongsTo(Siswa::class); }
}

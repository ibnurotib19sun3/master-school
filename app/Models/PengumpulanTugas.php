<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengumpulanTugas extends Model
{
    protected $table = 'pengumpulan_tugas';
    protected $fillable = ['assessment_id', 'siswa_id', 'jawaban', 'file_path', 'url_jawaban', 'status', 'nilai', 'feedback', 'dikumpulkan_pada'];
    protected function casts(): array {
        return ['nilai' => 'decimal:2', 'dikumpulkan_pada' => 'datetime'];
    }

    public function assessment() { return $this->belongsTo(Assessment::class); }
    public function siswa() { return $this->belongsTo(Siswa::class); }
}

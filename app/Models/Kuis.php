<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kuis extends Model
{
    use SoftDeletes;
    protected $table = 'kuis';
    protected $fillable = ['pembelajaran_id', 'guru_id', 'judul', 'deskripsi', 'tipe', 'durasi_menit', 'dibuka_pada', 'ditutup_pada', 'acak_soal', 'tampilkan_hasil', 'max_percobaan', 'is_aktif'];
    protected function casts(): array {
        return ['dibuka_pada' => 'datetime', 'ditutup_pada' => 'datetime', 'acak_soal' => 'boolean', 'tampilkan_hasil' => 'boolean', 'is_aktif' => 'boolean'];
    }

    public function pembelajaran() { return $this->belongsTo(Pembelajaran::class); }
    public function guru() { return $this->belongsTo(Guru::class); }
    public function soal() { return $this->hasMany(Soal::class); }
    public function hasilKuis() { return $this->hasMany(HasilKuis::class); }
}

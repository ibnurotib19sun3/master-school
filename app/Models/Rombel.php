<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rombel extends Model
{
    use SoftDeletes;

    protected $table = 'rombel';

    protected $fillable = [
        'tahun_ajaran_id', 'kelas_id', 'jurusan_id', 'nama',
        'kapasitas', 'wali_kelas_id', 'is_aktif',
    ];

    protected function casts(): array
    {
        return ['is_aktif' => 'boolean'];
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    // Multi-jurusan: rombel bisa terdiri dari beberapa jurusan
    public function jurusanList()
    {
        return $this->belongsToMany(Jurusan::class, 'rombel_jurusan');
    }

    public function waliKelas()
    {
        return $this->belongsTo(User::class, 'wali_kelas_id');
    }

    public function siswa()
    {
        return $this->hasMany(Siswa::class);
    }

    public function pembelajaran()
    {
        return $this->hasMany(Pembelajaran::class);
    }
}

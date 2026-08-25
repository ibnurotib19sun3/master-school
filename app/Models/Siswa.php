<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Siswa extends Model
{
    use SoftDeletes;

    protected $table = 'siswa';

    protected $fillable = [
        'user_id', 'orang_tua_id', 'nis', 'nisn', 'tempat_lahir',
        'agama', 'status_siswa', 'tahun_ajaran_id', 'rombel_id', 'jurusan_id', 'tanggal_masuk',
    ];

    protected function casts(): array
    {
        return ['tanggal_masuk' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orangTua()
    {
        return $this->belongsTo(OrangTua::class);
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class);
    }

    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class);
    }

    public function nilai()
    {
        return $this->hasMany(Nilai::class);
    }

    public function hasilKuis()
    {
        return $this->hasMany(HasilKuis::class);
    }

    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }
}

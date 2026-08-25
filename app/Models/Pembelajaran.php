<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Jurusan;

class Pembelajaran extends Model
{
    protected $table = 'pembelajaran';

    protected $fillable = [
        'tahun_ajaran_id', 'rombel_id', 'mata_pelajaran_id', 'jurusan_id', 'guru_id',
        'jam_per_minggu', 'hari', 'jam_mulai', 'jam_selesai', 'is_aktif',
    ];

    protected function casts(): array
    {
        return ['is_aktif' => 'boolean'];
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

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class);
    }

    public function jadwal()
    {
        return $this->hasMany(Jadwal::class);
    }

    public function jurnalMengajar()
    {
        return $this->hasMany(JurnalMengajar::class);
    }

    public function nilai()
    {
        return $this->hasMany(Nilai::class);
    }

    public function kuis()
    {
        return $this->hasMany(Kuis::class);
    }

    public function assessment()
    {
        return $this->hasMany(Assessment::class);
    }
}

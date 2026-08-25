<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nilai extends Model
{
    protected $table = 'nilai';

    protected $fillable = [
        'pembelajaran_id', 'siswa_id', 'jenis_penilaian_id', 'teknik_penilaian_id',
        'nama_penilaian', 'tanggal', 'nilai', 'nilai_maksimal', 'catatan',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d', 'nilai' => 'decimal:2', 'nilai_maksimal' => 'decimal:2'];
    }

    public function pembelajaran()
    {
        return $this->belongsTo(Pembelajaran::class);
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function jenisPenilaian()
    {
        return $this->belongsTo(JenisPenilaian::class);
    }

    public function teknikPenilaian()
    {
        return $this->belongsTo(TeknikPenilaian::class);
    }
}

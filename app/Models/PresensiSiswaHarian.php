<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PresensiSiswaHarian extends Model
{
    protected $table = 'presensi_siswa_harian';

    protected $fillable = [
        'siswa_id', 'rombel_id', 'tahun_ajaran_id',
        'tanggal', 'status', 'keterangan', 'dicatat_oleh',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class);
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}

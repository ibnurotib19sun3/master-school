<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NilaiJurnal extends Model
{
    protected $table = 'nilai_jurnal';

    protected $fillable = [
        'jurnal_mengajar_id',
        'siswa_id',
        'capaian_pembelajaran_id',
        'nilai',
        'catatan',
    ];

    protected function casts(): array
    {
        return ['nilai' => 'decimal:2'];
    }

    public function jurnalMengajar()
    {
        return $this->belongsTo(JurnalMengajar::class);
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function capaianPembelajaran()
    {
        return $this->belongsTo(CapaianPembelajaran::class);
    }
}

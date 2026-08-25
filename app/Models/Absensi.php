<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absensi extends Model
{
    protected $table = 'absensi';

    protected $fillable = ['pembelajaran_id', 'jurnal_id', 'siswa_id', 'tanggal', 'status', 'keterangan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    public function pembelajaran()
    {
        return $this->belongsTo(Pembelajaran::class);
    }

    public function jurnal()
    {
        return $this->belongsTo(JurnalMengajar::class, 'jurnal_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}

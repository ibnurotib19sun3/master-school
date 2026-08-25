<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsensiTatausaha extends Model
{
    protected $table = 'absensi_tatausaha';

    protected $fillable = ['tatausaha_id', 'tanggal', 'status', 'keterangan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    public function tatausaha()
    {
        return $this->belongsTo(Tatausaha::class);
    }
}

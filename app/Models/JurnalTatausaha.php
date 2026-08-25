<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JurnalTatausaha extends Model
{
    use SoftDeletes;

    protected $table = 'jurnal_tatausaha';

    protected $fillable = [
        'tatausaha_id', 'tahun_ajaran_id', 'semester', 'tanggal', 'kegiatan', 'keterangan',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    public function tatausaha()
    {
        return $this->belongsTo(Tatausaha::class);
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}

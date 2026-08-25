<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JurnalPokja extends Model
{
    use SoftDeletes;

    protected $table = 'jurnal_pokja';

    protected $fillable = [
        'guru_id', 'tahun_ajaran_id', 'semester', 'tanggal', 'kegiatan', 'keterangan',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}

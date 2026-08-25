<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MataPelajaran;

class CapaianPembelajaran extends Model
{
    protected $table = 'capaian_pembelajaran';

    protected $fillable = ['guru_id', 'mata_pelajaran_id', 'tingkat', 'semester', 'kode', 'capaian'];

    protected $appends = ['kode_lengkap'];

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function jurnalMengajar()
    {
        return $this->belongsToMany(JurnalMengajar::class, 'jurnal_capaian');
    }

    public function getKodeLengkapAttribute(): string
    {
        return $this->tingkat . $this->semester . str_pad($this->kode, 2, '0', STR_PAD_LEFT);
    }
}

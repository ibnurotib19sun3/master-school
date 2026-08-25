<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatatanKepsek extends Model
{
    use SoftDeletes;
    protected $table = 'catatan_kepsek';
    protected $fillable = ['guru_id', 'tatausaha_id', 'kepsek_id', 'jurnal_mengajar_id', 'kategori', 'judul', 'catatan', 'status', 'dibaca_pada'];
    protected function casts(): array { return ['dibaca_pada' => 'datetime']; }

    public function guru() { return $this->belongsTo(Guru::class); }
    public function tatausaha() { return $this->belongsTo(Tatausaha::class); }
    public function kepsek() { return $this->belongsTo(User::class, 'kepsek_id'); }
    public function jurnalMengajar() { return $this->belongsTo(JurnalMengajar::class); }
}

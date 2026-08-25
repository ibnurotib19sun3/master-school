<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KuisAsesmen extends Model
{
    protected $table = 'kuis_asesmen';

    protected $fillable = ['guru_id', 'jenis', 'judul', 'tautan', 'rombel_id'];

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class);
    }
}

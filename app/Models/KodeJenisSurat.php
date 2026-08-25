<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KodeJenisSurat extends Model
{
    protected $table    = 'kode_jenis_surat';
    protected $fillable = ['nama', 'kode', 'aktif', 'urutan'];
    protected $casts    = ['aktif' => 'boolean'];
}

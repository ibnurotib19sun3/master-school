<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KodeDepartemen extends Model
{
    protected $table    = 'kode_departemen';
    protected $fillable = ['nama', 'kode', 'aktif', 'urutan'];
    protected $casts    = ['aktif' => 'boolean'];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataPelajaran extends Model
{
    use SoftDeletes;

    protected $table = 'mata_pelajaran';

    protected $fillable = ['kode', 'nama', 'jenjang', 'jurusan_id', 'kkm', 'deskripsi', 'is_aktif'];

    protected function casts(): array
    {
        return ['is_aktif' => 'boolean'];
    }

    public function jurusan()
    {
        return $this->belongsTo(Jurusan::class);
    }

    public function pembelajaran()
    {
        return $this->hasMany(Pembelajaran::class);
    }

    public function videoEdukasi()
    {
        return $this->hasMany(VideoEdukasi::class);
    }

    public function modulDigital()
    {
        return $this->hasMany(ModulDigital::class);
    }
}

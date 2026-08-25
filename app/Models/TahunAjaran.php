<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TahunAjaran extends Model
{
    use SoftDeletes;

    protected $table = 'tahun_ajaran';

    protected $fillable = ['nama', 'semester', 'tanggal_mulai', 'tanggal_selesai', 'is_aktif'];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_aktif' => 'boolean',
        ];
    }

    public function rombel()
    {
        return $this->hasMany(Rombel::class);
    }

    public function pembelajaran()
    {
        return $this->hasMany(Pembelajaran::class);
    }

    public function siswa()
    {
        return $this->hasMany(Siswa::class);
    }

    public static function aktif()
    {
        return static::where('is_aktif', true)->first();
    }
}

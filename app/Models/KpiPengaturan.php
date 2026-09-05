<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiPengaturan extends Model
{
    public $timestamps  = false;
    public $incrementing = false;
    protected $primaryKey = 'kode';
    protected $keyType    = 'string';
    protected $table      = 'kpi_pengaturan';
    protected $fillable   = ['kode', 'bobot'];
    protected $casts      = ['bobot' => 'float'];

    public static function get(string $kode, float $default = 50): float
    {
        return (float) static::where('kode', $kode)->value('bobot') ?? $default;
    }

    public static function map(): array
    {
        return static::all()->pluck('bobot', 'kode')->toArray();
    }
}

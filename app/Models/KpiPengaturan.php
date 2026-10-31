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
    protected $fillable   = ['kode', 'bobot', 'nilai'];
    protected $casts      = ['bobot' => 'float'];

    public static function get(string $kode, float $default = 50): float
    {
        return (float) static::where('kode', $kode)->value('bobot') ?? $default;
    }

    public static function map(): array
    {
        return static::all()->pluck('bobot', 'kode')->toArray();
    }

    public static function getExcludedGuruIds(): array
    {
        $raw = static::where('kode', 'GURU_DIKECUALIKAN')->value('nilai');
        if (!$raw) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? array_values(array_filter(array_map('intval', $decoded))) : [];
    }

    public static function setExcludedGuruIds(array $ids): void
    {
        $clean = array_values(array_unique(array_filter(array_map('intval', $ids))));
        static::updateOrCreate(
            ['kode' => 'GURU_DIKECUALIKAN'],
            ['bobot' => 0, 'nilai' => json_encode($clean)]
        );
    }
}

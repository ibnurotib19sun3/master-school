<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    protected $table = 'hari_libur';

    protected $fillable = ['tanggal', 'nama', 'keterangan', 'jam_tertentu'];

    protected $casts = [
        'tanggal'      => 'date',
        'jam_tertentu' => 'array',
    ];

    /** Return whether a given jam_ke (int) is on holiday for this record. */
    public function mencakupJam(?int $jamKe): bool
    {
        // null jam_tertentu = semua jam libur
        if ($this->jam_tertentu === null) return true;
        if ($jamKe === null) return true;
        return in_array($jamKe, $this->jam_tertentu);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbsensiPiket extends Model
{
    protected $table = 'absensi_piket';

    protected $fillable = [
        'jadwal_id', 'tanggal', 'status_guru', 'keterangan',
        'tugas', 'deadline_tugas', 'dicatat_oleh',
    ];

    protected $casts = [
        'tanggal'       => 'date:Y-m-d',
        'deadline_tugas' => 'date:Y-m-d',
    ];

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(Jadwal::class);
    }

    public function pencatat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}

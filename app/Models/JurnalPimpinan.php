<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JurnalPimpinan extends Model
{
    use SoftDeletes;

    protected $table = 'jurnal_pimpinan';

    protected $fillable = [
        'user_id', 'tahun_ajaran_id', 'semester',
        'tanggal', 'jabatan', 'kegiatan', 'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}

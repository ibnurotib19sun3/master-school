<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Masukan extends Model
{
    protected $table = 'masukan';

    protected $fillable = [
        'user_id',
        'kategori',
        'judul',
        'isi',
        'status',
        'catatan_admin',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function balasan(): HasMany
    {
        return $this->hasMany(MasukanBalasan::class)->orderBy('created_at');
    }
}

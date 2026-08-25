<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasukanBalasan extends Model
{
    protected $table = 'masukan_balasan';

    protected $fillable = ['masukan_id', 'user_id', 'isi', 'is_admin'];

    protected $casts = ['is_admin' => 'boolean'];

    public function masukan(): BelongsTo
    {
        return $this->belongsTo(Masukan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuBadge extends Model
{
    protected $fillable = ['path', 'badge'];

    public static function asMap(): array
    {
        return static::all()->pluck('badge', 'path')->toArray();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class KartuSiswaTemplate extends Model
{
    protected $table = 'kartu_siswa_template';

    protected $fillable = [
        'nama', 'lebar_mm', 'tinggi_mm', 'orientasi', 'background_path', 'fields', 'bingkai_foto', 'foto_layout',
        'kertas', 'kertas_lebar_mm', 'kertas_tinggi_mm', 'margin_mm', 'jarak_x_mm', 'jarak_y_mm',
    ];

    protected $appends = ['background_url'];

    protected function casts(): array
    {
        return [
            'fields'           => 'array',
            'foto_layout'      => 'array',
            'lebar_mm'         => 'float',
            'tinggi_mm'        => 'float',
            'kertas_lebar_mm'  => 'float',
            'kertas_tinggi_mm' => 'float',
            'margin_mm'        => 'float',
            'jarak_x_mm'       => 'float',
            'jarak_y_mm'       => 'float',
        ];
    }

    public function getBackgroundUrlAttribute(): ?string
    {
        return $this->background_path ? Storage::disk('public')->url($this->background_path) : null;
    }
}

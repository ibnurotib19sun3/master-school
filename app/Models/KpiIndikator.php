<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiIndikator extends Model
{
    protected $table = 'kpi_indikator';
    protected $fillable = ['kode', 'nama', 'deskripsi', 'kategori', 'bobot', 'target', 'is_aktif'];
    protected function casts(): array { return ['is_aktif' => 'boolean', 'bobot' => 'decimal:2', 'target' => 'decimal:2']; }
    public function kpiGuru() { return $this->hasMany(KpiGuru::class); }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiGuru extends Model
{
    protected $table = 'kpi_guru';
    protected $fillable = [
        'guru_id', 'tipe_guru', 'tahun_ajaran_id', 'kpi_indikator_id',
        'bulan', 'persen', 'bobot_snapshot', 'nilai', 'catatan', 'dinilai_oleh', 'dibaca_pada',
    ];
    protected function casts(): array {
        return [
            'nilai'          => 'decimal:2',
            'persen'         => 'decimal:2',
            'bobot_snapshot' => 'decimal:2',
            'dibaca_pada'    => 'datetime',
        ];
    }

    public function guru() { return $this->belongsTo(Guru::class); }
    public function tahunAjaran() { return $this->belongsTo(TahunAjaran::class); }
    public function indikator() { return $this->belongsTo(KpiIndikator::class, 'kpi_indikator_id'); }
    public function penilai() { return $this->belongsTo(User::class, 'dinilai_oleh'); }
}

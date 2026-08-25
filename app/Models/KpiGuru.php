<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiGuru extends Model
{
    protected $table = 'kpi_guru';
    protected $fillable = [
        'guru_id', 'tahun_ajaran_id', 'kpi_indikator_id',
        'bulan', 'persen', 'bobot_snapshot', 'nilai', 'catatan', 'dinilai_oleh',
    ];
    protected function casts(): array {
        return ['nilai' => 'decimal:2', 'persen' => 'decimal:2', 'bobot_snapshot' => 'decimal:2'];
    }

    public function guru() { return $this->belongsTo(Guru::class); }
    public function tahunAjaran() { return $this->belongsTo(TahunAjaran::class); }
    public function indikator() { return $this->belongsTo(KpiIndikator::class, 'kpi_indikator_id'); }
    public function penilai() { return $this->belongsTo(User::class, 'dinilai_oleh'); }
}

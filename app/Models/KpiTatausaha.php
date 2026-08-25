<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiTatausaha extends Model
{
    protected $table = 'kpi_tatausaha';
    protected $fillable = [
        'tatausaha_id', 'tahun_ajaran_id', 'kpi_indikator_id',
        'bulan', 'persen', 'bobot_snapshot', 'nilai', 'catatan', 'dinilai_oleh',
    ];
    protected function casts(): array
    {
        return ['nilai' => 'decimal:2', 'persen' => 'decimal:2', 'bobot_snapshot' => 'decimal:2'];
    }

    public function tatausaha() { return $this->belongsTo(Tatausaha::class); }
    public function tahunAjaran() { return $this->belongsTo(TahunAjaran::class); }
    public function indikator() { return $this->belongsTo(KpiIndikator::class, 'kpi_indikator_id'); }
    public function penilai() { return $this->belongsTo(User::class, 'dinilai_oleh'); }
}

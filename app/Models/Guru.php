<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guru extends Model
{
    use SoftDeletes;

    protected $table = 'guru';

    protected $fillable = [
        'user_id', 'nip', 'nuptk', 'gelar_depan', 'gelar_belakang',
        'status_kepegawaian', 'pendidikan_terakhir', 'bidang_studi', 'jabatan',
        'tanggal_masuk', 'is_aktif', 'nomor_wa',
    ];

    protected $appends = ['nama_lengkap'];

    protected function casts(): array
    {
        return [
            'tanggal_masuk' => 'date:Y-m-d',
            'is_aktif'      => 'boolean',
            'bidang_studi'  => 'array',
            'jabatan'       => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pembelajaran()
    {
        return $this->hasMany(Pembelajaran::class);
    }

    public function videoEdukasi()
    {
        return $this->hasMany(VideoEdukasi::class);
    }

    public function modulDigital()
    {
        return $this->hasMany(ModulDigital::class);
    }

    public function kpiGuru()
    {
        return $this->hasMany(KpiGuru::class);
    }

    public function catatanKepsek()
    {
        return $this->hasMany(CatatanKepsek::class);
    }

    public function getNamaLengkapAttribute(): string
    {
        $depan = $this->gelar_depan ? $this->gelar_depan . ' ' : '';
        $belakang = $this->gelar_belakang ? ', ' . $this->gelar_belakang : '';
        return $depan . ($this->user?->name ?? '') . $belakang;
    }
}

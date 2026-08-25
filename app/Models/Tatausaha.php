<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tatausaha extends Model
{
    use SoftDeletes;

    protected $table = 'tatausaha';

    protected $fillable = [
        'user_id', 'nip', 'gelar_depan', 'gelar_belakang',
        'jabatan', 'status_kepegawaian', 'tanggal_masuk', 'pendidikan_terakhir',
        'is_aktif', 'nomor_wa',
    ];

    protected $appends = ['nama_lengkap'];

    protected function casts(): array
    {
        return ['is_aktif' => 'boolean', 'tanggal_masuk' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function absensi()
    {
        return $this->hasMany(AbsensiTatausaha::class);
    }

    public function jurnal()
    {
        return $this->hasMany(JurnalTatausaha::class);
    }

    public function catatanKepsek()
    {
        return $this->hasMany(CatatanKepsek::class);
    }

    public function getNamaLengkapAttribute(): string
    {
        $depan    = $this->gelar_depan    ? $this->gelar_depan . ' '    : '';
        $belakang = $this->gelar_belakang ? ', ' . $this->gelar_belakang : '';
        return $depan . ($this->user?->name ?? '') . $belakang;
    }
}

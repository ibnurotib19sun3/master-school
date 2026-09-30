<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsMateriAkses extends Model
{
    protected $table = 'lms_materi_akses';

    protected $fillable = ['lms_materi_id', 'siswa_id', 'dilihat_at', 'diunduh_at'];

    protected function casts(): array
    {
        return ['dilihat_at' => 'datetime', 'diunduh_at' => 'datetime'];
    }

    public function materi()
    {
        return $this->belongsTo(LmsMateri::class, 'lms_materi_id');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }
}

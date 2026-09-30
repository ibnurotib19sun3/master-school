<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LmsMateri extends Model
{
    use SoftDeletes;

    protected $table = 'lms_materi';

    protected $fillable = [
        'pembelajaran_id', 'guru_id', 'pertemuan_ke', 'judul', 'deskripsi',
        'file_path', 'file_name', 'file_ext', 'file_size', 'url', 'urutan', 'is_aktif',
    ];

    protected $appends = ['file_url', 'is_link'];

    protected function casts(): array
    {
        return ['is_aktif' => 'boolean'];
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }

    public function getIsLinkAttribute(): bool
    {
        return !$this->file_path && (bool) $this->url;
    }

    public function pembelajaran()
    {
        return $this->belongsTo(Pembelajaran::class);
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function akses()
    {
        return $this->hasMany(LmsMateriAkses::class);
    }
}

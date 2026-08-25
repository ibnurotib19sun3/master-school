<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Jobsheet extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jobsheet';

    protected $fillable = [
        'mata_pelajaran_id', 'guru_id', 'judul', 'deskripsi',
        'file_path', 'url', 'file_name', 'file_ext', 'file_size', 'download_count',
    ];

    protected $appends = ['file_url', 'is_link'];

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'mata_pelajaran_id');
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }

    public function getIsLinkAttribute(): bool
    {
        return !$this->file_path && (bool) $this->url;
    }
}

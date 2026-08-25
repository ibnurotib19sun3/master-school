<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModulDigital extends Model
{
    use SoftDeletes;
    protected $table = 'modul_digital';
    protected $fillable = ['mata_pelajaran_id', 'guru_id', 'judul', 'deskripsi', 'tipe', 'file_path', 'url', 'file_name', 'file_ext', 'file_size', 'cover_path', 'url_external', 'jenjang', 'is_publik', 'download_count'];
    protected $appends = ['file_url', 'is_link'];

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }

    public function getIsLinkAttribute(): bool
    {
        return !$this->file_path && (bool) $this->url;
    }
    protected function casts(): array { return ['is_publik' => 'boolean']; }

    public function mataPelajaran() { return $this->belongsTo(MataPelajaran::class); }
    public function guru() { return $this->belongsTo(Guru::class); }
}

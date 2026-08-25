<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Presentasi extends Model
{
    use SoftDeletes;
    protected $table = 'presentasi';
    protected $fillable = ['mata_pelajaran_id', 'guru_id', 'judul', 'deskripsi', 'platform', 'url_embed', 'file_path', 'url', 'file_name', 'file_ext', 'file_size', 'is_publik'];
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

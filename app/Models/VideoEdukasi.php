<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VideoEdukasi extends Model
{
    use SoftDeletes;
    protected $table = 'video_edukasi';
    protected $fillable = ['mata_pelajaran_id', 'guru_id', 'judul', 'deskripsi', 'url_video', 'sumber', 'thumbnail', 'durasi', 'jenjang', 'is_publik', 'views'];
    protected $appends  = ['is_link', 'file_url'];
    protected function casts(): array { return ['is_publik' => 'boolean']; }

    public function getIsLinkAttribute(): bool  { return $this->sumber !== 'Upload'; }
    public function getFileUrlAttribute(): ?string
    {
        return $this->sumber === 'Upload' ? '/storage/' . $this->url_video : null;
    }

    public function mataPelajaran() { return $this->belongsTo(MataPelajaran::class); }
    public function guru() { return $this->belongsTo(Guru::class); }
}

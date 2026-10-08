<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DokumenSiswa extends Model
{
    protected $table = 'dokumen_siswa';

    protected $fillable = ['siswa_id', 'dokumen_jenis_id', 'file_path', 'uploaded_by'];

    protected $appends = ['file_url', 'file_ext'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function dokumenJenis()
    {
        return $this->belongsTo(DokumenJenis::class);
    }

    public function pengunggah()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }

    public function getFileExtAttribute(): ?string
    {
        return $this->file_path ? strtolower(pathinfo($this->file_path, PATHINFO_EXTENSION)) : null;
    }
}

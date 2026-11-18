<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratKeluar extends Model
{
    protected $table    = 'surat_keluar';
    protected $fillable = [
        'dibuat_oleh', 'nomor_surat', 'perihal', 'tujuan',
        'tgl_surat', 'tgl_keluar', 'kategori', 'status',
        'keterangan', 'file_surat', 'file_tte',
        'kode_tte', 'tte_at', 'tte_oleh',
        'isi_surat', 'penerima_tipe', 'penerima_id', 'template_kode',
    ];

    protected function casts(): array
    {
        return [
            'tgl_surat'  => 'date:Y-m-d',
            'tgl_keluar' => 'date:Y-m-d',
            'tte_at'     => 'datetime',
        ];
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function ttePenandatangan()
    {
        return $this->belongsTo(User::class, 'tte_oleh');
    }

    public static function sanitizeNomorForFilename(string $nomorSurat): string
    {
        $clean = preg_replace('~[/\\\\:*?"<>|#%&{}+]+~', '-', trim($nomorSurat));
        $clean = preg_replace('/\s+/', '-', $clean);
        $clean = preg_replace('/[-_]+/', '-', $clean);
        $clean = trim($clean, '-_.');

        return $clean ?: 'surat-keluar';
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_surat ? '/storage/' . $this->file_surat : null;
    }

    public function getFileTteUrlAttribute(): ?string
    {
        return $this->file_tte ? '/storage/' . $this->file_tte : null;
    }

    public function getFileViewUrlAttribute(): ?string
    {
        return $this->file_surat ? route('surat-keluar.view-file', $this->id) : null;
    }

    public function getFileDownloadUrlAttribute(): ?string
    {
        return $this->file_surat ? route('surat-keluar.download', $this->id) : null;
    }

    protected $appends = ['file_url', 'file_tte_url', 'file_view_url', 'file_download_url'];
}

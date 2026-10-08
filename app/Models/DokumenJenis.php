<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DokumenJenis extends Model
{
    protected $table = 'dokumen_jenis';

    // Kunci yang tersimpan di allowed_types (dipilih admin lewat checkbox) → ekstensi
    // file asli yang diterima validasi upload. "jpg" sengaja mencakup .jpeg juga.
    const TYPE_MAP = [
        'jpg' => ['jpg', 'jpeg'],
        'png' => ['png'],
        'pdf' => ['pdf'],
    ];

    protected $fillable = ['nama', 'deskripsi', 'allowed_types', 'urutan', 'is_aktif'];

    public function allowedExtensions(): array
    {
        $exts = [];
        foreach ($this->allowed_types ?? [] as $key) {
            $exts = array_merge($exts, self::TYPE_MAP[$key] ?? []);
        }
        return array_values(array_unique($exts));
    }

    protected function casts(): array
    {
        return ['allowed_types' => 'array', 'is_aktif' => 'boolean'];
    }

    public function dokumenSiswa()
    {
        return $this->hasMany(DokumenSiswa::class);
    }
}

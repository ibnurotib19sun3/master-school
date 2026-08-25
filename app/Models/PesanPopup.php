<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PesanPopup extends Model
{
    protected $table    = 'pesan_popup';
    protected $fillable = ['dibuat_oleh', 'judul', 'isi', 'tipe', 'is_aktif', 'mulai_pada', 'selesai_pada'];
    protected function casts(): array
    {
        return [
            'is_aktif'    => 'boolean',
            'mulai_pada'  => 'datetime',
            'selesai_pada'=> 'datetime',
        ];
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public static function getAktif(): ?self
    {
        $now = now(config('app.timezone', 'Asia/Jakarta'));

        return self::where('is_aktif', true)
            ->where(fn ($q) => $q->whereNull('mulai_pada')->orWhere('mulai_pada', '<=', $now))
            ->where(fn ($q) => $q->whereNull('selesai_pada')->orWhere('selesai_pada', '>=', $now))
            ->latest()
            ->first();
    }
}

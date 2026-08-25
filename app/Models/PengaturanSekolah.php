<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PengaturanSekolah extends Model
{
    protected $table = 'pengaturan_sekolah';

    protected $fillable = [
        'nama_sekolah', 'npsn', 'alamat', 'kecamatan', 'kota',
        'telepon', 'email_sekolah', 'website', 'kepala_sekolah_nama', 'nip_kepala',
        'logo_path', 'yayasan_dinas',
        'jam_mulai_sekolah', 'durasi_jp', 'jumlah_jp', 'istirahat', 'hari_aktif',
        'is_maintenance', 'maintenance_message',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    protected $appends = ['logo_url'];

    protected $casts = [
        'istirahat'      => 'array',
        'hari_aktif'     => 'array',
        'is_maintenance' => 'boolean',
    ];

    public static function current(): self
    {
        return static::first() ?? static::create([
            'jam_mulai_sekolah' => '07:00',
            'durasi_jp'         => 45,
            'jumlah_jp'         => 10,
            'istirahat'         => [
                ['setelah_jp' => 3, 'durasi_menit' => 15],
                ['setelah_jp' => 6, 'durasi_menit' => 30],
            ],
            'hari_aktif' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        ]);
    }

    public function getJamSlots(): array
    {
        $slots   = [];
        $waktu   = substr($this->jam_mulai_sekolah ?? '07:00', 0, 5);
        $current = Carbon::createFromFormat('H:i', $waktu);
        $breaks  = collect($this->istirahat ?? []);

        for ($i = 1; $i <= ($this->jumlah_jp ?? 10); $i++) {
            $mulai   = $current->format('H:i');
            $current->addMinutes($this->durasi_jp ?? 45);
            $selesai = $current->format('H:i');

            $slots[] = [
                'jam_ke'     => $i,
                'jam_mulai'  => $mulai,
                'jam_selesai' => $selesai,
            ];

            $break = $breaks->firstWhere('setelah_jp', $i);
            if ($break) {
                $current->addMinutes((int) ($break['durasi_menit'] ?? 0));
            }
        }

        return $slots;
    }
}

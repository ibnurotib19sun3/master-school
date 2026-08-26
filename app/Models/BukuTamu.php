<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BukuTamu extends Model
{
    protected $table = 'buku_tamu';

    protected $fillable = [
        'nama_tamu', 'instansi', 'nomor_hp', 'keperluan',
        'yang_dituju_tipe', 'yang_dituju_id', 'yang_dituju_nama', 'yang_dituju_jabatan',
        'tanggal', 'jam_masuk', 'jam_keluar',
        'status', 'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal'    => 'date:Y-m-d',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JurnalMengajar extends Model
{
    use SoftDeletes;

    protected $table = 'jurnal_mengajar';

    protected $fillable = [
        'pembelajaran_id', 'tanggal', 'pertemuan_ke', 'materi_pokok',
        'uraian_materi', 'tujuan_pembelajaran', 'metode', 'media_alat',
        'media_type', 'media_ref_id', 'media_url', 'catatan', 'jumlah_hadir',
        'jadwal_ids',
    ];

    protected $appends = ['media_link', 'media_ref_judul'];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d', 'jadwal_ids' => 'array', 'metode' => 'array'];
    }

    public function pembelajaran()
    {
        return $this->belongsTo(Pembelajaran::class);
    }

    public function catatanKepsek()
    {
        return $this->hasMany(CatatanKepsek::class);
    }

    public function capaianPembelajaran()
    {
        return $this->belongsToMany(CapaianPembelajaran::class, 'jurnal_capaian');
    }

    /** Resolved URL to view/download the linked media. */
    public function getMediaLinkAttribute(): ?string
    {
        if ($this->media_url) return $this->media_url;
        if (!$this->media_ref_id || !$this->media_type) return null;

        return match ($this->media_type) {
            'Video Pembelajaran' => VideoEdukasi::find($this->media_ref_id)?->url_video,
            'Presentasi'         => ($r = Presentasi::find($this->media_ref_id))?->file_path
                                        ? url('/media/preview?path=' . urlencode($r->file_path)) : null,
            'Modul Ajar'         => ($r = ModulDigital::find($this->media_ref_id))?->file_path
                                        ? url('/media/preview?path=' . urlencode($r->file_path)) : null,
            'Jobsheet'           => ($r = Jobsheet::find($this->media_ref_id))?->file_path
                                        ? url('/media/preview?path=' . urlencode($r->file_path)) : null,
            default              => null,
        };
    }

    /** Title of the linked media record. */
    public function getMediaRefJudulAttribute(): ?string
    {
        if (!$this->media_ref_id || !$this->media_type) return null;

        return match ($this->media_type) {
            'Video Pembelajaran' => VideoEdukasi::find($this->media_ref_id)?->judul,
            'Presentasi'         => Presentasi::find($this->media_ref_id)?->judul,
            'Modul Ajar'         => ModulDigital::find($this->media_ref_id)?->judul,
            'Jobsheet'           => Jobsheet::find($this->media_ref_id)?->judul,
            default              => null,
        };
    }
}

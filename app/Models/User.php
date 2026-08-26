<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'plain_password', 'username', 'phone', 'avatar',
        'gender', 'tanggal_lahir', 'alamat', 'is_active', 'last_seen_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $appends = ['avatar_url', 'is_online'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'tanggal_lahir' => 'date:Y-m-d',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    public function getIsOnlineAttribute(): bool
    {
        return $this->last_seen_at !== null && $this->last_seen_at->gt(now()->subMinutes(5));
    }

    public function guru()
    {
        return $this->hasOne(Guru::class);
    }

    public function siswa()
    {
        return $this->hasOne(Siswa::class);
    }

    public function tatausaha()
    {
        return $this->hasOne(Tatausaha::class);
    }

    public function orangTua()
    {
        return $this->hasOne(OrangTua::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar
            ? Storage::disk('public')->url($this->avatar)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=0284c7&color=fff&bold=true';
    }
}

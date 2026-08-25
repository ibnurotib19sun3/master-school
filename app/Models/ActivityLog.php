<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';
    public $updatedAt = false;
    protected $fillable = ['user_id', 'action', 'model', 'model_id', 'description', 'old_values', 'new_values', 'ip_address', 'user_agent'];
    protected function casts(): array { return ['old_values' => 'array', 'new_values' => 'array']; }

    public function user() { return $this->belongsTo(User::class); }
}

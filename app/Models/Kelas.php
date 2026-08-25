<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas';

    protected $fillable = ['nama', 'tingkat', 'jenjang'];

    public function rombel()
    {
        return $this->hasMany(Rombel::class);
    }
}

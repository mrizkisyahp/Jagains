<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instansi extends Model
{
    use HasFactory;

    protected $table = 'instansi';

    protected $fillable = [
        'wilayah_id',
        'nama',
        'jenis',
        'kontak',
    ];

    public function wilayah(): BelongsTo
    {
        return $this->belongsTo(Wilayah::class, 'wilayah_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'instansi_id');
    }

    public function laporan(): HasMany
    {
        return $this->hasMany(Laporan::class, 'instansi_id');
    }

    public function aturanRouting(): HasMany
    {
        return $this->hasMany(AturanRouting::class, 'instansi_id');
    }
}

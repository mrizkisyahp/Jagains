<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Kategori extends Model
{
    use HasFactory;

    protected $table = 'kategori';

    protected $fillable = [
        'nama',
        'radius_gabung_m',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'radius_gabung_m' => 'integer',
            'aktif' => 'boolean',
        ];
    }

    public function laporan(): HasMany
    {
        return $this->hasMany(Laporan::class, 'kategori_id');
    }

    public function aturanRouting(): HasMany
    {
        return $this->hasMany(AturanRouting::class, 'kategori_id');
    }

    public function aturanSla(): HasOne
    {
        return $this->hasOne(AturanSla::class, 'kategori_id');
    }

    public function parameterKuorum(): HasOne
    {
        return $this->hasOne(ParameterKuorum::class, 'kategori_id');
    }
}

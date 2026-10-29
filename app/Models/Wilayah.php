<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wilayah extends Model
{
    use HasFactory;

    protected $table = 'wilayah';

    protected $fillable = [
        'id',
        'induk_id',
        'tingkat',
        'nama',
        'kode_bps',
        'geometri',
        'min_lintang',
        'max_lintang',
        'min_bujur',
        'max_bujur',
    ];

    protected function casts(): array
    {
        return [
            'geometri' => 'array',
            'min_lintang' => 'decimal:6',
            'max_lintang' => 'decimal:6',
            'min_bujur' => 'decimal:6',
            'max_bujur' => 'decimal:6',
        ];
    }

    public function induk(): BelongsTo
    {
        return $this->belongsTo(self::class, 'induk_id');
    }

    public function bawahan(): HasMany
    {
        return $this->hasMany(self::class, 'induk_id');
    }

    public function instansi(): HasMany
    {
        return $this->hasMany(Instansi::class, 'wilayah_id');
    }

    public function laporan(): HasMany
    {
        return $this->hasMany(Laporan::class, 'wilayah_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'wilayah_id');
    }
}

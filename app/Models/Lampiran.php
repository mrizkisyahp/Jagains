<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lampiran extends Model
{
    use HasFactory;

    protected $table = 'lampiran';

    public $timestamps = false;

    protected $fillable = [
        'uuid',
        'laporan_id',
        'pengguna_id',
        'tahap',
        'path',
        'ukuran_byte',
        'lebar',
        'tinggi',
        'gps_cocok',
        'jarak_m',
        'akurasi_m',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'ukuran_byte' => 'integer',
            'lebar' => 'integer',
            'tinggi' => 'integer',
            'gps_cocok' => 'boolean',
            'jarak_m' => 'decimal:1',
            'akurasi_m' => 'decimal:1',
            'created_at' => 'datetime',
        ];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}

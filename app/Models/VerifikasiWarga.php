<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerifikasiWarga extends Model
{
    use HasFactory;

    protected $table = 'verifikasi_warga';

    public $timestamps = false;

    protected $fillable = [
        'ronde_id',
        'pengguna_id',
        'setuju',
        'jalur',
        'bobot',
        'lampiran_id',
        'alasan',
        'waktu',
    ];

    protected function casts(): array
    {
        return [
            'setuju' => 'boolean',
            'bobot' => 'decimal:1',
            'waktu' => 'datetime',
        ];
    }

    public function ronde(): BelongsTo
    {
        return $this->belongsTo(RondeVerifikasi::class, 'ronde_id');
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function lampiran(): BelongsTo
    {
        return $this->belongsTo(Lampiran::class, 'lampiran_id');
    }
}

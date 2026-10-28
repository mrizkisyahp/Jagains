<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notifikasi extends Model
{
    use HasFactory;

    protected $table = 'notifikasi';

    public $timestamps = false;

    protected $fillable = [
        'pengguna_id',
        'laporan_id',
        'tipe',
        'pesan',
        'kunci_dedup',
        'dibaca_pada',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'dibaca_pada' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenSekaliPakai extends Model
{
    use HasFactory;

    protected $table = 'token_sekali_pakai';

    public $timestamps = false;

    protected $fillable = [
        'jenis',
        'penanda_hash',
        'pengguna_id',
        'kedaluwarsa',
        'dipakai_pada',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'kedaluwarsa' => 'datetime',
            'dipakai_pada' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}

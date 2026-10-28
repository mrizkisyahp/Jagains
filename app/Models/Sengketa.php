<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sengketa extends Model
{
    use HasFactory;

    protected $table = 'sengketa';

    public $timestamps = false;

    protected $fillable = [
        'ronde_id',
        'tenggat',
        'jawaban',
        'alasan_sanggah',
        'waktu_jawab',
        'pelaku_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'tenggat' => 'date',
            'waktu_jawab' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function ronde(): BelongsTo
    {
        return $this->belongsTo(RondeVerifikasi::class, 'ronde_id');
    }

    public function pelaku(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelaku_id');
    }
}

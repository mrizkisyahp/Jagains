<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pengalihan extends Model
{
    use HasFactory;

    protected $table = 'pengalihan';

    public $timestamps = false;

    protected $fillable = [
        'laporan_id',
        'instansi_asal_id',
        'instansi_tujuan_id',
        'alasan',
        'pelaku_id',
        'waktu',
    ];

    protected function casts(): array
    {
        return [
            'waktu' => 'datetime',
        ];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }

    public function instansiAsal(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_asal_id');
    }

    public function instansiTujuan(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_tujuan_id');
    }

    public function pelaku(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelaku_id');
    }
}

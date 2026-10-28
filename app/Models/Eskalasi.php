<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Eskalasi extends Model
{
    use HasFactory;

    protected $table = 'eskalasi';

    public $timestamps = false;

    protected $fillable = [
        'laporan_id',
        'pemicu',
        'tahap',
        'riwayat_masuk_id',
        'ronde_id',
        'created_at',
        'selesai_pada',
        'selesai_alasan',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'selesai_pada' => 'datetime',
        ];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }

    public function riwayatMasuk(): BelongsTo
    {
        return $this->belongsTo(RiwayatStatus::class, 'riwayat_masuk_id');
    }

    public function ronde(): BelongsTo
    {
        return $this->belongsTo(RondeVerifikasi::class, 'ronde_id');
    }

    public function keputusanAuditor(): HasMany
    {
        return $this->hasMany(KeputusanAuditor::class, 'eskalasi_id');
    }
}

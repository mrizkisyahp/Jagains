<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RondeVerifikasi extends Model
{
    use HasFactory;

    protected $table = 'ronde_verifikasi';

    public $timestamps = false;

    protected $fillable = [
        'laporan_id',
        'nomor',
        'k',
        'k_param',
        'lampiran_sesudah_id',
        'mulai',
        'batas_waktu',
        'hasil',
        'selesai_pada',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'nomor' => 'integer',
            'k' => 'decimal:1',
            'k_param' => 'array',
            'mulai' => 'datetime',
            'batas_waktu' => 'datetime',
            'selesai_pada' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }

    public function lampiranSesudah(): BelongsTo
    {
        return $this->belongsTo(Lampiran::class, 'lampiran_sesudah_id');
    }

    public function verifikasiWarga(): HasMany
    {
        return $this->hasMany(VerifikasiWarga::class, 'ronde_id');
    }

    public function sengketa(): HasOne
    {
        return $this->hasOne(Sengketa::class, 'ronde_id');
    }

    public function eskalasi(): HasMany
    {
        return $this->hasMany(Eskalasi::class, 'ronde_id');
    }
}

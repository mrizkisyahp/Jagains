<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AturanSla extends Model
{
    use HasFactory;

    protected $table = 'aturan_sla';

    protected $fillable = [
        'kategori_id',
        'batas_respons_hk',
        'batas_survei_hk',
        'batas_anggaran_hk',
        'batas_jawab_sengketa_hk',
        'batas_verifikasi_hari',
    ];

    protected function casts(): array
    {
        return [
            'batas_respons_hk' => 'integer',
            'batas_survei_hk' => 'integer',
            'batas_anggaran_hk' => 'integer',
            'batas_jawab_sengketa_hk' => 'integer',
            'batas_verifikasi_hari' => 'integer',
        ];
    }

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }
}

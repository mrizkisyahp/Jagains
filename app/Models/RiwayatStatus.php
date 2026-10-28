<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatStatus extends Model
{
    use HasFactory;

    protected $table = 'riwayat_status';

    public $timestamps = false;

    protected $fillable = [
        'laporan_id',
        'kode_transisi',
        'status_lama',
        'status_baru',
        'pelaku_id',
        'instansi_id',
        'catatan',
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

    public function pelaku(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelaku_id');
    }

    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id');
    }
}

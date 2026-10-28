<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BeritaAcara extends Model
{
    use HasFactory;

    protected $table = 'berita_acara';

    public $timestamps = false;

    protected $fillable = [
        'laporan_id',
        'instansi_id',
        'penulis_id',
        'versi',
        'kegiatan',
        'hasil',
        'hambatan',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(Laporan::class, 'laporan_id');
    }

    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id');
    }

    public function penulis(): BelongsTo
    {
        return $this->belongsTo(User::class, 'penulis_id');
    }
}

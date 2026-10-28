<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KeputusanAuditor extends Model
{
    use HasFactory;

    protected $table = 'keputusan_auditor';

    public $timestamps = false;

    protected $fillable = [
        'eskalasi_id',
        'auditor_id',
        'jenis',
        'alasan',
        'perintah',
        'tenggat',
        'waktu',
    ];

    protected function casts(): array
    {
        return [
            'tenggat' => 'date',
            'waktu' => 'datetime',
        ];
    }

    public function eskalasi(): BelongsTo
    {
        return $this->belongsTo(Eskalasi::class, 'eskalasi_id');
    }

    public function auditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auditor_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParameterKuorum extends Model
{
    use HasFactory;

    protected $table = 'parameter_kuorum';

    protected $fillable = [
        'wilayah_id',
        'k_bp',
        'kmin',
        'kmax',
    ];

    protected function casts(): array
    {
        return [
            'k_bp' => 'integer',
            'kmin' => 'decimal:1',
            'kmax' => 'decimal:1',
        ];
    }

    public function wilayah(): BelongsTo
    {
        return $this->belongsTo(Wilayah::class, 'wilayah_id');
    }
}

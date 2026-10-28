<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    use HasFactory;

    protected $table = 'hari_libur';

    protected $primaryKey = 'tanggal';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tanggal',
        'keterangan',
        'sumber',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }
}

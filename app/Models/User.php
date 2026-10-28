<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'username',
        'password',
        'email_hash',
        'peran',
        'kelurahan_id',
        'kelurahan_diubah_pada',
        'instansi_id',
        'status_akun',
        'poin_peringatan',
        'wajib_ganti_sandi',
        'aktivitas_terakhir_pada',
    ];

    protected $hidden = [
        'password',
        'email_hash',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'kelurahan_diubah_pada' => 'datetime',
            'aktivitas_terakhir_pada' => 'datetime',
            'poin_peringatan' => 'integer',
            'wajib_ganti_sandi' => 'boolean',
        ];
    }

    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Wilayah::class, 'kelurahan_id');
    }

    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id');
    }

    public function laporan(): HasMany
    {
        return $this->hasMany(Laporan::class, 'pelapor_id');
    }

    public function dukungan(): HasMany
    {
        return $this->hasMany(Dukungan::class, 'warga_id');
    }

    public function verifikasiWarga(): HasMany
    {
        return $this->hasMany(VerifikasiWarga::class, 'warga_id');
    }

    public function notifikasi(): HasMany
    {
        return $this->hasMany(Notifikasi::class, 'pengguna_id');
    }

    public function auditLog(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'pelaku_id');
    }

    public function tokenSekaliPakai(): HasMany
    {
        return $this->hasMany(TokenSekaliPakai::class, 'pengguna_id');
    }
}

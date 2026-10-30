<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laporan extends Model
{
    use HasFactory;

    protected $table = 'laporan';

    protected $fillable = [
        'nomor_tiket',
        'pelapor_id',
        'kategori_id',
        'instansi_id',
        'kelurahan_id',
        'judul',
        'keterangan',
        'keparahan',
        'lintang',
        'bujur',
        'akurasi_gps_m',
        'lokasi_sumber',
        'status',
        'jenis_pendanaan',
        'tanggal_target_awal',
        'tanggal_target',
        'ronde_sengketa',
        'jumlah_pengalihan',
        'disembunyikan',
        'referensi_sp4n',
        'sla_tahap',
        'sla_riwayat_id',
        'sla_mulai_pada',
        'sla_batas',
        'sla_satuan',
        'sla_jatuh_tempo',
        'diteruskan_pertama_pada',
        'ditutup_pada',
    ];

    protected function casts(): array
    {
        return [
            'lintang' => 'decimal:6',
            'bujur' => 'decimal:6',
            'akurasi_gps_m' => 'decimal:1',
            'tanggal_target_awal' => 'date',
            'tanggal_target' => 'date',
            'ronde_sengketa' => 'integer',
            'jumlah_pengalihan' => 'integer',
            'disembunyikan' => 'boolean',
            'sla_mulai_pada' => 'datetime',
            'sla_batas' => 'integer',
            'sla_jatuh_tempo' => 'date',
            'diteruskan_pertama_pada' => 'datetime',
            'ditutup_pada' => 'datetime',
        ];
    }

    public function pelapor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelapor_id');
    }

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id');
    }

    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Wilayah::class, 'kelurahan_id');
    }

    public function slaRiwayat(): BelongsTo
    {
        return $this->belongsTo(RiwayatStatus::class, 'sla_riwayat_id');
    }

    public function riwayatStatus(): HasMany
    {
        return $this->hasMany(RiwayatStatus::class, 'laporan_id');
    }

    public function lampiran(): HasMany
    {
        return $this->hasMany(Lampiran::class, 'laporan_id');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'laporan_id');
    }

    public function pengalihan(): HasMany
    {
        return $this->hasMany(Pengalihan::class, 'laporan_id');
    }

    public function dukungan(): HasMany
    {
        return $this->hasMany(Dukungan::class, 'laporan_id');
    }

    public function rondeVerifikasi(): HasMany
    {
        return $this->hasMany(RondeVerifikasi::class, 'laporan_id');
    }

    public function sengketa(): HasMany
    {
        return $this->hasMany(Sengketa::class, 'laporan_id');
    }

    public function eskalasi(): HasMany
    {
        return $this->hasMany(Eskalasi::class, 'laporan_id');
    }

    public function notifikasi(): HasMany
    {
        return $this->hasMany(Notifikasi::class, 'laporan_id');
    }

    public function auditLog(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'laporan_id');
    }

    public function pelanggaran(): HasMany
    {
        return $this->hasMany(LaporanPelanggaran::class, 'laporan_id');
    }
}

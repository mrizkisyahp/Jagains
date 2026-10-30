<?php

namespace App\Services;

use App\Models\Kategori;
use App\Models\Laporan;
use Illuminate\Support\Collection;

class DeteksiLaporanSerupaService
{
    /**
     * Status tiket yang sudah final/tertutup (tidak perlu digabungkan).
     */
    public const STATUS_FINAL = [
        'TERTUTUP_WARGA',
        'TERTUTUP_AUDITOR',
        'DITOLAK',
    ];

    /**
     * Mencari maksimal 3 tiket terbuka serupa dalam radius kategori (FR-LAP-05).
     *
     * @return Collection<int, array{id: int, nomor_tiket: string, judul: string, keterangan: string, status: string, jarak_m: float, jumlah_dukungan: int, foto_url: ?string}>
     */
    public function cariTiketSerupa(int $kategoriId, float $lat, float $lng, ?float $akurasiGpsM = null): Collection
    {
        $kategori = Kategori::find($kategoriId);
        $radiusDasar = $kategori?->radius_gabung_m ?? 25;
        $toleransiGps = min((float) ($akurasiGpsM ?? 0), 50.0);
        $radiusMaksimal = $radiusDasar + $toleransiGps;

        // Formula Haversine (dalam satuan meter) di PostgreSQL
        $haversineSql = 'ROUND((6371000 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(?)) * cos(radians(lintang)) * cos(radians(bujur) - radians(?)) +
                sin(radians(?)) * sin(radians(lintang))
            ))
        ))::numeric, 1)';

        $kandidat = Laporan::select([
            'id',
            'nomor_tiket',
            'judul',
            'keterangan',
            'status',
            'lintang',
            'bujur',
            'created_at',
        ])
            ->selectRaw("{$haversineSql} AS jarak_m", [$lat, $lng, $lat])
            ->where('kategori_id', $kategoriId)
            ->whereNotIn('status', self::STATUS_FINAL)
            ->whereRaw("{$haversineSql} <= ?", [$lat, $lng, $lat, $radiusMaksimal])
            ->withCount('dukungan')
            ->with(['lampiran' => fn ($q) => $q->where('tahap', 'awal')->orderBy('id', 'asc')])
            ->orderByRaw("{$haversineSql} ASC", [$lat, $lng, $lat])
            ->limit(3)
            ->get();

        return $kandidat->map(function (Laporan $tiket) {
            $lampiranAwal = $tiket->lampiran->first();
            $fotoUrl = $lampiranAwal ? asset('storage/'.$lampiranAwal->path) : null;

            return [
                'id' => $tiket->id,
                'nomor_tiket' => $tiket->nomor_tiket,
                'judul' => $tiket->judul,
                'keterangan' => $tiket->keterangan,
                'status' => $tiket->status,
                'jarak_m' => (float) $tiket->jarak_m,
                'jumlah_dukungan' => (int) $tiket->dukungan_count,
                'foto_url' => $fotoUrl,
            ];
        });
    }
}

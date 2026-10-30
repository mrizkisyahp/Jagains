<?php

namespace App\Services;

use App\Models\AturanRouting;
use App\Models\Wilayah;

class RoutingTiketService
{
    /**
     * Menentukan disposisi dinas berdasarkan spesifisitas wilayah dan prioritas aturan (BR-STS-05).
     *
     * Urutan hierarki spesifisitas:
     * 1. Kelurahan (paling spesifik)
     * 2. Kecamatan
     * 3. Kota Depok (paling umum)
     *
     * @return array{instansi_id: ?int, status: string}
     */
    public function tentukanRouting(int $kategoriId, Wilayah $kelurahan): array
    {
        $kelurahanId = $kelurahan->id;
        $kecamatanId = $kelurahan->induk_id;
        $kotaId = $kelurahan->induk?->induk_id ?? Wilayah::where('tingkat', 'kota')->value('id');

        $wilayahIds = array_values(array_filter([$kelurahanId, $kecamatanId, $kotaId]));

        $aturanList = AturanRouting::where('kategori_id', $kategoriId)
            ->whereIn('wilayah_id', $wilayahIds)
            ->whereHas('instansi', fn ($q) => $q->where('aktif', true))
            ->get();

        if ($aturanList->isEmpty()) {
            return [
                'instansi_id' => null,
                'status' => 'PERLU_ROUTING',
            ];
        }

        // Urutkan berdasarkan spesifisitas wilayah (Kelurahan > Kecamatan > Kota) lalu prioritas
        $terpilih = $aturanList->sortBy(function (AturanRouting $aturan) use ($kelurahanId, $kecamatanId) {
            $bobotWilayah = match ($aturan->wilayah_id) {
                $kelurahanId => 1,
                $kecamatanId => 2,
                default => 3,
            };

            return sprintf('%d-%05d', $bobotWilayah, $aturan->prioritas);
        })->first();

        return [
            'instansi_id' => $terpilih->instansi_id,
            'status' => 'DITERUSKAN',
        ];
    }
}


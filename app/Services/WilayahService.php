<?php

namespace App\Services;

use App\Models\Wilayah;

class WilayahService
{
    /**
     * Menentukan kelurahan dari titik koordinat (lintang & bujur).
     * Titik koordinat hanya diproses di memori dan langsung dibuang tanpa disimpan.
     */
    public function kelurahanDariTitik(float $lat, float $lng): ?Wilayah
    {
        // 1. Cek berdasarkan Bounding Box kelurahan terdekat ke titik tengah kelurahan
        $kandidat = Wilayah::where('tingkat', 'kelurahan')
            ->where('min_lintang', '<=', $lat)
            ->where('max_lintang', '>=', $lat)
            ->where('min_bujur', '<=', $lng)
            ->where('max_bujur', '>=', $lng)
            ->orderByRaw('POWER((min_lintang + max_lintang)/2.0 - ?, 2) + POWER((min_bujur + max_bujur)/2.0 - ?, 2)', [$lat, $lng])
            ->with(['induk.induk'])
            ->first();

        if ($kandidat) {
            return $kandidat;
        }

        // 2. Fallback jika koordinat berada sedikit di luar batas bounding box (~5 km) di wilayah layanan
        return Wilayah::where('tingkat', 'kelurahan')
            ->whereBetween('min_lintang', [$lat - 0.05, $lat + 0.05])
            ->whereBetween('min_bujur', [$lng - 0.05, $lng + 0.05])
            ->orderByRaw('POWER((min_lintang + max_lintang)/2.0 - ?, 2) + POWER((min_bujur + max_bujur)/2.0 - ?, 2)', [$lat, $lng])
            ->with(['induk.induk'])
            ->first();
    }

    /**
     * Mengambil seluruh daftar kelurahan beserta hierarki kecamatan dan kotanya.
     */
    public function getDaftarKelurahanDepok(): array
    {
        return Wilayah::where('tingkat', 'kelurahan')
            ->with(['induk.induk'])
            ->orderBy('nama')
            ->get(['id', 'induk_id', 'nama', 'tingkat'])
            ->map(function ($kel) {
                return [
                    'id' => $kel->id,
                    'nama' => $kel->nama,
                    'tingkat' => $kel->tingkat,
                    'kecamatan_id' => $kel->induk_id,
                    'kecamatan_nama' => $kel->induk?->nama,
                    'kota_id' => $kel->induk?->induk_id,
                    'kota_nama' => $kel->induk?->induk?->nama,
                    'induk' => $kel->induk ? [
                        'id' => $kel->induk->id,
                        'nama' => $kel->induk->nama,
                        'tingkat' => $kel->induk->tingkat,
                        'induk' => $kel->induk->induk ? [
                            'id' => $kel->induk->induk->id,
                            'nama' => $kel->induk->induk->nama,
                            'tingkat' => $kel->induk->induk->tingkat,
                        ] : null,
                    ] : null,
                ];
            })
            ->toArray();
    }
}

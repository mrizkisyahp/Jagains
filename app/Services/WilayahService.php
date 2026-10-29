<?php

namespace App\Services;

use App\Models\Wilayah;
use Illuminate\Database\Eloquent\Collection;

class WilayahService
{
    /**
     * Menentukan kelurahan dari titik koordinat (lintang & bujur).
     * Titik koordinat hanya diproses di memori dan langsung dibuang tanpa disimpan.
     */
    public function kelurahanDariTitik(float $lat, float $lng): ?Wilayah
    {
        // 1. Cek berdasarkan Bounding Box kelurahan (indeks cepat)
        $kandidat = Wilayah::where('tingkat', 'kelurahan')
            ->where('min_lintang', '<=', $lat)
            ->where('max_lintang', '>=', $lat)
            ->where('min_bujur', '<=', $lng)
            ->where('max_bujur', '>=', $lng)
            ->with('induk')
            ->first();

        if ($kandidat) {
            return $kandidat;
        }

        // 2. Jika geometri GeoJSON poligon tersedia, dapat dievaluasi lebih lanjut dengan algoritma point-in-polygon
        // (Untuk MVP jika bbox tidak mencakup, kembalikan null / di luar Depok)
        return null;
    }

    /**
     * Mengambil seluruh daftar kelurahan di Kota Depok beserta nama kecamatannya (untuk select dropdown).
     */
    public function getDaftarKelurahanDepok(): Collection
    {
        return Wilayah::where('tingkat', 'kelurahan')
            ->with(['induk' => function ($query) {
                $query->select('id', 'nama', 'tingkat');
            }])
            ->orderBy('nama')
            ->get(['id', 'induk_id', 'nama', 'tingkat']);
    }
}

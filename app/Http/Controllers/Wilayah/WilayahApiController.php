<?php

namespace App\Http\Controllers\Wilayah;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wilayah\DeteksiKelurahanRequest;
use App\Services\WilayahService;
use Illuminate\Http\JsonResponse;

class WilayahApiController extends Controller
{
    public function __construct(
        private WilayahService $wilayahService
    ) {}

    /**
     * Menentukan kelurahan domisili dari koordinat GPS yang dikirimkan.
     * Koordinat tidak dicatat ke log aplikasi atau database (NFR-PRV-01).
     */
    public function deteksiKelurahan(DeteksiKelurahanRequest $request): JsonResponse
    {
        $lat = (float) $request->input('latitude');
        $lng = (float) $request->input('longitude');

        $kelurahan = $this->wilayahService->kelurahanDariTitik($lat, $lng);

        if (! $kelurahan) {
            return response()->json([
                'kelurahan_id' => null,
                'nama' => null,
                'kecamatan' => null,
                'pesan' => 'Lokasi berada di luar cakupan wilayah Kota Depok atau poligon belum terpetakan.',
            ]);
        }

        return response()->json([
            'kelurahan_id' => $kelurahan->id,
            'nama' => $kelurahan->nama,
            'kecamatan' => $kelurahan->induk?->nama,
        ]);
    }

    /**
     * Mengambil daftar kelurahan se-Kota Depok untuk dropdown manual.
     */
    public function daftarKelurahan(): JsonResponse
    {
        $kelurahans = $this->wilayahService->getDaftarKelurahanDepok();

        return response()->json($kelurahans);
    }
}

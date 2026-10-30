<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laporan\CekLaporanSerupaRequest;
use App\Services\DeteksiLaporanSerupaService;
use Illuminate\Http\JsonResponse;

class LaporanWargaController extends Controller
{
    /**
     * Memeriksa keberadaan laporan serupa terbuka dalam radius geospasial (FR-LAP-05).
     */
    public function cekSerupa(CekLaporanSerupaRequest $request, DeteksiLaporanSerupaService $service): JsonResponse
    {
        $kandidat = $service->cariTiketSerupa(
            (int) $request->validated('kategori_id'),
            (float) $request->validated('lintang'),
            (float) $request->validated('bujur'),
            $request->filled('akurasi_gps_m') ? (float) $request->validated('akurasi_gps_m') : null,
        );

        return response()->json([
            'ada_kandidat' => $kandidat->isNotEmpty(),
            'total' => $kandidat->count(),
            'kandidat' => $kandidat->values()->all(),
        ]);
    }
}

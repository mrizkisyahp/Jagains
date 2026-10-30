<?php

namespace App\Http\Controllers\Tiket;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tiket\LaporKontenRequest;
use App\Services\TiketDetailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TiketInteraksiController extends Controller
{
    /**
     * Memberikan atau membatalkan dukungan warga pada tiket aduan (FR-INT-01).
     */
    public function toggleDukungan(Request $request, string $nomorTiket, TiketDetailService $service): JsonResponse
    {
        $user = $request->user();
        $hasil = $service->toggleDukungan($nomorTiket, $user);

        return response()->json($hasil, $hasil['status_code']);
    }

    /**
     * Mengajukan pelaporan pelanggaran konten ke antrean moderasi admin (FR-INT-03).
     */
    public function laporkanKonten(LaporKontenRequest $request, string $nomorTiket, TiketDetailService $service): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $hasil = $service->laporkanKonten(
            $nomorTiket,
            $user,
            $validated['alasan'],
            $validated['catatan'] ?? null
        );

        return response()->json($hasil, $hasil['status_code']);
    }
}

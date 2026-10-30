<?php

namespace App\Http\Controllers\Peta;

use App\Http\Controllers\Controller;
use App\Services\PetaLaporanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetaLaporanController extends Controller
{
    public function __construct(
        protected PetaLaporanService $petaService
    ) {}

    /**
     * Menampilkan Landing Page publik Kota Depok dengan Peta Sebaran di bagian bawah.
     */
    public function landingPage(Request $request): Response
    {
        $masterFilter = $this->petaService->ambilMasterFilter();

        return Inertia::render('landing', [
            'masterFilter' => $masterFilter,
        ]);
    }

    /**
     * Menampilkan antarmuka peta publik sebaran laporan (FR-PET-01).
     * Dapat diakses oleh Publik tanpa kewajiban login dan oleh pengguna terautentikasi.
     */
    public function tampilkanPeta(Request $request): Response
    {
        $masterFilter = $this->petaService->ambilMasterFilter();

        return Inertia::render('warga/peta', [
            'masterFilter' => $masterFilter,
            'filterAwal' => [
                'kategori_id' => $request->query('kategori_id'),
                'kecamatan_id' => $request->query('kecamatan_id'),
                'kondisi_sla' => $request->query('kondisi_sla'),
                'instansi_id' => $request->query('instansi_id'),
            ],
        ]);
    }

    /**
     * Endpoint API JSON sebaran titik penanda laporan berstatus SLA (FR-PET-01 s/d FR-PET-03).
     * Meniadakan seluruh data identitas pelapor untuk privasi publik (Zero-Knowledge).
     */
    public function ambilDataTitik(Request $request): JsonResponse
    {
        $filters = [
            'kategori_id' => $request->query('kategori_id') ? (int) $request->query('kategori_id') : null,
            'kecamatan_id' => $request->query('kecamatan_id') ? (int) $request->query('kecamatan_id') : null,
            'kondisi_sla' => $request->query('kondisi_sla'),
            'instansi_id' => $request->query('instansi_id') ? (int) $request->query('instansi_id') : null,
            'rentang_waktu' => $request->query('rentang_waktu') ? (int) $request->query('rentang_waktu') : null,
            'search' => $request->query('search'),
        ];

        $titikList = $this->petaService->ambilDataTitik($filters);

        return response()->json([
            'status' => 'success',
            'total' => count($titikList),
            'data' => $titikList,
        ]);
    }
}

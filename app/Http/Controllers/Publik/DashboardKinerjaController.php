<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Services\DashboardKinerjaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardKinerjaController extends Controller
{
    public function __construct(
        protected DashboardKinerjaService $dashboardService
    ) {}

    /**
     * Menampilkan dashboard perbandingan kinerja publik (FR-DSH-01).
     */
    public function index(Request $request): Response
    {
        $periode = $request->query('periode', 'semua');
        if (! in_array($periode, ['30_hari', '90_hari', 'semua'], true)) {
            $periode = 'semua';
        }

        $dataKecamatan = $this->dashboardService->ambilDataPerbandinganKecamatan($periode);
        $dataInstansi = $this->dashboardService->ambilDataPerbandinganInstansi($periode);
        $ambangBatas = $this->dashboardService->getAmbangBatas();

        return Inertia::render('dashboard', [
            'dataKecamatan' => $dataKecamatan,
            'dataInstansi' => $dataInstansi,
            'periodeAktif' => $periode,
            'ambangBatas' => $ambangBatas,
        ]);
    }
}

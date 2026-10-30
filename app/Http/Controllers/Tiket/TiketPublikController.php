<?php

namespace App\Http\Controllers\Tiket;

use App\Http\Controllers\Controller;
use App\Services\TiketDetailService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TiketPublikController extends Controller
{
    /**
     * Menampilkan halaman detail tiket publik transparan (FR-TKT-01).
     * Dapat diakses secara terbuka tanpa perlu login (FR-TKT-01b).
     */
    public function tampilkanDetail(Request $request, string $nomorTiket, TiketDetailService $service): Response
    {
        $user = $request->user();
        $tiket = $service->ambilDetailTiket($nomorTiket, $user);

        if (! $tiket) {
            abort(404, 'Tiket laporan tidak ditemukan.');
        }

        return Inertia::render('tiket/detail', [
            'tiket' => $tiket,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Auditor;

use App\Http\Controllers\Controller;
use App\Services\AuditorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolaPengawasanController extends Controller
{
    public function __construct(
        protected AuditorService $service
    ) {}

    /**
     * Menampilkan dasbor analitik pola pengawasan dan kepatuhan instansi (FR-AUD-03).
     */
    public function index(Request $request): Response
    {
        $analitik = $this->service->ambilPolaPengawasan($request->all());

        return Inertia::render('auditor/pola-pengawasan', [
            'analitik' => $analitik,
        ]);
    }
}

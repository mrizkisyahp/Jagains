<?php

namespace App\Http\Controllers\Auditor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auditor\KeputusanAuditorRequest;
use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Services\AuditorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AntreanAuditorController extends Controller
{
    public function __construct(
        protected AuditorService $service
    ) {}

    /**
     * Menampilkan antarmuka antrean perkara eskalasi Auditor (FR-AUD-01).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = $request->only(['tab', 'q', 'kategori_id', 'instansi_id']);

        $antrean = $this->service->ambilAntreanEskalasi($user, $filters, perPage: 9);

        $kategoriList = Kategori::query()
            ->where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama']);

        $instansiList = Instansi::query()
            ->where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'singkatan']);

        // Hitung ringkasan tab
        $ringkasan = [
            'semua' => Eskalasi::whereNull('selesai_pada')->count(),
            'sla' => Eskalasi::whereNull('selesai_pada')->where('pemicu', 'SLA')->count(),
            'sanggahan' => Eskalasi::whereNull('selesai_pada')->where('pemicu', 'SANGGAHAN')->count(),
            'ronde' => Eskalasi::whereNull('selesai_pada')->where('pemicu', 'RONDE')->count(),
            'tanpa_kuorum' => Eskalasi::whereNull('selesai_pada')->where('pemicu', 'TANPA_KUORUM')->count(),
        ];

        return Inertia::render('auditor/antrean', [
            'antrean' => $antrean,
            'kategoriList' => $kategoriList,
            'instansiList' => $instansiList,
            'ringkasan' => $ringkasan,
            'filters' => $filters,
        ]);
    }

    /**
     * Mengambil detail perkara eskalasi untuk telaah sidang (FR-AUD-01).
     */
    public function show(Request $request, Eskalasi $eskalasi): JsonResponse|Response
    {
        $detail = $this->service->ambilDetailEskalasi($request->user(), $eskalasi->id);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json($detail);
        }

        return Inertia::render('auditor/detail', [
            'detail' => $detail,
        ]);
    }

    /**
     * Menetapkan keputusan resmi Auditor Independen atas perkara eskalasi (FR-AUD-02).
     */
    public function putuskan(KeputusanAuditorRequest $request, Eskalasi $eskalasi): JsonResponse|RedirectResponse
    {
        $hasil = $this->service->putuskanEskalasi(
            $request->user(),
            $eskalasi,
            $request->validated()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => $hasil['pesan'],
                'status_laporan' => $hasil['status_laporan'],
            ]);
        }

        return redirect()->route('auditor.antrean')
            ->with('success', $hasil['pesan'])
            ->with('sukses', $hasil['pesan']);
    }
}

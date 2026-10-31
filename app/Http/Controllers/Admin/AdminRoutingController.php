<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DisposisiRoutingRequest;
use App\Models\Instansi;
use App\Models\Laporan;
use App\Services\AdminRoutingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminRoutingController extends Controller
{
    public function __construct(
        protected AdminRoutingService $routingService
    ) {}

    /**
     * Menampilkan antrean tiket berstatus PERLU_ROUTING (FR-ADM-05).
     */
    public function index(Request $request): Response
    {
        $antrean = Laporan::with(['kategori:id,nama', 'kelurahan:id,nama,induk_id', 'lampiran'])
            ->where('status', 'PERLU_ROUTING')
            ->orderBy('created_at', 'asc')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Laporan $l) => [
                'id' => $l->id,
                'nomor_tiket' => $l->nomor_tiket,
                'judul' => $l->judul,
                'keterangan' => $l->keterangan,
                'keparahan' => $l->keparahan,
                'status' => $l->status,
                'kategori' => $l->kategori?->nama,
                'kelurahan' => $l->kelurahan?->nama,
                'foto' => $l->lampiran->first()?->path,
                'lintang' => (float) $l->lintang,
                'bujur' => (float) $l->bujur,
                'created_at' => $l->created_at->toISOString(),
            ]);

        $daftarInstansi = Instansi::where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'singkatan']);

        return Inertia::render('admin/antrean-routing', [
            'antrean' => $antrean,
            'daftarInstansi' => $daftarInstansi,
        ]);
    }

    /**
     * Melakukan disposisi routing manual ke instansi teknis pilihan admin (FR-ADM-05).
     */
    public function disposisi(DisposisiRoutingRequest $request, string $nomor_tiket): RedirectResponse
    {
        $laporan = Laporan::where('nomor_tiket', $nomor_tiket)->firstOrFail();

        $this->routingService->disposisiManual(
            admin: $request->user(),
            laporan: $laporan,
            instansiId: (int) $request->validated('instansi_id'),
            catatan: $request->validated('catatan')
        );

        return back()->with('sukses', "Tiket {$nomor_tiket} berhasil didisposisikan.");
    }
}

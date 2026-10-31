<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Http\Requests\Warga\KirimSuaraVerifikasiRequest;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Services\VerifikasiWargaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerifikasiWargaController extends Controller
{
    public function __construct(
        protected VerifikasiWargaService $verifikasiService
    ) {}

    /**
     * Menampilkan daftar tiket yang menunggu verifikasi di kelurahan warga (FR-VER-01).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $daftarTiket = $this->verifikasiService->ambilAntreanVerifikasi(
            $user,
            $request->only(['tab', 'q', 'kategori_id']),
            perPage: 9
        );

        $kategoriList = Kategori::query()
            ->where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama']);

        return Inertia::render('warga/verifikasi', [
            'daftarTiket' => $daftarTiket,
            'kategoriList' => $kategoriList,
            'kelurahan' => $user->kelurahan ? [
                'id' => $user->kelurahan->id,
                'nama' => $user->kelurahan->nama,
            ] : null,
            'filters' => $request->only(['tab', 'q', 'kategori_id']),
        ]);
    }

    /**
     * Mengambil data detail verifikasi tiket untuk modal voting (API/JSON).
     */
    public function show(Request $request, string $nomorTiket)
    {
        $detail = $this->verifikasiService->ambilDetailVerifikasi($request->user(), $nomorTiket);

        return response()->json($detail);
    }

    /**
     * Memproses pengiriman suara verifikasi warga (FR-VER-02, FR-VER-03, FR-VER-04).
     */
    public function store(KirimSuaraVerifikasiRequest $request, string $nomorTiket): RedirectResponse
    {
        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->firstOrFail();

        $hasil = $this->verifikasiService->kirimSuara(
            $request->user(),
            $laporan,
            $request->validated()
        );

        return back()->with('sukses', $hasil['pesan']);
    }
}

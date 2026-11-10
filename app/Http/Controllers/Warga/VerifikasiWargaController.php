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
            perPage: 6
        );

        $counts = $this->verifikasiService->hitungStatistikAntrean($user);

        $kategoriList = Kategori::query()
            ->where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama']);

        return Inertia::render('warga/verifikasi', [
            'daftarTiket' => $daftarTiket,
            'kategoriList' => $kategoriList,
            'counts' => $counts,
            'kelurahan' => $user->kelurahan ? [
                'id' => $user->kelurahan->id,
                'nama' => $user->kelurahan->nama,
            ] : null,
            'filters' => $request->only(['tab', 'q', 'kategori_id']),
        ]);
    }

    /**
     * Menampilkan halaman proses verifikasi aduan warga atau data JSON jika diminta (FR-VER-02, FR-VER-07).
     */
    public function show(Request $request, string $nomorTiket)
    {
        $detail = $this->verifikasiService->ambilDetailVerifikasi($request->user(), $nomorTiket);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json($detail);
        }

        return Inertia::render('warga/verifikasi-proses', [
            'detail' => $detail,
            'from' => $request->query('from'),
        ]);
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

        $from = $request->input('from') ?? $request->query('from');
        if ($from === 'tiket') {
            return redirect()->route('tiket.detail', $nomorTiket)->with('sukses', $hasil['pesan']);
        }

        if ($from === 'riwayat') {
            return redirect()->route('warga.riwayat')->with('sukses', $hasil['pesan']);
        }

        return redirect()->route('warga.verifikasi')->with('sukses', $hasil['pesan']);
    }
}

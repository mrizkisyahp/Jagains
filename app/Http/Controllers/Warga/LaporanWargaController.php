<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laporan\CekLaporanSerupaRequest;
use App\Http\Requests\Warga\BuatLaporanRequest;
use App\Http\Requests\Warga\DukungLaporanSerupaRequest;
use App\Models\Dukungan;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Services\BatasLaporanService;
use App\Services\DeteksiLaporanSerupaService;
use App\Services\LaporanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaporanWargaController extends Controller
{
    /**
     * Menampilkan antarmuka form wizard 4-tahap pelaporan aduan warga.
     */
    public function tampilkanFormLapor(Request $request, BatasLaporanService $batasService): Response
    {
        $kategoriList = Kategori::where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'radius_gabung_m']);

        $kuota = $batasService->periksaKuota($request->user());

        return Inertia::render('warga/lapor', [
            'kategoriList' => $kategoriList,
            'kuota' => $kuota,
        ]);
    }

    /**
     * Memproses pengiriman laporan aduan baru oleh warga (FR-LAP-01).
     */
    public function buatLaporan(BuatLaporanRequest $request, LaporanService $laporanService): JsonResponse
    {
        $laporan = $laporanService->buatLaporan($request->user(), $request->validated());

        return response()->json([
            'sukses' => true,
            'pesan' => 'Laporan aduan Anda berhasil dikirim dan tercatat dalam sistem.',
            'nomor_tiket' => $laporan->nomor_tiket,
            'laporan' => [
                'id' => $laporan->id,
                'nomor_tiket' => $laporan->nomor_tiket,
                'judul' => $laporan->judul,
                'status' => $laporan->status,
                'diteruskan_pada' => $laporan->diteruskan_pertama_pada,
            ],
        ], 201);
    }

    /**
     * Memberikan dukungan pada laporan terbuka yang sudah ada (FR-LAP-05 & FR-INT-01).
     */
    public function dukungLaporan(DukungLaporanSerupaRequest $request): JsonResponse
    {
        $laporan = Laporan::findOrFail($request->validated('laporan_id'));

        // Cek apakah tiket sudah final
        if (in_array($laporan->status, ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'], true)) {
            return response()->json([
                'sukses' => false,
                'pesan' => 'Laporan ini sudah ditutup sehingga tidak dapat menerima dukungan lagi.',
            ], 422);
        }

        Dukungan::firstOrCreate([
            'laporan_id' => $laporan->id,
            'pengguna_id' => $request->user()->id,
        ]);

        return response()->json([
            'sukses' => true,
            'pesan' => "Dukungan Anda berhasil dicatat untuk laporan {$laporan->nomor_tiket}.",
            'total_dukungan' => $laporan->dukungan()->count(),
        ]);
    }

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

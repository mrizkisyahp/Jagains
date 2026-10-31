<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BukaIdentitasPelaporRequest;
use App\Models\Laporan;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

class IdentitasPelaporController extends Controller
{
    /**
     * Membuka profil identitas pelapor khusus untuk investigasi admin atau auditor (FR-ADM-08).
     */
    public function buka(BukaIdentitasPelaporRequest $request, string $nomor_tiket): JsonResponse
    {
        $laporan = Laporan::with(['pelapor.kelurahan'])->where('nomor_tiket', $nomor_tiket)->firstOrFail();
        $pelapor = $laporan->pelapor;

        if (! $pelapor) {
            return response()->json([
                'sukses' => false,
                'pesan' => 'Pelapor tiket tidak ditemukan dalam sistem.',
            ], 404);
        }

        $alasan = $request->validated('alasan');

        // Catat aksi sensitif ini ke dalam audit_log (Anti-Tamper Append-Only)
        AuditLogService::catat(
            aksi: 'BUKA_IDENTITAS_PELAPOR',
            objekTipe: 'laporan',
            objekId: $laporan->id,
            nilaiLama: ['status_anonim' => true],
            nilaiBaru: ['status_anonim' => false, 'pelapor_id' => $pelapor->id, 'username' => $pelapor->username],
            alasan: $alasan,
            laporanId: $laporan->id,
            pelakuId: $request->user()->id
        );

        $jumlahLaporanWarga = Laporan::where('pelapor_id', $pelapor->id)->count();

        return response()->json([
            'sukses' => true,
            'pesan' => 'Identitas pelapor berhasil dibuka dan dicatat dalam audit trail.',
            'pelapor' => [
                'id' => $pelapor->id,
                'username' => $pelapor->username,
                'status_akun' => $pelapor->status_akun,
                'poin_peringatan' => $pelapor->poin_peringatan,
                'kelurahan' => $pelapor->kelurahan?->nama,
                'jumlah_laporan' => $jumlahLaporanWarga,
                'terdaftar_pada' => $pelapor->created_at->toISOString(),
            ],
        ]);
    }
}

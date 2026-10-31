<?php

namespace App\Services;

use App\Models\LaporanPelanggaran;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ModerasiKontenService
{
    /**
     * Menjalankan keputusan moderasi konten terhadap aduan pelanggaran (FR-ADM-06).
     */
    public function eksekusiModerasi(User $admin, LaporanPelanggaran $pelanggaran, string $tindakan, string $catatan): LaporanPelanggaran
    {
        return DB::transaction(function () use ($admin, $pelanggaran, $tindakan, $catatan) {
            $laporan = $pelanggaran->laporan;
            $pelaporTiket = $laporan->pelapor;

            $dataSebelum = [
                'disembunyikan' => $laporan->disembunyikan,
                'poin_peringatan' => $pelaporTiket?->poin_peringatan,
                'status_akun' => $pelaporTiket?->status_akun,
            ];

            // 1. Jalankan konsekuensi tindakan
            match ($tindakan) {
                'disembunyikan' => $laporan->update(['disembunyikan' => true]),
                'peringatan' => $pelaporTiket?->increment('poin_peringatan'),
                'dibekukan' => $pelaporTiket?->update(['status_akun' => 'dibekukan']),
                'diabaikan' => null,
            };

            // 2. Mutasi status pelanggaran
            $pelanggaran->update([
                'status' => 'selesai',
                'tindakan' => $tindakan,
                'moderator_id' => $admin->id,
                'catatan_moderator' => $catatan,
            ]);

            $dataSesudah = [
                'tindakan' => $tindakan,
                'disembunyikan' => $laporan->fresh()->disembunyikan,
                'poin_peringatan' => $pelaporTiket?->fresh()->poin_peringatan,
                'status_akun' => $pelaporTiket?->fresh()->status_akun,
            ];

            // 3. Catat audit log permanen
            AuditLogService::catat(
                aksi: 'MODERASI_KONTEN',
                objekTipe: 'laporan_pelanggaran',
                objekId: $pelanggaran->id,
                nilaiLama: $dataSebelum,
                nilaiBaru: $dataSesudah,
                alasan: $catatan,
                laporanId: $laporan->id,
                pelakuId: $admin->id
            );

            return $pelanggaran->fresh(['laporan', 'pelapor', 'moderator']);
        });
    }
}

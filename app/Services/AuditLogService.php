<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * Mencatat peristiwa berprivilese ke tabel immutable audit_log.
     */
    public static function catat(
        string $aksi,
        ?string $objekTipe = null,
        ?int $objekId = null,
        ?array $nilaiLama = null,
        ?array $nilaiBaru = null,
        ?string $alasan = null,
        ?int $laporanId = null,
        ?int $pelakuId = null,
        ?Request $request = null
    ): AuditLog {
        $req = $request ?? (app()->bound('request') ? request() : null);

        $konteks = [
            'ip' => $req?->ip(),
            'user_agent' => $req?->userAgent(),
        ];

        return AuditLog::create([
            'pelaku_id' => $pelakuId ?? auth()->id(),
            'aksi' => $aksi,
            'objek_tipe' => $objekTipe,
            'objek_id' => $objekId,
            'laporan_id' => $laporanId,
            'nilai_lama' => $nilaiLama,
            'nilai_baru' => $nilaiBaru,
            'alasan' => $alasan,
            'konteks' => $konteks,
            'waktu' => now(),
        ]);
    }
}

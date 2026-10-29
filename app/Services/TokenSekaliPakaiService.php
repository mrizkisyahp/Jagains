<?php

namespace App\Services;

use App\Models\TokenSekaliPakai;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TokenSekaliPakaiService
{
    /**
     * Membuat token sekali pakai baru dengan masa berlaku (menit).
     *
     * @return array{plain_token: string, penanda_hash: string, model: TokenSekaliPakai}
     */
    public function createToken(string $jenis, ?int $penggunaId = null, int $minutes = 30): array
    {
        $plainToken = Str::random(64);
        $penandaHash = hash('sha256', $plainToken);

        $model = TokenSekaliPakai::create([
            'jenis' => $jenis,
            'penanda_hash' => $penandaHash,
            'pengguna_id' => $penggunaId,
            'kedaluwarsa' => now()->addMinutes($minutes),
            'dipakai_pada' => null,
            'created_at' => now(),
        ]);

        return [
            'plain_token' => $plainToken,
            'penanda_hash' => $penandaHash,
            'model' => $model,
        ];
    }

    /**
     * Memverifikasi dan mengonsumsi token sekali pakai secara atomik.
     * Mengembalikan model TokenSekaliPakai jika valid, atau null jika tidak valid/kedaluwarsa/sudah dipakai.
     */
    public function verifyAndConsume(string $plainToken, string $jenis): ?TokenSekaliPakai
    {
        $penandaHash = hash('sha256', $plainToken);

        return DB::transaction(function () use ($penandaHash, $jenis) {
            $tokenRecord = TokenSekaliPakai::where('penanda_hash', $penandaHash)
                ->where('jenis', $jenis)
                ->whereNull('dipakai_pada')
                ->where('kedaluwarsa', '>', now())
                ->lockForUpdate()
                ->first();

            if (! $tokenRecord) {
                return null;
            }

            $tokenRecord->update([
                'dipakai_pada' => now(),
            ]);

            return $tokenRecord;
        });
    }

    /**
     * Memeriksa apakah token masih valid tanpa mengonsumsinya (misal untuk menampilkan form).
     */
    public function findValidToken(string $plainToken, string $jenis): ?TokenSekaliPakai
    {
        $penandaHash = hash('sha256', $plainToken);

        return TokenSekaliPakai::where('penanda_hash', $penandaHash)
            ->where('jenis', $jenis)
            ->whereNull('dipakai_pada')
            ->where('kedaluwarsa', '>', now())
            ->first();
    }
}

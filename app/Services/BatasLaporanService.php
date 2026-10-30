<?php

namespace App\Services;

use App\Models\Laporan;
use App\Models\User;

class BatasLaporanService
{
    /**
     * Batas pelaporan per akun warga dalam 1 jam: 5 laporan (P-17 & SRS AS-05).
     */
    public const BATAS_LAPORAN_PER_JAM = 5;

    /**
     * Memeriksa sisa kuota pelaporan warga dalam jendela 60 menit terakhir (ST-13).
     *
     * @return array{diizinkan: bool, laporan_terakhir_1_jam: int, sisa_kuota: int, menit_tunggu: ?int, pesan: ?string}
     */
    public function periksaKuota(User $warga): array
    {
        $satuJamLalu = now()->subHour();

        $laporanQuery = Laporan::where('pelapor_id', $warga->id)
            ->where('created_at', '>=', $satuJamLalu)
            ->orderBy('created_at', 'asc');

        $jumlah = $laporanQuery->count();
        $sisaKuota = max(0, self::BATAS_LAPORAN_PER_JAM - $jumlah);
        $diizinkan = $jumlah < self::BATAS_LAPORAN_PER_JAM;

        $menitTunggu = null;
        $pesan = null;

        if (! $diizinkan) {
            // Ambil tiket tertua dalam jendela 1 jam ini untuk menghitung sisa waktu tunggu
            $laporanTertua = $laporanQuery->first();
            if ($laporanTertua && $laporanTertua->created_at) {
                $bisaLaporLagiPada = $laporanTertua->created_at->copy()->addHour();
                $menitTunggu = max(1, (int) ceil(now()->diffInMinutes($bisaLaporLagiPada, false)));
            } else {
                $menitTunggu = 60;
            }

            $pesan = 'Batas pelaporan tercapai (maksimal '.self::BATAS_LAPORAN_PER_JAM." laporan per jam). Anda dapat melapor kembali dalam {$menitTunggu} menit.";
        }

        return [
            'diizinkan' => $diizinkan,
            'laporan_terakhir_1_jam' => $jumlah,
            'sisa_kuota' => $sisaKuota,
            'menit_tunggu' => $menitTunggu,
            'pesan' => $pesan,
        ];
    }
}


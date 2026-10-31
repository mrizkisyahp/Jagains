<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class FotoLaporanService
{
    /**
     * Batas ukuran foto kamera: 2 MB (P-22 & SRS AS-05).
     */
    public const BATAS_UKURAN_BYTE = 2 * 1024 * 1024;

    /**
     * Memproses data foto tangkapan kamera (Base64), membuang seluruh metadata EXIF (ST-16),
     * melakukan kompresi ukuran, dan menyimpannya ke storage publik.
     *
     * @param  string  $base64DataUrl  Data URL citra kamera (misal: data:image/jpeg;base64,...)
     * @return array{uuid: string, path: string, ukuran_byte: int, lebar: int, tinggi: int}
     *
     * @throws InvalidArgumentException
     */
    public function prosesFotoKamera(string $base64DataUrl): array
    {
        // 1. Ekstrak data biner dari Base64
        $binaryData = $this->dekodeBase64($base64DataUrl);

        // 2. Validasi batas ukuran maksimal 2 MB
        if (strlen($binaryData) > self::BATAS_UKURAN_BYTE) {
            throw new InvalidArgumentException('Ukuran foto melebihi batas maksimal 2 MB.');
        }

        // 3. Muat citra ke resource GD (sekaligus memvalidasi integritas format citra)
        $img = @imagecreatefromstring($binaryData);
        if ($img === false) {
            throw new InvalidArgumentException('Data foto kamera tidak valid atau rusak.');
        }

        $lebar = imagesx($img);
        $tinggi = imagesy($img);

        // 4. Kompresi & susun ulang bitmap murni ke JPEG bersih (seluruh metadata EXIF otomatis hilang)
        ob_start();
        imagejpeg($img, null, 85);
        $cleanBytes = ob_get_clean();
        imagedestroy($img);

        if ($cleanBytes === false || strlen($cleanBytes) === 0) {
            throw new InvalidArgumentException('Gagal memproses dan mengompresi foto.');
        }

        // 5. Simpan ke storage publik dengan path terstruktur
        $uuid = (string) Str::uuid();
        $tahunBulan = date('Y/m');
        $relativePath = "lampiran/{$tahunBulan}/{$uuid}.jpg";

        Storage::disk('public')->put($relativePath, $cleanBytes);

        return [
            'uuid' => $uuid,
            'path' => $relativePath,
            'ukuran_byte' => strlen($cleanBytes),
            'lebar' => $lebar,
            'tinggi' => $tinggi,
        ];
    }

    /**
     * Mendekode string Data URL Base64 menjadi representasi biner murni.
     */
    private function dekodeBase64(string $dataUrl): string
    {
        if (str_contains($dataUrl, ';base64,')) {
            [, $dataUrl] = explode(';base64,', $dataUrl);
        }

        $decoded = base64_decode($dataUrl, true);
        if ($decoded === false) {
            throw new InvalidArgumentException('Data foto kamera tidak valid atau rusak.');
        }

        return $decoded;
    }
}

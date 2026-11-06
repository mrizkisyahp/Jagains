<?php

namespace App\Services;

use App\Exceptions\FotoProcessingException;
use Illuminate\Support\Facades\Log;
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
     * Daftar fungsi GD yang wajib tersedia untuk pemrosesan citra.
     */
    public const FUNGSI_GD_DIBUTUHKAN = [
        'imagecreatefromstring',
        'imagesx',
        'imagesy',
        'imagejpeg',
        'imagedestroy',
    ];

    /**
     * Hook simulasi kapabilitas GD untuk keperluan automated tests.
     *
     * @var (callable(): bool)|null
     */
    protected static $gdCapabilityChecker = null;

    /**
     * Mengatur hook pemeriksaan kapabilitas GD untuk automated testing.
     * Dibatasi hanya dapat dieksekusi pada lingkungan pengujian unit/feature.
     *
     * @param  (callable(): bool)|null  $checker
     */
    public static function setGdCapabilityChecker(?callable $checker): void
    {
        if (! app()->runningUnitTests()) {
            return;
        }

        static::$gdCapabilityChecker = $checker;
    }

    /**
     * Memeriksa apakah ekstensi GD dan seluruh fungsi yang dibutuhkan tersedia pada runtime.
     */
    public function cekKetersediaanGd(): bool
    {
        if (static::$gdCapabilityChecker !== null) {
            return (bool) call_user_func(static::$gdCapabilityChecker);
        }

        if (! extension_loaded('gd')) {
            return false;
        }

        foreach (self::FUNGSI_GD_DIBUTUHKAN as $fungsi) {
            if (! function_exists($fungsi)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Mengembalikan daftar fungsi GD yang hilang pada runtime saat ini.
     *
     * @return array<int, string>
     */
    public function getMissingGdFunctions(): array
    {
        $missing = [];
        foreach (self::FUNGSI_GD_DIBUTUHKAN as $fungsi) {
            if (! function_exists($fungsi)) {
                $missing[] = $fungsi;
            }
        }

        return $missing;
    }

    /**
     * Memastikan kapabilitas GD tersedia sebelum memanggil fungsi internal PHP GD.
     *
     * @throws FotoProcessingException
     */
    protected function pastikanGdTersedia(): void
    {
        if (! $this->cekKetersediaanGd()) {
            $missing = $this->getMissingGdFunctions();

            Log::error('Pemrosesan foto gagal: Ekstensi atau fungsi PHP GD tidak tersedia pada runtime ini.', [
                'extension_loaded' => extension_loaded('gd'),
                'missing_functions' => $missing,
                'php_version' => PHP_VERSION,
                'sapi' => PHP_SAPI,
            ]);

            throw FotoProcessingException::gdUnavailable($missing);
        }
    }

    /**
     * Memproses data foto tangkapan kamera (Base64), membuang seluruh metadata EXIF (ST-16),
     * melakukan kompresi ukuran, dan menyimpannya ke storage publik.
     *
     * @param  string  $base64DataUrl  Data URL citra kamera (misal: data:image/jpeg;base64,...)
     * @return array{uuid: string, path: string, ukuran_byte: int, lebar: int, tinggi: int}
     *
     * @throws InvalidArgumentException
     * @throws FotoProcessingException
     */
    public function prosesFotoKamera(string $base64DataUrl): array
    {
        // 1. Ekstrak data biner dari Base64
        $binaryData = $this->dekodeBase64($base64DataUrl);

        // 2. Validasi batas ukuran maksimal 2 MB
        if (strlen($binaryData) > self::BATAS_UKURAN_BYTE) {
            throw new InvalidArgumentException('Ukuran foto melebihi batas maksimal 2 MB.');
        }

        // 3. Verifikasi ketersediaan dependensi GD sebelum mengeksekusi fungsi GD
        $this->pastikanGdTersedia();

        // 4. Muat citra ke resource GD (sekaligus memvalidasi integritas format citra)
        $img = @\imagecreatefromstring($binaryData);
        if ($img === false) {
            throw new InvalidArgumentException('Data foto kamera tidak valid atau rusak.');
        }

        $initialObLevel = ob_get_level();
        $cleanBytes = false;

        try {
            $lebar = \imagesx($img);
            $tinggi = \imagesy($img);

            // 5. Kompresi & susun ulang bitmap murni ke JPEG bersih (seluruh metadata EXIF otomatis hilang)
            ob_start();
            \imagejpeg($img, null, 85);
            $cleanBytes = ob_get_clean();
        } finally {
            // Pastikan seluruh buffer yang dibuka oleh operasi ini ditutup pada kondisi sukses maupun gagal
            while (ob_get_level() > $initialObLevel) {
                ob_end_clean();
            }

            // Pastikan resource citra GD selalu dihancurkan
            \imagedestroy($img);
        }

        if ($cleanBytes === false || strlen($cleanBytes) === 0) {
            throw new InvalidArgumentException('Gagal memproses dan mengompresi foto.');
        }

        // 6. Simpan ke storage publik dengan path terstruktur
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

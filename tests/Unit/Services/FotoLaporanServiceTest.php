<?php

namespace Tests\Unit\Services;

use App\Services\FotoLaporanService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FotoLaporanServiceTest extends TestCase
{
    private FotoLaporanService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->service = new FotoLaporanService;
    }

    public function test_memproses_foto_kamera_base64_dan_membersihkan_exif(): void
    {
        // 1. Buat gambar sintetis menggunakan GD
        $img = imagecreatetruecolor(800, 600);
        $bgColor = imagecolorallocate($img, 34, 139, 34);
        imagefill($img, 0, 0, $bgColor);

        ob_start();
        imagejpeg($img, null, 90);
        $rawBytes = ob_get_clean();
        imagedestroy($img);

        $base64DataUrl = 'data:image/jpeg;base64,'.base64_encode($rawBytes);

        // 2. Proses via service
        $result = $this->service->prosesFotoKamera($base64DataUrl);

        // 3. Verifikasi struktur kembalian
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('ukuran_byte', $result);
        $this->assertArrayHasKey('lebar', $result);
        $this->assertArrayHasKey('tinggi', $result);
        $this->assertArrayHasKey('uuid', $result);

        $this->assertEquals(800, $result['lebar']);
        $this->assertEquals(600, $result['tinggi']);
        $this->assertGreaterThan(0, $result['ukuran_byte']);

        // 4. Verifikasi file tersimpan di storage public
        Storage::disk('public')->assertExists($result['path']);

        // 5. Verifikasi bebas EXIF (ST-16)
        $savedFileFullPath = Storage::disk('public')->path($result['path']);
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($savedFileFullPath);
            $this->assertFalse($exif, 'Foto tersimpan tidak boleh memiliki metadata EXIF lokasi.');
        }
    }

    public function test_menolak_gambar_jika_melebihi_batas_ukuran_2_mb(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Ukuran foto melebihi batas maksimal 2 MB');

        // Buat string dummy melebihi 2MB
        $hugeData = str_repeat('A', 3 * 1024 * 1024);
        $base64DataUrl = 'data:image/jpeg;base64,'.$hugeData;

        $this->service->prosesFotoKamera($base64DataUrl);
    }

    public function test_menolak_format_data_bukan_gambar_valid(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Data foto kamera tidak valid atau rusak');

        $this->service->prosesFotoKamera('data:image/jpeg;base64,bukan_base64_gambar');
    }
}


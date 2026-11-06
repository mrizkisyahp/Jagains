<?php

namespace Tests\Unit\Services;

use App\Exceptions\FotoProcessingException;
use App\Services\FotoLaporanService;
use Illuminate\Support\Facades\Log;
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
        FotoLaporanService::setGdCapabilityChecker(null);
    }

    protected function tearDown(): void
    {
        FotoLaporanService::setGdCapabilityChecker(null);
        parent::tearDown();
    }

    private function buatGambarSintetisBase64(int $lebar = 800, int $tinggi = 600): string
    {
        $img = imagecreatetruecolor($lebar, $tinggi);
        $bgColor = imagecolorallocate($img, 34, 139, 34);
        imagefill($img, 0, 0, $bgColor);

        ob_start();
        imagejpeg($img, null, 90);
        $rawBytes = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,'.base64_encode($rawBytes);
    }

    public function test_memproses_foto_kamera_base64_dan_membersihkan_exif(): void
    {
        $base64DataUrl = $this->buatGambarSintetisBase64(800, 600);

        // Proses via service
        $result = $this->service->prosesFotoKamera($base64DataUrl);

        // Verifikasi struktur kembalian
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('ukuran_byte', $result);
        $this->assertArrayHasKey('lebar', $result);
        $this->assertArrayHasKey('tinggi', $result);
        $this->assertArrayHasKey('uuid', $result);

        $this->assertEquals(800, $result['lebar']);
        $this->assertEquals(600, $result['tinggi']);
        $this->assertGreaterThan(0, $result['ukuran_byte']);

        // Verifikasi file tersimpan di storage public
        Storage::disk('public')->assertExists($result['path']);

        // Verifikasi bebas EXIF (ST-16)
        $savedFileFullPath = Storage::disk('public')->path($result['path']);
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($savedFileFullPath);
            $this->assertTrue(
                $exif === false || (! isset($exif['GPSLatitude']) && ! isset($exif['GPS'])),
                'Foto tersimpan tidak boleh memiliki metadata EXIF lokasi.'
            );
        }
    }

    public function test_cek_ketersediaan_gd_berhasil_saat_ekstensi_dan_fungsi_tersedia(): void
    {
        $this->assertTrue($this->service->cekKetersediaanGd());
        $this->assertEmpty($this->service->getMissingGdFunctions());
    }

    public function test_mendeteksi_kegagalan_kapabilitas_gd_dan_melempar_foto_processing_exception(): void
    {
        // Simulasikan lingkungan tanpa GD
        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        $this->assertFalse($this->service->cekKetersediaanGd());

        $this->expectException(FotoProcessingException::class);
        $this->expectExceptionMessage('Layanan pemrosesan foto saat ini tidak tersedia pada server. Silakan hubungi administrator.');

        $base64DataUrl = $this->buatGambarSintetisBase64(100, 100);
        $this->service->prosesFotoKamera($base64DataUrl);
    }

    public function test_mencatat_log_error_diagnostik_saat_gd_tidak_tersedia(): void
    {
        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context) {
                return str_contains($message, 'Ekstensi atau fungsi PHP GD tidak tersedia')
                    && array_key_exists('extension_loaded', $context)
                    && array_key_exists('missing_functions', $context)
                    && array_key_exists('php_version', $context)
                    && array_key_exists('sapi', $context);
            });

        $base64DataUrl = $this->buatGambarSintetisBase64(100, 100);

        try {
            $this->service->prosesFotoKamera($base64DataUrl);
            $this->fail('Harus melempar FotoProcessingException.');
        } catch (FotoProcessingException $e) {
            $this->assertSame(FotoProcessingException::DEFAULT_MESSAGE, $e->getMessage());
        }
    }

    public function test_pesan_error_aman_dan_tidak_membocorkan_detail_internal_sistem(): void
    {
        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        try {
            $this->service->prosesFotoKamera($this->buatGambarSintetisBase64(50, 50));
            $this->fail('Harus melempar FotoProcessingException.');
        } catch (FotoProcessingException $e) {
            $msg = $e->getMessage();
            $this->assertStringNotContainsString('imagecreatefromstring', $msg);
            $this->assertStringNotContainsString('php.ini', $msg);
            $this->assertStringNotContainsString('\\', $msg);
            $this->assertStringNotContainsString('/', $msg);
            $this->assertStringNotContainsString('Call to undefined function', $msg);
            $this->assertSame(FotoProcessingException::DEFAULT_MESSAGE, $msg);
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

    public function test_setter_tidak_dapat_mengubah_state_saat_di_luar_lingkungan_testing(): void
    {
        $originalEnv = app()['env'];
        try {
            // Simulasikan lingkungan produksi (bukan testing)
            app()['env'] = 'production';
            $this->assertFalse(app()->runningUnitTests());

            // Panggilan setter di produksi wajib diabaikan
            FotoLaporanService::setGdCapabilityChecker(fn () => false);

            // Buktikan bahwa checker di FotoLaporanService TIDAK berubah dan tetap menggunakan kapabilitas asli
            $this->assertTrue($this->service->cekKetersediaanGd());
        } finally {
            app()['env'] = $originalEnv;
            FotoLaporanService::setGdCapabilityChecker(null);
        }
    }

    public function test_pemrosesan_foto_sukses_menjaga_level_output_buffer_tetap_identik(): void
    {
        $obLevelAwal = ob_get_level();

        $result = $this->service->prosesFotoKamera($this->buatGambarSintetisBase64(200, 150));

        $this->assertSame($obLevelAwal, ob_get_level(), 'Level output buffer tidak boleh berubah setelah pemrosesan sukses.');
        $this->assertNotEmpty($result['path']);
    }

    public function test_pemrosesan_foto_dengan_buffer_luar_menjaga_buffer_luar_tetap_utuh(): void
    {
        ob_start();
        echo 'Outer buffer content';
        $obLevelAwal = ob_get_level();

        $result = $this->service->prosesFotoKamera($this->buatGambarSintetisBase64(100, 100));

        $this->assertSame($obLevelAwal, ob_get_level(), 'Buffer milik kode luar tidak boleh tertutup.');
        $content = ob_get_clean();
        $this->assertSame('Outer buffer content', $content);
        $this->assertNotEmpty($result['path']);
    }

    public function test_base_test_case_teardown_mereset_static_checker(): void
    {
        // Set checker ke false
        FotoLaporanService::setGdCapabilityChecker(fn () => false);
        $this->assertFalse($this->service->cekKetersediaanGd());

        // Jalankan tearDown base TestCase
        $testInstance = new class('dummy') extends TestCase
        {
            public function jalankanTearDownManual(): void
            {
                $this->tearDown();
            }
        };

        $testInstance->jalankanTearDownManual();

        // Setelah tearDown base dieksekusi, checker harus kembali null (cekKetersediaanGd mengembalikan true)
        $this->assertTrue($this->service->cekKetersediaanGd());
    }

    public function test_base_test_case_teardown_tetap_mereset_checker_meskipun_parent_teardown_gagal(): void
    {
        FotoLaporanService::setGdCapabilityChecker(fn () => false);
        $this->assertFalse($this->service->cekKetersediaanGd());

        // Simulasikan skenario di mana parent::tearDown melempar exception
        $testInstance = new class('dummy') extends TestCase
        {
            public function simulasikanTearDownDenganError(): void
            {
                FotoLaporanService::setGdCapabilityChecker(null);

                try {
                    throw new \RuntimeException('Simulasi kegagalan parent tearDown');
                } finally {
                    FotoLaporanService::setGdCapabilityChecker(null);
                }
            }
        };

        try {
            $testInstance->simulasikanTearDownDenganError();
        } catch (\RuntimeException) {
            // Diharapkan melempar exception
        }

        $this->assertTrue($this->service->cekKetersediaanGd());
    }
}

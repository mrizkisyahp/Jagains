<?php

namespace Tests\Unit\Services;

use App\Services\DashboardKinerjaService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DashboardKinerjaServiceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_hitung_hari_kerja_mengecualikan_akhir_pekan_dan_hari_libur(): void
    {
        $service = app(DashboardKinerjaService::class);

        // Jumat ke Senin (melewati Sabtu & Minggu) -> 1 hari kerja
        $jumat = Carbon::parse('2026-05-08');
        $senin = Carbon::parse('2026-05-11');

        $hk = $service->hitungHariKerja($jumat, $senin);
        $this->assertEquals(1, $hk);
    }

    public function test_kalkulasi_perbandingan_antarkecamatan_dan_antarinstansi_menghasilkan_struktur_valid(): void
    {
        $service = app(DashboardKinerjaService::class);

        $kecamatan = $service->ambilDataPerbandinganKecamatan('semua');
        $instansi = $service->ambilDataPerbandinganInstansi('semua');

        $this->assertIsArray($kecamatan);
        $this->assertIsArray($instansi);

        if (! empty($kecamatan)) {
            $row = $kecamatan[0];
            $this->assertArrayHasKey('id', $row);
            $this->assertArrayHasKey('nama', $row);
            $this->assertArrayHasKey('total_tiket', $row);
            $this->assertArrayHasKey('tiket_selesai', $row);
            $this->assertArrayHasKey('median_respons_hk', $row);
            $this->assertArrayHasKey('median_selesai_hk', $row);
            $this->assertArrayHasKey('janji_ditepati_persen', $row);
            $this->assertArrayHasKey('anggaran_menggantung_total', $row);
            $this->assertArrayHasKey('tingkat_verifikasi_persen', $row);
            $this->assertArrayHasKey('tingkat_sengketa_persen', $row);
            $this->assertArrayHasKey('data_cukup', $row);
        }
    }
}

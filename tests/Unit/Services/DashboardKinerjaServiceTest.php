<?php

namespace Tests\Unit\Services;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\DashboardKinerjaService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
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

    public function test_metrik_instansi_hanya_menghitung_laporan_pada_instansi_dan_periode_aktif(): void
    {
        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        $kota = Wilayah::factory()->create();
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $kategori = Kategori::factory()->create();
        $instansiTarget = Instansi::factory()->create(['wilayah_id' => $kota->id]);
        $instansiLain = Instansi::factory()->create(['wilayah_id' => $kota->id]);
        $pelapor = User::factory()->warga($kelurahan->id)->create();

        $laporanAktif = $this->buatLaporan($pelapor, $kategori, $instansiTarget, $kelurahan, 'JAG-METRIK-001', 'DITERUSKAN');
        $this->buatLaporan($pelapor, $kategori, $instansiTarget, $kelurahan, 'JAG-METRIK-002', 'TERTUTUP_WARGA');
        $this->buatLaporan($pelapor, $kategori, $instansiLain, $kelurahan, 'JAG-METRIK-003', 'TERTUTUP_WARGA');

        $laporanLama = $this->buatLaporan($pelapor, $kategori, $instansiTarget, $kelurahan, 'JAG-METRIK-004', 'DITERUSKAN');
        $laporanLama->forceFill(['created_at' => now()->subDays(31), 'updated_at' => now()->subDays(31)])->saveQuietly();

        $metrik = app(DashboardKinerjaService::class)->ambilMetrikInstansi($instansiTarget, '30_hari');

        $this->assertSame(2, $metrik['total_tiket']);
        $this->assertSame(1, $metrik['tiket_selesai']);
        $this->assertFalse($metrik['data_cukup']);
    }

    private function buatLaporan(
        User $pelapor,
        Kategori $kategori,
        Instansi $instansi,
        Wilayah $kelurahan,
        string $nomorTiket,
        string $status,
    ): Laporan {
        return Laporan::create([
            'nomor_tiket' => $nomorTiket,
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan metrik dashboard',
            'keterangan' => 'Data uji untuk indikator dashboard instansi.',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => $status,
            'disembunyikan' => false,
            'ditutup_pada' => in_array($status, ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true) ? now() : null,
        ]);
    }
}

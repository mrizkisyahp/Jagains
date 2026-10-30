<?php

namespace Tests\Unit\Services;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\BatasLaporanService;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BatasLaporanServiceTest extends TestCase
{
    use DatabaseTransactions;

    private BatasLaporanService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BatasLaporanService;
    }

    public function test_mengizinkan_warga_yang_belum_pernah_melapor(): void
    {
        $warga = User::factory()->warga()->create();

        $status = $this->service->periksaKuota($warga);

        $this->assertTrue($status['diizinkan']);
        $this->assertEquals(0, $status['laporan_terakhir_1_jam']);
        $this->assertEquals(5, $status['sisa_kuota']);
        $this->assertNull($status['menit_tunggu']);
    }

    public function test_menolak_warga_yang_telah_mencapai_batas_5_laporan_dalam_1_jam(): void
    {
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }

        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        // Buat 5 laporan dalam 1 jam terakhir
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        for ($i = 1; $i <= 5; $i++) {
            $seq = rand(10000, 99999);
            Laporan::create([
                'nomor_tiket' => "JAG-2026-{$seq}",
                'pelapor_id' => $warga->id,
                'kategori_id' => $kategori->id,
                'kelurahan_id' => $kelurahan->id,
                'judul' => "Aduan {$i}",
                'keterangan' => "Keterangan kerusakan jalan {$i}",
                'keparahan' => 'sedang',
                'lintang' => -6.400000,
                'bujur' => 106.800000,
                'lokasi_sumber' => 'gps',
                'akurasi_gps_m' => 10.0,
                'status' => 'PERLU_ROUTING',
                'instansi_id' => null,
                'created_at' => now()->subMinutes(50 - ($i * 5)),
            ]);
        }

        $status = $this->service->periksaKuota($warga);

        $this->assertFalse($status['diizinkan'], 'Laporan ke-6 harus ditolak.');
        $this->assertEquals(5, $status['laporan_terakhir_1_jam']);
        $this->assertEquals(0, $status['sisa_kuota']);
        $this->assertNotNull($status['menit_tunggu']);
        $this->assertGreaterThan(0, $status['menit_tunggu']);
        $this->assertStringContainsString('Batas pelaporan tercapai', $status['pesan']);
    }

    public function test_mengabaikan_laporan_yang_sudah_lewat_dari_1_jam(): void
    {
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }

        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        // 5 laporan dibuat 2 jam yang lalu
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        for ($i = 1; $i <= 5; $i++) {
            $seq = rand(10000, 99999);
            $laporan = Laporan::create([
                'nomor_tiket' => "JAG-OLD-{$seq}",
                'pelapor_id' => $warga->id,
                'kategori_id' => $kategori->id,
                'kelurahan_id' => $kelurahan->id,
                'judul' => "Aduan Lama {$i}",
                'keterangan' => "Keterangan jalan lama {$i}",
                'keparahan' => 'sedang',
                'lintang' => -6.400000,
                'bujur' => 106.800000,
                'lokasi_sumber' => 'gps',
                'akurasi_gps_m' => 10.0,
                'status' => 'PERLU_ROUTING',
                'instansi_id' => null,
            ]);
            DB::table('laporan')->where('id', $laporan->id)->update(['created_at' => now()->subHours(2)]);
        }

        $status = $this->service->periksaKuota($warga);

        $this->assertTrue($status['diizinkan']);
        $this->assertEquals(0, $status['laporan_terakhir_1_jam']);
        $this->assertEquals(5, $status['sisa_kuota']);
    }
}

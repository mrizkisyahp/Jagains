<?php

namespace Tests\Feature\Laporan;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CekLaporanSerupaTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }
    }

    public function test_menemukan_laporan_serupa_terbuka_dalam_radius_kategori(): void
    {
        $warga = User::factory()->warga()->create();
        $kategoriJalan = Kategori::where('nama', 'Jalan Berlubang')->first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        // Buat tiket terbuka di titik (-6.400000, 106.800000)
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $tiketAda = Laporan::create([
            'nomor_tiket' => 'JAG-2026-ADA001',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategoriJalan->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Rusak Margonda',
            'keterangan' => 'Lubang sedalam 15 cm di dekat halte',
            'keparahan' => 'sedang',
            'lintang' => -6.400000,
            'bujur' => 106.800000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 5.0,
            'status' => 'PERLU_ROUTING',
            'instansi_id' => null,
        ]);

        // Cek dari titik yang berjarak ~8 meter (-6.400070, 106.800000)
        $response = $this->actingAs($warga)->postJson('/api/laporan/cek-serupa', [
            'kategori_id' => $kategoriJalan->id,
            'lintang' => -6.400070,
            'bujur' => 106.800000,
            'akurasi_gps_m' => 5.0,
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'ada_kandidat',
            'total',
            'kandidat' => [
                '*' => [
                    'id',
                    'nomor_tiket',
                    'judul',
                    'keterangan',
                    'status',
                    'jarak_m',
                    'jumlah_dukungan',
                ],
            ],
        ]);

        $this->assertTrue($response->json('ada_kandidat'));
        $this->assertEquals($tiketAda->nomor_tiket, $response->json('kandidat.0.nomor_tiket'));
        $this->assertLessThanOrEqual(20, $response->json('kandidat.0.jarak_m'));
    }

    public function test_mengabaikan_laporan_yang_sudah_tertutup_meskipun_lokasi_sama(): void
    {
        $warga = User::factory()->warga()->create();
        $kategoriJalan = Kategori::where('nama', 'Jalan Berlubang')->first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        // Buat tiket yang sudah TERTUTUP_WARGA
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        Laporan::create([
            'nomor_tiket' => 'JAG-2026-TTP001',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategoriJalan->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Rusak Sudah Selesai',
            'keterangan' => 'Lubang jalan sudah diaspal',
            'keparahan' => 'sedang',
            'lintang' => -6.400000,
            'bujur' => 106.800000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 5.0,
            'status' => 'TERTUTUP_WARGA',
            'instansi_id' => 7,
            'ditutup_pada' => now(),
        ]);

        $response = $this->actingAs($warga)->postJson('/api/laporan/cek-serupa', [
            'kategori_id' => $kategoriJalan->id,
            'lintang' => -6.400000,
            'bujur' => 106.800000,
        ]);

        $response->assertOk();
        $this->assertFalse($response->json('ada_kandidat'));
        $this->assertEmpty($response->json('kandidat'));
    }

    public function test_membatasi_maksimal_3_kandidat_terdekat(): void
    {
        $warga = User::factory()->warga()->create();
        $kategoriJalan = Kategori::where('nama', 'Jalan Berlubang')->first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        for ($i = 1; $i <= 5; $i++) {
            $seq = rand(10000, 99999);
            Laporan::create([
                'nomor_tiket' => "JAG-2026-{$seq}",
                'pelapor_id' => $warga->id,
                'kategori_id' => $kategoriJalan->id,
                'kelurahan_id' => $kelurahan->id,
                'judul' => "Lubang Jalan {$i}",
                'keterangan' => "Keterangan jalan {$i}",
                'keparahan' => 'sedang',
                'lintang' => -6.400000 + ($i * 0.00002),
                'bujur' => 106.800000,
                'lokasi_sumber' => 'gps',
                'akurasi_gps_m' => 5.0,
                'status' => 'PERLU_ROUTING',
                'instansi_id' => null,
            ]);
        }

        $response = $this->actingAs($warga)->postJson('/api/laporan/cek-serupa', [
            'kategori_id' => $kategoriJalan->id,
            'lintang' => -6.400000,
            'bujur' => 106.800000,
            'akurasi_gps_m' => 15.0,
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('ada_kandidat'));
        $this->assertLessThanOrEqual(3, count($response->json('kandidat')));
    }
}

<?php

namespace Tests\Feature\Wilayah;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\WilayahService;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\AturanRoutingJakartaSeeder;
use Database\Seeders\InstansiJakartaSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahJakartaSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WilayahJakartaIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Wilayah::where('tingkat', 'kota')->where('nama', '!=', 'Kota Depok')->count() === 0) {
            $this->seed(WilayahJakartaSeeder::class);
        }
        if (Instansi::where('nama', 'like', 'Suku Dinas%')->count() === 0) {
            $this->seed(InstansiSeeder::class);
            $this->seed(InstansiJakartaSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
            $this->seed(AturanRoutingDanSlaSeeder::class);
        }
        $this->seed(AturanRoutingJakartaSeeder::class);
    }

    private function generateBase64Image(): string
    {
        $img = imagecreatetruecolor(640, 480);
        $bgColor = imagecolorallocate($img, 90, 140, 200);
        imagefill($img, 0, 0, $bgColor);
        ob_start();
        imagejpeg($img, null, 85);
        $rawBytes = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,'.base64_encode($rawBytes);
    }

    public function test_seeder_dki_jakarta_memuat_6_kota_dan_267_kelurahan(): void
    {
        $dkiCities = Wilayah::where('tingkat', 'kota')->where('nama', '!=', 'Kota Depok')->get();
        $this->assertCount(6, $dkiCities);

        $totalKecamatan = Wilayah::where('tingkat', 'kecamatan')
            ->whereIn('induk_id', $dkiCities->pluck('id'))
            ->count();
        $this->assertEquals(44, $totalKecamatan);

        $kecamatanIds = Wilayah::where('tingkat', 'kecamatan')
            ->whereIn('induk_id', $dkiCities->pluck('id'))
            ->pluck('id');

        $totalKelurahan = Wilayah::where('tingkat', 'kelurahan')
            ->whereIn('induk_id', $kecamatanIds)
            ->count();
        $this->assertEquals(267, $totalKelurahan);
    }

    public function test_deteksi_geospasial_titik_jakarta_menemukan_kelurahan(): void
    {
        $service = app(WilayahService::class);

        // Titik Tebet Timur, Jakarta Selatan (sekitar lat -6.2337, lng 106.8547)
        $kelurahan = $service->kelurahanDariTitik(-6.233786, 106.854731);

        $this->assertNotNull($kelurahan, 'Titik di Tebet Timur harus terdeteksi');
        $this->assertEquals('kelurahan', $kelurahan->tingkat);
        $this->assertNotNull($kelurahan->induk);
        $this->assertEquals('kecamatan', $kelurahan->induk->tingkat);
        $this->assertNotNull($kelurahan->induk->induk);
        $this->assertEquals('Kota Administrasi Jakarta Selatan', $kelurahan->induk->induk->nama);
    }

    public function test_warga_dapat_membuat_laporan_di_wilayah_jakarta_dan_ter_routing_ke_sudin_terkait(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::where('nama', 'Jalan Berlubang')->firstOrFail();

        // Titik Tebet Timur, Jakarta Selatan
        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Aspal jalan berlubang cukup dalam di dekat stasiun Tebet.',
            'lintang' => -6.233786,
            'bujur' => 106.854731,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 6.0,
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)->postJson('/warga/lapor', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'sukses' => true,
            ]);

        $nomorTiket = $response->json('nomor_tiket');
        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->firstOrFail();

        $this->assertEquals('DITERUSKAN', $laporan->status);
        $this->assertNotNull($laporan->instansi_id);

        $instansi = Instansi::find($laporan->instansi_id);
        $this->assertNotNull($instansi);
        $this->assertStringContainsString('Suku Dinas Bina Marga', $instansi->nama);
        $this->assertStringContainsString('Jakarta Selatan', $instansi->nama);
    }

    public function test_endpoint_api_deteksi_kelurahan_mendukung_titik_jakarta(): void
    {
        $response = $this->postJson('/api/wilayah/deteksi-kelurahan', [
            'lintang' => -6.233786,
            'bujur' => 106.854731,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'terdeteksi' => true,
            ]);

        $this->assertNotEmpty($response->json('nama'));
        $this->assertNotEmpty($response->json('kecamatan'));
    }
}

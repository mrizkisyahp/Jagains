<?php

namespace Tests\Feature\Wilayah;

use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\WilayahService;
use Database\Seeders\AturanRoutingBodetabekSeeder;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\InstansiBodetabekSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\LaporanSiklusHidupDemoSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\WilayahBodetabekSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WilayahBodetabekIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }

        $bodetabekCityNames = [
            'Kota Bogor',
            'Kabupaten Bogor',
            'Kota Tangerang',
            'Kota Tangerang Selatan',
            'Kabupaten Tangerang',
            'Kota Bekasi',
            'Kabupaten Bekasi',
        ];

        if (Wilayah::where('tingkat', 'kota')->whereIn('nama', $bodetabekCityNames)->count() < 7) {
            $this->seed(WilayahBodetabekSeeder::class);
        }

        if (Instansi::where('nama', 'like', '%Kota Bogor')->count() === 0) {
            $this->seed(InstansiSeeder::class);
            $this->seed(InstansiBodetabekSeeder::class);
        }

        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
            $this->seed(AturanRoutingDanSlaSeeder::class);
        }

        if (AturanRouting::whereHas('instansi', fn ($q) => $q->where('nama', 'like', '%Kota Bogor'))->count() === 0) {
            $this->seed(AturanRoutingBodetabekSeeder::class);
        }
    }

    private function generateBase64Image(): string
    {
        $img = imagecreatetruecolor(640, 480);
        $bgColor = imagecolorallocate($img, 100, 150, 200);
        imagefill($img, 0, 0, $bgColor);
        ob_start();
        imagejpeg($img, null, 85);
        $rawBytes = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,'.base64_encode($rawBytes);
    }

    public function test_seeder_bodetabek_memuat_7_kab_kota_dan_seluruh_wilayah(): void
    {
        $bodetabekCityNames = [
            'Kota Bogor',
            'Kabupaten Bogor',
            'Kota Tangerang',
            'Kota Tangerang Selatan',
            'Kabupaten Tangerang',
            'Kota Bekasi',
            'Kabupaten Bekasi',
        ];

        $cities = Wilayah::where('tingkat', 'kota')->whereIn('nama', $bodetabekCityNames)->get();
        $this->assertCount(7, $cities);

        $totalKecamatan = Wilayah::where('tingkat', 'kecamatan')
            ->whereIn('induk_id', $cities->pluck('id'))
            ->count();
        $this->assertEquals(130, $totalKecamatan);

        $kecamatanIds = Wilayah::where('tingkat', 'kecamatan')
            ->whereIn('induk_id', $cities->pluck('id'))
            ->pluck('id');

        $totalKelurahan = Wilayah::where('tingkat', 'kelurahan')
            ->whereIn('induk_id', $kecamatanIds)
            ->count();
        $this->assertEquals(1178, $totalKelurahan);
    }

    public function test_instansi_bodetabek_memiliki_dinas_teknis_dan_kantor_wilayah(): void
    {
        $bodetabekCityNames = [
            'Kota Bogor',
            'Kabupaten Bogor',
            'Kota Tangerang',
            'Kota Tangerang Selatan',
            'Kabupaten Tangerang',
            'Kota Bekasi',
            'Kabupaten Bekasi',
        ];

        $cities = Wilayah::where('tingkat', 'kota')->whereIn('nama', $bodetabekCityNames)->get();

        foreach ($cities as $kota) {
            $dinasInfra = Instansi::where('wilayah_id', $kota->id)
                ->where(function ($q) {
                    $q->where('nama', 'like', 'Dinas Pekerjaan Umum%')
                        ->orWhere('nama', 'like', 'Dinas Bina Marga%')
                        ->orWhere('nama', 'like', 'Dinas Sumber Daya Air%');
                })
                ->first();
            $this->assertNotNull($dinasInfra, "Dinas infrastruktur untuk {$kota->nama} wajib ada");

            $dishub = Instansi::where('wilayah_id', $kota->id)
                ->where('nama', 'like', 'Dinas Perhubungan%')
                ->first();
            $this->assertNotNull($dishub, "Dinas Perhubungan untuk {$kota->nama} wajib ada");

            $dlh = Instansi::where('wilayah_id', $kota->id)
                ->where('nama', 'like', 'Dinas Lingkungan Hidup%')
                ->first();
            $this->assertNotNull($dlh, "Dinas Lingkungan Hidup untuk {$kota->nama} wajib ada");
        }
    }

    public function test_deteksi_geospasial_titik_bodetabek_menemukan_kelurahan(): void
    {
        $service = app(WilayahService::class);

        // 1. Titik di Babakan Pasar, Bogor Tengah, Kota Bogor
        $kelurahanBogor = $service->kelurahanDariTitik(-6.598, 106.799);
        $this->assertNotNull($kelurahanBogor, 'Titik di Kota Bogor harus terdeteksi');
        $this->assertEquals('Kota Bogor', $kelurahanBogor->induk?->induk?->nama);

        // 2. Titik di Kota Bekasi
        $kelurahanBekasi = $service->kelurahanDariTitik(-6.241, 106.992);
        $this->assertNotNull($kelurahanBekasi, 'Titik di Kota Bekasi harus terdeteksi');
        $this->assertEquals('Kota Bekasi', $kelurahanBekasi->induk?->induk?->nama);

        // 3. Titik di Kota Tangerang
        $kelurahanTangerang = $service->kelurahanDariTitik(-6.185, 106.638);
        $this->assertNotNull($kelurahanTangerang, 'Titik di Kota Tangerang harus terdeteksi');
        $this->assertEquals('Kota Tangerang', $kelurahanTangerang->induk?->induk?->nama);
    }

    public function test_warga_dapat_membuat_laporan_di_bodetabek_dan_ter_routing_ke_dinas_terkait(): void
    {
        $warga = User::factory()->warga()->create();
        $kategoriJalan = Kategori::where('nama', 'Jalan Berlubang')->firstOrFail();

        // Buat laporan di Kota Bogor
        $payloadBogor = [
            'kategori_id' => $kategoriJalan->id,
            'keparahan' => 'berat',
            'keterangan' => 'Jalan berlubang cukup parah di pusat kota Bogor.',
            'lintang' => -6.598,
            'bujur' => 106.799,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 5.0,
            'foto' => $this->generateBase64Image(),
        ];

        $responseBogor = $this->actingAs($warga)->postJson('/warga/lapor', $payloadBogor);
        $responseBogor->assertStatus(201)->assertJson(['sukses' => true]);

        $laporanBogor = Laporan::where('nomor_tiket', $responseBogor->json('nomor_tiket'))->firstOrFail();
        $this->assertEquals('DITERUSKAN', $laporanBogor->status);
        $this->assertNotNull($laporanBogor->instansi_id);

        $instansiBogor = Instansi::find($laporanBogor->instansi_id);
        $this->assertStringContainsString('Kota Bogor', $instansiBogor->nama);
        $this->assertStringContainsString('Pekerjaan Umum', $instansiBogor->nama);

        // Buat laporan sampah di Kota Bekasi
        $kategoriSampah = Kategori::where('nama', 'Sampah Liar')->firstOrFail();
        $payloadBekasi = [
            'kategori_id' => $kategoriSampah->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Sampah menumpuk liar di pinggir jalan raya Bekasi.',
            'lintang' => -6.241,
            'bujur' => 106.992,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 5.0,
            'foto' => $this->generateBase64Image(),
        ];

        $responseBekasi = $this->actingAs($warga)->postJson('/warga/lapor', $payloadBekasi);
        $responseBekasi->assertStatus(201)->assertJson(['sukses' => true]);

        $laporanBekasi = Laporan::where('nomor_tiket', $responseBekasi->json('nomor_tiket'))->firstOrFail();
        $this->assertEquals('DITERUSKAN', $laporanBekasi->status);
        $this->assertNotNull($laporanBekasi->instansi_id);

        $instansiBekasi = Instansi::find($laporanBekasi->instansi_id);
        $this->assertStringContainsString('Kota Bekasi', $instansiBekasi->nama);
        $this->assertStringContainsString('Lingkungan Hidup', $instansiBekasi->nama);
    }

    public function test_seeder_laporan_demo_membuat_tiket_wilayah_bodetabek(): void
    {
        if (Laporan::where('nomor_tiket', 'like', 'JAG-2026-BDT-%')->count() === 0) {
            $this->seed(UserSeeder::class);
            $this->seed(LaporanSiklusHidupDemoSeeder::class);
        }

        $laporanBodetabek = Laporan::with(['kelurahan.induk.induk'])
            ->where('nomor_tiket', 'like', 'JAG-2026-BDT-%')
            ->get();

        $this->assertGreaterThanOrEqual(91, $laporanBodetabek->count());

        foreach ($laporanBodetabek as $laporan) {
            $kelurahan = $laporan->kelurahan;
            $this->assertNotNull($kelurahan);
            $this->assertNotEquals('Kota Depok', $kelurahan->induk->induk->nama);

            // Koordinat harus berada di dalam batas bounding box kelurahan
            $this->assertGreaterThanOrEqual((float) $kelurahan->min_lintang, (float) $laporan->lintang);
            $this->assertLessThanOrEqual((float) $kelurahan->max_lintang, (float) $laporan->lintang);
            $this->assertGreaterThanOrEqual((float) $kelurahan->min_bujur, (float) $laporan->bujur);
            $this->assertLessThanOrEqual((float) $kelurahan->max_bujur, (float) $laporan->bujur);
        }
    }
}

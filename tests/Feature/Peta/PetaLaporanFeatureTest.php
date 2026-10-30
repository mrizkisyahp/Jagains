<?php

namespace Tests\Feature\Peta;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PetaLaporanFeatureTest extends TestCase
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

    public function test_akses_halaman_peta_oleh_berbagai_aktor(): void
    {
        // 1. Publik / Guest diarahkan ke login saat mengakses rute internal /peta
        $resGuest = $this->get('/peta');
        $resGuest->assertRedirect('/login');

        // 2. Warga login mendapatkan akses 200 OK
        $warga = User::factory()->warga()->create();
        $resWarga = $this->actingAs($warga)->get('/peta');
        $resWarga->assertOk();
        $resWarga->assertInertia(fn (AssertableInertia $page) => $page->component('warga/peta'));

        // 3. Petugas Instansi ditolak 403 (karena rute khusus role:warga)
        $petugas = User::factory()->instansi()->create();
        $resPetugas = $this->actingAs($petugas)->get('/peta');
        $resPetugas->assertForbidden();
    }

    public function test_filter_titik_berdasarkan_kecamatan(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();

        // Cari 2 kelurahan dengan kecamatan berbeda
        $kelurahan1 = Wilayah::where('tingkat', 'kelurahan')->first();
        $kecamatan1Id = $kelurahan1->induk_id;

        $kelurahan2 = Wilayah::where('tingkat', 'kelurahan')
            ->where('induk_id', '!=', $kecamatan1Id)
            ->first();
        $kecamatan2Id = $kelurahan2->induk_id;

        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        Laporan::create([
            'nomor_tiket' => 'JAG-KEC-01',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan1->id,
            'judul' => 'Jalan Rusak di Kecamatan 1',
            'keterangan' => 'Lubang jalan',
            'keparahan' => 'sedang',
            'lintang' => -6.3900,
            'bujur' => 106.8200,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        Laporan::create([
            'nomor_tiket' => 'JAG-KEC-02',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan2->id,
            'judul' => 'Jalan Rusak di Kecamatan 2',
            'keterangan' => 'Lubang jalan',
            'keparahan' => 'sedang',
            'lintang' => -6.4100,
            'bujur' => 106.8400,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        // Filter Kecamatan 1
        $resKec1 = $this->getJson("/api/peta/titik?kecamatan_id={$kecamatan1Id}");
        $resKec1->assertOk();
        $nomorList = array_column($resKec1->json('data'), 'nomor_tiket');
        $this->assertContains('JAG-KEC-01', $nomorList);
        $this->assertNotContains('JAG-KEC-02', $nomorList);
    }

    public function test_filter_titik_pencarian_teks_nomor_tiket_atau_judul(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        Laporan::create([
            'nomor_tiket' => 'JAG-SEARCH-ABC',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Drainase Mampet Depok Jaya',
            'keterangan' => 'Air meluap',
            'keparahan' => 'berat',
            'lintang' => -6.3900,
            'bujur' => 106.8200,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        // Cari dengan keyword nomor tiket
        $resByNomor = $this->getJson('/api/peta/titik?search=SEARCH-ABC');
        $resByNomor->assertOk();
        $this->assertCount(1, $resByNomor->json('data'));
        $this->assertEquals('JAG-SEARCH-ABC', $resByNomor->json('data.0.nomor_tiket'));

        // Cari dengan keyword judul
        $resByJudul = $this->getJson('/api/peta/titik?search=Depok+Jaya');
        $resByJudul->assertOk();
        $this->assertCount(1, $resByJudul->json('data'));
        $this->assertEquals('JAG-SEARCH-ABC', $resByJudul->json('data.0.nomor_tiket'));
    }

    public function test_skenario_filter_nihil_mengembalikan_array_kosong_sukses(): void
    {
        // Query dengan kategori yang tidak ada (id = 999999)
        $response = $this->getJson('/api/peta/titik?kategori_id=999999');

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
            'total' => 0,
            'data' => [],
        ]);
    }
}

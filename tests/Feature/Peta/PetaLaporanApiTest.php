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

class PetaLaporanApiTest extends TestCase
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

    public function test_publik_tanpa_login_dialihkan_ke_login_saat_mengakses_halaman_peta_internal(): void
    {
        $response = $this->get('/peta');

        $response->assertRedirect('/login');

        // Publik tanpa login mengakses peta melalui landing page
        $resLanding = $this->get('/');
        $resLanding->assertOk();
        $resLanding->assertInertia(fn (AssertableInertia $page) => $page
            ->component('landing')
            ->has('masterFilter.kategori')
            ->has('masterFilter.kecamatan')
            ->has('masterFilter.instansi')
            ->has('masterFilter.statistik')
        );
    }

    public function test_warga_login_dapat_mengakses_halaman_peta(): void
    {
        $warga = User::factory()->warga()->create();

        $response = $this->actingAs($warga)->get('/peta');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('warga/peta')
        );
    }

    public function test_api_titik_peta_mengembalikan_json_valid_tanpa_identitas_pelapor(): void
    {
        $warga = User::factory()->warga()->create();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-PETA-001',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Lampu PJU Padam',
            'keterangan' => 'Sudah 3 malam padam total',
            'keparahan' => 'sedang',
            'lintang' => -6.3982,
            'bujur' => 106.8250,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        $response = $this->getJson('/api/peta/titik');

        $response->assertOk();
        $response->assertJsonStructure([
            'status',
            'total',
            'data' => [
                '*' => [
                    'id',
                    'nomor_tiket',
                    'judul',
                    'kategori_id',
                    'kategori_nama',
                    'instansi_id',
                    'instansi_nama',
                    'kecamatan_id',
                    'kecamatan_nama',
                    'kelurahan_nama',
                    'status',
                    'keparahan',
                    'kondisi_sla',
                    'label_sla',
                    'warna_sla',
                    'ikon_sla',
                    'sisa_hari_sla',
                    'sisa_sla_teks',
                    'lintang',
                    'bujur',
                    'jumlah_dukungan',
                    'created_at',
                ],
            ],
        ]);

        $data = $response->json('data');
        foreach ($data as $item) {
            $this->assertArrayNotHasKey('pelapor_id', $item);
            $this->assertArrayNotHasKey('pelapor', $item);
            $this->assertArrayNotHasKey('email', $item);
        }
    }

    public function test_api_titik_peta_menyaring_berdasarkan_kategori_dan_kondisi_sla(): void
    {
        $warga = User::factory()->warga()->create();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategoriList = Kategori::take(2)->get();

        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        Laporan::create([
            'nomor_tiket' => 'JAG-KAT-1',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategoriList[0]->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Kategori 1',
            'keterangan' => 'Keterangan 1',
            'keparahan' => 'ringan',
            'lintang' => -6.3982,
            'bujur' => 106.8250,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        $instansi = Instansi::first();

        Laporan::create([
            'nomor_tiket' => 'JAG-KAT-2',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategoriList[1]->id,
            'instansi_id' => $instansi?->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Kategori 2',
            'keterangan' => 'Keterangan 2',
            'keparahan' => 'ringan',
            'lintang' => -6.3985,
            'bujur' => 106.8255,
            'lokasi_sumber' => 'manual',
            'status' => 'TERTUTUP_WARGA',
            'ditutup_pada' => now(),
            'disembunyikan' => false,
        ]);

        // Filter kategori 1
        $resKat1 = $this->getJson("/api/peta/titik?kategori_id={$kategoriList[0]->id}");
        $resKat1->assertOk();
        $nomorListKat1 = array_column($resKat1->json('data'), 'nomor_tiket');
        $this->assertContains('JAG-KAT-1', $nomorListKat1);
        $this->assertNotContains('JAG-KAT-2', $nomorListKat1);

        // Filter kondisi SLA 'selesai'
        $resSelesai = $this->getJson('/api/peta/titik?kondisi_sla=selesai');
        $resSelesai->assertOk();
        $nomorListSelesai = array_column($resSelesai->json('data'), 'nomor_tiket');
        $this->assertContains('JAG-KAT-2', $nomorListSelesai);
        $this->assertNotContains('JAG-KAT-1', $nomorListSelesai);
    }
}

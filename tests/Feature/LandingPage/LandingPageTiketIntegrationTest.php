<?php

namespace Tests\Feature\LandingPage;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingPageTiketIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->seed([WilayahSeeder::class, KategoriSeeder::class]);
    }

    public function test_landing_page_merender_seksi_dan_master_filter(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('landing')
            ->has('masterFilter')
        );
    }

    public function test_peta_dapat_menerima_query_param_fokus_tiket(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-FOKUS-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Uji Coba Fokus Spasial Peta',
            'keterangan' => 'Deskripsi fokus peta',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        // Tamu dialihkan ke login saat mengakses rute internal /peta
        $resGuest = $this->get('/peta?fokus=JAG-2026-FOKUS-001');
        $resGuest->assertRedirect('/login');

        // Warga login dapat membuka peta dengan parameter fokus tiket
        $response = $this->actingAs($pelapor)->get('/peta?fokus=JAG-2026-FOKUS-001');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('warga/peta')
            ->has('masterFilter')
        );
    }
}

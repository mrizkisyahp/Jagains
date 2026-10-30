<?php

namespace Tests\Feature\LandingPage;

use App\Models\Kategori;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class LandingPageTest extends TestCase
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

    public function test_route_default_mengembalikan_halaman_landing_page_publik(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('landing')
            ->has('masterFilter.kategori')
            ->has('masterFilter.kecamatan')
            ->has('masterFilter.instansi')
            ->has('masterFilter.statistik')
        );
    }

    public function test_route_peta_warga_tetap_berfungsi_dan_mengembalikan_komponen_warga_peta(): void
    {
        $warga = User::factory()->warga()->create();

        $response = $this->actingAs($warga)->get('/peta');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('warga/peta')
        );
    }
}

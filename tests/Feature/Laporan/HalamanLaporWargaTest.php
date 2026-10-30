<?php

namespace Tests\Feature\Laporan;

use App\Models\Kategori;
use App\Models\User;
use Database\Seeders\KategoriSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class HalamanLaporWargaTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }
    }

    public function test_warga_dapat_mengakses_halaman_lapor_dan_menerima_data_kategori_serta_kuota(): void
    {
        $warga = User::factory()->warga()->create();

        $response = $this->actingAs($warga)->get('/warga/lapor');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('warga/lapor')
            ->has('kategoriList')
            ->has('kuota', fn (AssertableInertia $kuota) => $kuota
                ->where('diizinkan', true)
                ->where('sisa_kuota', 5)
                ->etc()
            )
        );
    }

    public function test_pengguna_belum_login_dialihkan_ke_halaman_login(): void
    {
        $this->get('/warga/lapor')->assertRedirect('/login');
    }

    public function test_peran_non_warga_ditolak_mengakses_halaman_lapor(): void
    {
        $petugas = User::factory()->instansi()->create();
        $auditor = User::factory()->auditor()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($petugas)->get('/warga/lapor')->assertStatus(403);
        $this->actingAs($auditor)->get('/warga/lapor')->assertStatus(403);
        $this->actingAs($admin)->get('/warga/lapor')->assertStatus(403);
    }
}


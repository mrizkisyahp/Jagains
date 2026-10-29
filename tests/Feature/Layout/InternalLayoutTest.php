<?php

namespace Tests\Feature\Layout;

use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class InternalLayoutTest extends TestCase
{
    use DatabaseTransactions;

    public function test_warga_dapat_mengakses_panel_warga_dengan_layout_internal()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create(['nama' => 'Pancoran Mas']);
        $warga = User::factory()->create([
            'username' => 'wargatester',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'wargatester@example.com'),
        ]);

        $response = $this->actingAs($warga)->get('/warga/profil');
        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('warga/profile')
            ->has('auth.user', fn (AssertableInertia $user) => $user
                ->where('username', 'wargatester')
                ->where('peran', 'warga')
                ->etc()
            )
        );

        $resPeta = $this->actingAs($warga)->get('/peta');
        $resPeta->assertOk();
        $resPeta->assertInertia(fn (AssertableInertia $page) => $page
            ->component('warga/peta')
        );
    }

    public function test_instansi_dapat_mengakses_antrean_dengan_layout_internal()
    {
        $instansiUser = User::factory()->create([
            'username' => 'petugas_pupr',
            'peran' => 'instansi',
        ]);

        $response = $this->actingAs($instansiUser)->get('/instansi/antrean');
        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('instansi/antrean')
            ->has('auth.user', fn (AssertableInertia $user) => $user
                ->where('username', 'petugas_pupr')
                ->where('peran', 'instansi')
                ->etc()
            )
        );
    }

    public function test_auditor_dapat_mengakses_antrean_eskalasi_dengan_layout_internal()
    {
        $auditorUser = User::factory()->create([
            'username' => 'auditor_utama',
            'peran' => 'auditor',
        ]);

        $response = $this->actingAs($auditorUser)->get('/auditor/antrean');
        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auditor/antrean')
            ->has('auth.user', fn (AssertableInertia $user) => $user
                ->where('username', 'auditor_utama')
                ->where('peran', 'auditor')
                ->etc()
            )
        );
    }

    public function test_admin_dapat_mengakses_antrean_routing_dengan_layout_internal()
    {
        $adminUser = User::factory()->create([
            'username' => 'admin_sistem',
            'peran' => 'admin',
        ]);

        $response = $this->actingAs($adminUser)->get('/admin/antrean-routing');
        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/antrean-routing')
            ->has('auth.user', fn (AssertableInertia $user) => $user
                ->where('username', 'admin_sistem')
                ->where('peran', 'admin')
                ->etc()
            )
        );
    }

    public function test_isolasi_peran_mencegah_akses_ke_panel_peran_lain()
    {
        $warga = User::factory()->create([
            'username' => 'wargaterbatas',
            'peran' => 'warga',
            'email_hash' => hash('sha256', 'terbatas@example.com'),
        ]);

        $this->actingAs($warga)->get('/instansi/antrean')->assertStatus(403);
        $this->actingAs($warga)->get('/auditor/antrean')->assertStatus(403);
        $this->actingAs($warga)->get('/admin/antrean-routing')->assertStatus(403);
    }
}

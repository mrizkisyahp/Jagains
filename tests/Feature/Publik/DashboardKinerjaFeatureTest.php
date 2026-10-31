<?php

namespace Tests\Feature\Publik;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardKinerjaFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_perbandingan_dapat_dibuka_oleh_publik_tanpa_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('dataKecamatan')
            ->has('dataInstansi')
            ->has('periodeAktif')
            ->has('ambangBatas')
        );
    }

    public function test_dashboard_mendukung_filter_periode(): void
    {
        $response = $this->get('/dashboard?periode=30_hari');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('periodeAktif', '30_hari')
        );
    }
}

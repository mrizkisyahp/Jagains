<?php

namespace Tests\Feature\Publik;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class BantuanPrivasiFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function test_halaman_bantuan_dan_kebijakan_privasi_dapat_dibuka_oleh_publik_tanpa_login(): void
    {
        $response = $this->get('/bantuan');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bantuan')
            ->has('transparansiData.disimpan')
            ->has('transparansiData.tidakDisimpan')
            ->has('transparansiData.batasDiakui')
        );
    }
}

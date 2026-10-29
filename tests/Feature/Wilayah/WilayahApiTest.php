<?php

namespace Tests\Feature\Wilayah;

use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class WilayahApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_it_detects_kelurahan_from_coordinates_without_storing_coordinates()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create([
            'nama' => 'Kemiri Muka',
            'min_lintang' => -6.300050,
            'max_lintang' => -6.300000,
            'min_bujur' => 106.700000,
            'max_bujur' => 106.700050,
        ]);

        $response = $this->postJson('/api/wilayah/deteksi-kelurahan', [
            'latitude' => -6.300025,
            'longitude' => 106.700025,
        ]);

        $response->assertOk()
            ->assertJson([
                'kelurahan_id' => $kelurahan->id,
                'nama' => 'Kemiri Muka',
            ]);
    }

    public function test_it_returns_empty_for_coordinates_outside_depok()
    {
        $response = $this->postJson('/api/wilayah/deteksi-kelurahan', [
            'latitude' => -7.250445,
            'longitude' => 112.768845,
        ]);

        $response->assertOk()
            ->assertJson(['kelurahan_id' => null]);
    }

    public function test_it_lists_all_kelurahan_depok()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create(['nama' => 'Pancoran Mas']);

        $response = $this->getJson('/api/wilayah/kelurahan');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $kelurahan->id,
                'nama' => 'Pancoran Mas',
                'tingkat' => 'kelurahan',
            ]);
    }
}

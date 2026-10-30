<?php

namespace Database\Factories;

use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AturanRouting>
 */
class AturanRoutingFactory extends Factory
{
    protected $model = AturanRouting::class;

    public function definition(): array
    {
        return [
            'kategori_id' => Kategori::factory(),
            'wilayah_id' => Wilayah::factory()->kota(),
            'instansi_id' => Instansi::factory(),
            'prioritas' => 100,
        ];
    }
}


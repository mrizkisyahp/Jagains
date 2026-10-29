<?php

namespace Database\Factories;

use App\Models\Instansi;
use App\Models\Wilayah;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Instansi>
 */
class InstansiFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'wilayah_id' => Wilayah::factory(),
            'nama' => 'Dinas '.fake()->unique()->word().' Kota Depok',
            'singkatan' => strtoupper(fake()->unique()->lexify('???')),
            'aktif' => true,
        ];
    }
}

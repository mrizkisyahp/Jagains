<?php

namespace Database\Factories;

use App\Models\Wilayah;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Wilayah>
 */
class WilayahFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'induk_id' => null,
            'tingkat' => 'kota',
            'nama' => 'Kota Depok '.fake()->unique()->numerify('###'),
            'kode_bps' => fake()->numerify('3276######'),
            'min_lintang' => -6.450000,
            'max_lintang' => -6.300000,
            'min_bujur' => 106.700000,
            'max_bujur' => 106.900000,
        ];
    }

    public function kecamatan(?int $indukId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'tingkat' => 'kecamatan',
            'nama' => 'Kecamatan '.fake()->unique()->word(),
            'induk_id' => $indukId ?? Wilayah::factory()->create(['tingkat' => 'kota', 'induk_id' => null])->id,
        ]);
    }

    public function kelurahan(?int $indukId = null): static
    {
        return $this->state(function (array $attributes) use ($indukId) {
            $kecamatanId = $indukId ?? Wilayah::factory()->kecamatan()->create()->id;

            return [
                'tingkat' => 'kelurahan',
                'nama' => 'Kelurahan '.fake()->unique()->word(),
                'induk_id' => $kecamatanId,
                'min_lintang' => -6.400000,
                'max_lintang' => -6.350000,
                'min_bujur' => 106.800000,
                'max_bujur' => 106.850000,
            ];
        });
    }
}

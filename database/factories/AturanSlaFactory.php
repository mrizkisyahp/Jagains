<?php

namespace Database\Factories;

use App\Models\AturanSla;
use App\Models\Kategori;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AturanSla>
 */
class AturanSlaFactory extends Factory
{
    protected $model = AturanSla::class;

    public function definition(): array
    {
        return [
            'kategori_id' => Kategori::factory(),
            'batas_respons_hk' => 3,
            'batas_survei_hk' => 5,
            'batas_anggaran_hk' => 10,
            'batas_jawab_sengketa_hk' => 7,
            'batas_verifikasi_hari' => 14,
        ];
    }
}

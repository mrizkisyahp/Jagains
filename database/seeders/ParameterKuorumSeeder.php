<?php

namespace Database\Seeders;

use App\Models\ParameterKuorum;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;

class ParameterKuorumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Wilayah tingkat Kota Depok
        $kotaDepok = Wilayah::where('tingkat', 'kota')->first();
        if ($kotaDepok) {
            ParameterKuorum::updateOrCreate(
                ['wilayah_id' => $kotaDepok->id],
                [
                    'k_bp' => 200, // 2%
                    'kmin' => 2.0,
                    'kmax' => 5.0,
                ]
            );
        }

        // 2. Seluruh kelurahan percontohan di Kota Depok
        $kelurahanList = Wilayah::where('tingkat', 'kelurahan')->get();
        foreach ($kelurahanList as $kelurahan) {
            ParameterKuorum::updateOrCreate(
                ['wilayah_id' => $kelurahan->id],
                [
                    'k_bp' => 200,
                    'kmin' => 2.0,
                    'kmax' => 5.0,
                ]
            );
        }
    }
}

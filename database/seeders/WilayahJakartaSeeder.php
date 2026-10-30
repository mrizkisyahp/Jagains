<?php

namespace Database\Seeders;

use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WilayahJakartaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/dki_wilayah.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $cities = json_decode(file_get_contents($jsonPath), true);
        if (! is_array($cities)) {
            return;
        }

        DB::transaction(function () use ($cities) {
            foreach ($cities as $kotaData) {
                $kotaGeometri = [
                    'type' => 'Polygon',
                    'coordinates' => [[
                        [$kotaData['min_bujur'], $kotaData['max_lintang']],
                        [$kotaData['max_bujur'], $kotaData['max_lintang']],
                        [$kotaData['max_bujur'], $kotaData['min_lintang']],
                        [$kotaData['min_bujur'], $kotaData['min_lintang']],
                        [$kotaData['min_bujur'], $kotaData['max_lintang']],
                    ]],
                ];

                $kota = Wilayah::updateOrCreate(
                    ['kode_bps' => $kotaData['kode_bps']],
                    [
                        'induk_id' => null,
                        'tingkat' => 'kota',
                        'nama' => $kotaData['nama'],
                        'geometri' => $kotaGeometri,
                        'min_lintang' => $kotaData['min_lintang'],
                        'max_lintang' => $kotaData['max_lintang'],
                        'min_bujur' => $kotaData['min_bujur'],
                        'max_bujur' => $kotaData['max_bujur'],
                    ]
                );

                foreach ($kotaData['districts'] as $kecData) {
                    $kecGeometri = [
                        'type' => 'Polygon',
                        'coordinates' => [[
                            [$kecData['min_bujur'], $kecData['max_lintang']],
                            [$kecData['max_bujur'], $kecData['max_lintang']],
                            [$kecData['max_bujur'], $kecData['min_lintang']],
                            [$kecData['min_bujur'], $kecData['min_lintang']],
                            [$kecData['min_bujur'], $kecData['max_lintang']],
                        ]],
                    ];

                    $kecamatan = Wilayah::updateOrCreate(
                        ['kode_bps' => $kecData['kode_bps']],
                        [
                            'induk_id' => $kota->id,
                            'tingkat' => 'kecamatan',
                            'nama' => $kecData['nama'],
                            'geometri' => $kecGeometri,
                            'min_lintang' => $kecData['min_lintang'],
                            'max_lintang' => $kecData['max_lintang'],
                            'min_bujur' => $kecData['min_bujur'],
                            'max_bujur' => $kecData['max_bujur'],
                        ]
                    );

                    foreach ($kecData['villages'] as $kelData) {
                        $kelGeometri = [
                            'type' => 'Polygon',
                            'coordinates' => [[
                                [$kelData['min_bujur'], $kelData['max_lintang']],
                                [$kelData['max_bujur'], $kelData['max_lintang']],
                                [$kelData['max_bujur'], $kelData['min_lintang']],
                                [$kelData['min_bujur'], $kelData['min_lintang']],
                                [$kelData['min_bujur'], $kelData['max_lintang']],
                            ]],
                        ];

                        Wilayah::updateOrCreate(
                            ['kode_bps' => $kelData['kode_bps']],
                            [
                                'induk_id' => $kecamatan->id,
                                'tingkat' => 'kelurahan',
                                'nama' => $kelData['nama'],
                                'geometri' => $kelGeometri,
                                'min_lintang' => $kelData['min_lintang'],
                                'max_lintang' => $kelData['max_lintang'],
                                'min_bujur' => $kelData['min_bujur'],
                                'max_bujur' => $kelData['max_bujur'],
                            ]
                        );
                    }
                }
            }

            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SELECT setval(pg_get_serial_sequence('wilayah', 'id'), COALESCE((SELECT MAX(id) FROM wilayah), 1))");
            }
        });
    }
}

<?php

namespace Database\Seeders;

use App\Models\Instansi;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstansiJakartaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dkiCities = Wilayah::where('tingkat', 'kota')
            ->where('nama', '!=', 'Kota Depok')
            ->get();

        if ($dkiCities->isEmpty()) {
            return;
        }

        $singkatanKotaMap = [
            'Kota Administrasi Jakarta Selatan' => 'JAKSEL',
            'Kota Administrasi Jakarta Timur' => 'JAKTIM',
            'Kota Administrasi Jakarta Pusat' => 'JAKPUS',
            'Kota Administrasi Jakarta Barat' => 'JAKBAR',
            'Kota Administrasi Jakarta Utara' => 'JAKUT',
            'Kabupaten Administrasi Kepulauan Seribu' => 'KEP. SERIBU',
        ];

        DB::transaction(function () use ($dkiCities, $singkatanKotaMap) {
            foreach ($dkiCities as $kota) {
                $singkatanKota = $singkatanKotaMap[$kota->nama] ?? 'DKI';

                // 1. Suku Dinas Teknis Pelaksana Lapangan
                $sukuDinas = [
                    [
                        'nama' => 'Suku Dinas Bina Marga '.$kota->nama,
                        'singkatan' => 'SUDIN BM '.$singkatanKota,
                        'wilayah_id' => $kota->id,
                    ],
                    [
                        'nama' => 'Suku Dinas Sumber Daya Air '.$kota->nama,
                        'singkatan' => 'SUDIN SDA '.$singkatanKota,
                        'wilayah_id' => $kota->id,
                    ],
                    [
                        'nama' => 'Suku Dinas Perhubungan '.$kota->nama,
                        'singkatan' => 'SUDIN DISHUB '.$singkatanKota,
                        'wilayah_id' => $kota->id,
                    ],
                    [
                        'nama' => 'Suku Dinas Lingkungan Hidup '.$kota->nama,
                        'singkatan' => 'SUDIN DLH '.$singkatanKota,
                        'wilayah_id' => $kota->id,
                    ],
                ];

                foreach ($sukuDinas as $sd) {
                    Instansi::updateOrCreate(
                        [
                            'wilayah_id' => $sd['wilayah_id'],
                            'nama' => $sd['nama'],
                        ],
                        [
                            'singkatan' => $sd['singkatan'],
                            'aktif' => true,
                        ]
                    );
                }

                // 2. Kantor Kecamatan & Kelurahan
                $kecamatans = Wilayah::where('induk_id', $kota->id)->where('tingkat', 'kecamatan')->get();
                foreach ($kecamatans as $kec) {
                    Instansi::updateOrCreate(
                        [
                            'wilayah_id' => $kec->id,
                            'nama' => 'Kantor Kecamatan '.$kec->nama,
                        ],
                        [
                            'singkatan' => 'KEC. '.strtoupper($kec->nama),
                            'aktif' => true,
                        ]
                    );

                    $kelurahans = Wilayah::where('induk_id', $kec->id)->where('tingkat', 'kelurahan')->get();
                    foreach ($kelurahans as $kel) {
                        Instansi::updateOrCreate(
                            [
                                'wilayah_id' => $kel->id,
                                'nama' => 'Kantor Kelurahan '.$kel->nama,
                            ],
                            [
                                'singkatan' => 'KEL. '.strtoupper($kel->nama),
                                'aktif' => true,
                            ]
                        );
                    }
                }
            }

            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SELECT setval(pg_get_serial_sequence('instansi', 'id'), COALESCE((SELECT MAX(id) FROM instansi), 1))");
            }
        });
    }
}

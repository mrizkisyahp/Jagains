<?php

namespace Database\Seeders;

use App\Models\Instansi;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstansiBodetabekSeeder extends Seeder
{
    /**
     * Run the database seeds for Bodetabek instansi.
     */
    public function run(): void
    {
        $bodetabekCityNames = [
            'Kota Bogor',
            'Kabupaten Bogor',
            'Kota Tangerang',
            'Kota Tangerang Selatan',
            'Kabupaten Tangerang',
            'Kota Bekasi',
            'Kabupaten Bekasi',
        ];

        $cities = Wilayah::where('tingkat', 'kota')
            ->whereIn('nama', $bodetabekCityNames)
            ->get();

        if ($cities->isEmpty()) {
            return;
        }

        // Definisi OPD Teknis per Kab/Kota di Bodetabek
        $opdMap = [
            'Kota Bogor' => [
                ['nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Bogor', 'singkatan' => 'DPUPR KOTA BOGOR'],
                ['nama' => 'Dinas Perhubungan Kota Bogor', 'singkatan' => 'DISHUB KOTA BOGOR'],
                ['nama' => 'Dinas Lingkungan Hidup Kota Bogor', 'singkatan' => 'DLH KOTA BOGOR'],
            ],
            'Kabupaten Bogor' => [
                ['nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Bogor', 'singkatan' => 'DPUPR KAB BOGOR'],
                ['nama' => 'Dinas Perhubungan Kabupaten Bogor', 'singkatan' => 'DISHUB KAB BOGOR'],
                ['nama' => 'Dinas Lingkungan Hidup Kabupaten Bogor', 'singkatan' => 'DLH KAB BOGOR'],
            ],
            'Kota Tangerang' => [
                ['nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Tangerang', 'singkatan' => 'DPUPR KOTA TNG'],
                ['nama' => 'Dinas Perhubungan Kota Tangerang', 'singkatan' => 'DISHUB KOTA TNG'],
                ['nama' => 'Dinas Lingkungan Hidup Kota Tangerang', 'singkatan' => 'DLH KOTA TNG'],
            ],
            'Kota Tangerang Selatan' => [
                ['nama' => 'Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi Kota Tangerang Selatan', 'singkatan' => 'DSDABMBK TANGSEL'],
                ['nama' => 'Dinas Perhubungan Kota Tangerang Selatan', 'singkatan' => 'DISHUB TANGSEL'],
                ['nama' => 'Dinas Lingkungan Hidup Kota Tangerang Selatan', 'singkatan' => 'DLH TANGSEL'],
            ],
            'Kabupaten Tangerang' => [
                ['nama' => 'Dinas Bina Marga dan Sumber Daya Air Kabupaten Tangerang', 'singkatan' => 'DBMSDA KAB TNG'],
                ['nama' => 'Dinas Perhubungan Kabupaten Tangerang', 'singkatan' => 'DISHUB KAB TNG'],
                ['nama' => 'Dinas Lingkungan Hidup dan Kebersihan Kabupaten Tangerang', 'singkatan' => 'DLHK KAB TNG'],
            ],
            'Kota Bekasi' => [
                ['nama' => 'Dinas Bina Marga dan Sumber Daya Air Kota Bekasi', 'singkatan' => 'DBMSDA KOTA BKS'],
                ['nama' => 'Dinas Perhubungan Kota Bekasi', 'singkatan' => 'DISHUB KOTA BKS'],
                ['nama' => 'Dinas Lingkungan Hidup Kota Bekasi', 'singkatan' => 'DLH KOTA BKS'],
            ],
            'Kabupaten Bekasi' => [
                ['nama' => 'Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi Kabupaten Bekasi', 'singkatan' => 'DSDABMBK KAB BKS'],
                ['nama' => 'Dinas Perhubungan Kabupaten Bekasi', 'singkatan' => 'DISHUB KAB BKS'],
                ['nama' => 'Dinas Lingkungan Hidup Kabupaten Bekasi', 'singkatan' => 'DLH KAB BKS'],
            ],
        ];

        DB::transaction(function () use ($cities, $opdMap) {
            foreach ($cities as $kota) {
                // 1. Dinas Teknis Lapangan
                $dinasList = $opdMap[$kota->nama] ?? [];
                foreach ($dinasList as $dinas) {
                    Instansi::updateOrCreate(
                        [
                            'wilayah_id' => $kota->id,
                            'nama' => $dinas['nama'],
                        ],
                        [
                            'singkatan' => $dinas['singkatan'],
                            'aktif' => true,
                        ]
                    );
                }

                // 2. Kantor Kecamatan & Kelurahan/Desa
                $kecamatans = Wilayah::where('induk_id', $kota->id)->where('tingkat', 'kecamatan')->get();
                foreach ($kecamatans as $kec) {
                    Instansi::updateOrCreate(
                        [
                            'wilayah_id' => $kec->id,
                            'nama' => 'Kantor Kecamatan '.$kec->nama,
                        ],
                        [
                            'singkatan' => substr('KEC. '.strtoupper($kec->nama), 0, 30),
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
                                'singkatan' => substr('KEL. '.strtoupper($kel->nama), 0, 30),
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

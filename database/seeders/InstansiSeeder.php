<?php

namespace Database\Seeders;

use App\Models\Instansi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstansiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $instansi = [
            [
                'nama' => 'Dinas Komunikasi dan Informatika Kota Depok',
                'singkatan' => 'DISKOMINFO',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Kependudukan dan Pencatatan Sipil Kota Depok',
                'singkatan' => 'DISDUKCAPIL',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Kesehatan Kota Depok',
                'singkatan' => 'DINKES',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Pendidikan Kota Depok',
                'singkatan' => 'DISDIK',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Sosial Kota Depok',
                'singkatan' => 'DINSOS',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Perhubungan Kota Depok',
                'singkatan' => 'DISHUB',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Depok',
                'singkatan' => 'DPUPR',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Perumahan dan Permukiman Kota Depok',
                'singkatan' => 'DISRUMKIM',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Lingkungan Hidup dan Kebersihan Kota Depok',
                'singkatan' => 'DLHK',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Pemadam Kebakaran dan Penyelamatan Kota Depok',
                'singkatan' => 'DPKP',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Kota Depok',
                'singkatan' => 'DPMPTSP',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Perdagangan dan Perindustrian Kota Depok',
                'singkatan' => 'DISDAGIN',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Koperasi dan Usaha Mikro Kota Depok',
                'singkatan' => 'DKUM',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Pemuda, Olahraga, Kebudayaan dan Pariwisata Kota Depok',
                'singkatan' => 'DISPORYATA',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Ketahanan Pangan, Pertanian dan Perikanan Kota Depok',
                'singkatan' => 'DKP3',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana Kota Depok',
                'singkatan' => 'DP3AP2KB',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Tenaga Kerja Kota Depok',
                'singkatan' => 'DISNAKER',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Dinas Kearsipan dan Perpustakaan Kota Depok',
                'singkatan' => 'DISKARPUS',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Satuan Polisi Pamong Praja Kota Depok',
                'singkatan' => 'SATPOL PP',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Daerah Kota Depok',
                'singkatan' => 'BAPPEDA',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Badan Keuangan Daerah Kota Depok',
                'singkatan' => 'BKD',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Depok',
                'singkatan' => 'BKPSDM',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Badan Kesatuan Bangsa dan Politik Kota Depok',
                'singkatan' => 'BAKESBANGPOL',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Badan Penanggulangan Bencana Daerah Kota Depok',
                'singkatan' => 'BPBD',
                'wilayah_id' => 1,
            ],
            [
                'nama' => 'Inspektorat Daerah Kota Depok',
                'singkatan' => 'INSPEKTORAT',
                'wilayah_id' => 1,
            ],
        ];

        foreach ($instansi as $item) {
            Instansi::updateOrCreate(
                [
                    'wilayah_id' => $item['wilayah_id'],
                    'nama' => $item['nama'],
                ],
                [
                    'singkatan' => $item['singkatan'] ?? null,
                    'aktif' => true,
                ]
            );
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('instansi', 'id'), COALESCE((SELECT MAX(id) FROM instansi), 1))");
        }
    }
}

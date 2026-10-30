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
            [
                'nama' => 'Kantor Kecamatan Pancoran Mas',
                'singkatan' => 'KEC. PANCORAN MAS',
                'wilayah_id' => 2,
            ],
            [
                'nama' => 'Kantor Kelurahan Depok',
                'singkatan' => 'KEL. DEPOK',
                'wilayah_id' => 3,
            ],
            [
                'nama' => 'Kantor Kelurahan Depok Jaya',
                'singkatan' => 'KEL. DEPOK JAYA',
                'wilayah_id' => 4,
            ],
            [
                'nama' => 'Kantor Kelurahan Mampang',
                'singkatan' => 'KEL. MAMPANG',
                'wilayah_id' => 5,
            ],
            [
                'nama' => 'Kantor Kelurahan Rangkapan Jaya',
                'singkatan' => 'KEL. RANGKAPAN JAYA',
                'wilayah_id' => 6,
            ],
            [
                'nama' => 'Kantor Kelurahan Rangkapan Jaya Baru',
                'singkatan' => 'KEL. RANGKAPAN JAYA BARU',
                'wilayah_id' => 7,
            ],
            [
                'nama' => 'Kantor Kelurahan Pancoran Mas',
                'singkatan' => 'KEL. PANCORAN MAS',
                'wilayah_id' => 8,
            ],
            [
                'nama' => 'Kantor Kecamatan Cimanggis',
                'singkatan' => 'KEC. CIMANGGIS',
                'wilayah_id' => 9,
            ],
            [
                'nama' => 'Kantor Kelurahan Curug',
                'singkatan' => 'KEL. CURUG',
                'wilayah_id' => 10,
            ],
            [
                'nama' => 'Kantor Kelurahan Harjamukti',
                'singkatan' => 'KEL. HARJAMUKTI',
                'wilayah_id' => 11,
            ],
            [
                'nama' => 'Kantor Kelurahan Cisalak Pasar',
                'singkatan' => 'KEL. CISALAK PASAR',
                'wilayah_id' => 12,
            ],
            [
                'nama' => 'Kantor Kelurahan Mekarsari',
                'singkatan' => 'KEL. MEKARSARI',
                'wilayah_id' => 13,
            ],
            [
                'nama' => 'Kantor Kelurahan Tugu',
                'singkatan' => 'KEL. TUGU',
                'wilayah_id' => 14,
            ],
            [
                'nama' => 'Kantor Kelurahan Pasir Gunung Selatan',
                'singkatan' => 'KEL. PASIR GUNUNG SELATAN',
                'wilayah_id' => 15,
            ],
            [
                'nama' => 'Kantor Kecamatan Sawangan',
                'singkatan' => 'KEC. SAWANGAN',
                'wilayah_id' => 16,
            ],
            [
                'nama' => 'Kantor Kelurahan Sawangan',
                'singkatan' => 'KEL. SAWANGAN',
                'wilayah_id' => 17,
            ],
            [
                'nama' => 'Kantor Kelurahan Kedaung',
                'singkatan' => 'KEL. KEDAUNG',
                'wilayah_id' => 18,
            ],
            [
                'nama' => 'Kantor Kelurahan Cinangka',
                'singkatan' => 'KEL. CINANGKA',
                'wilayah_id' => 19,
            ],
            [
                'nama' => 'Kantor Kelurahan Sawangan Baru',
                'singkatan' => 'KEL. SAWANGAN BARU',
                'wilayah_id' => 20,
            ],
            [
                'nama' => 'Kantor Kelurahan Bedahan',
                'singkatan' => 'KEL. BEDAHAN',
                'wilayah_id' => 21,
            ],
            [
                'nama' => 'Kantor Kelurahan Pengasinan',
                'singkatan' => 'KEL. PENGASINAN',
                'wilayah_id' => 22,
            ],
            [
                'nama' => 'Kantor Kelurahan Pasir Putih',
                'singkatan' => 'KEL. PASIR PUTIH',
                'wilayah_id' => 23,
            ],
            [
                'nama' => 'Kantor Kecamatan Limo',
                'singkatan' => 'KEC. LIMO',
                'wilayah_id' => 24,
            ],
            [
                'nama' => 'Kantor Kelurahan Limo',
                'singkatan' => 'KEL. LIMO',
                'wilayah_id' => 25,
            ],
            [
                'nama' => 'Kantor Kelurahan Meruyung',
                'singkatan' => 'KEL. MERUYUNG',
                'wilayah_id' => 26,
            ],
            [
                'nama' => 'Kantor Kelurahan Grogol',
                'singkatan' => 'KEL. GROGOL',
                'wilayah_id' => 27,
            ],
            [
                'nama' => 'Kantor Kelurahan Krukut',
                'singkatan' => 'KEL. KRUKUT',
                'wilayah_id' => 28,
            ],
            [
                'nama' => 'Kantor Kecamatan Sukmajaya',
                'singkatan' => 'KEC. SUKMAJAYA',
                'wilayah_id' => 29,
            ],
            [
                'nama' => 'Kantor Kelurahan Sukmajaya',
                'singkatan' => 'KEL. SUKMAJAYA',
                'wilayah_id' => 30,
            ],
            [
                'nama' => 'Kantor Kelurahan Mekar Jaya',
                'singkatan' => 'KEL. MEKAR JAYA',
                'wilayah_id' => 31,
            ],
            [
                'nama' => 'Kantor Kelurahan Baktijaya',
                'singkatan' => 'KEL. BAKTIJAYA',
                'wilayah_id' => 32,
            ],
            [
                'nama' => 'Kantor Kelurahan Abadijaya',
                'singkatan' => 'KEL. ABADIJAYA',
                'wilayah_id' => 33,
            ],
            [
                'nama' => 'Kantor Kelurahan Tirtajaya',
                'singkatan' => 'KEL. TIRTAJAYA',
                'wilayah_id' => 34,
            ],
            [
                'nama' => 'Kantor Kelurahan Cisalak',
                'singkatan' => 'KEL. CISALAK',
                'wilayah_id' => 35,
            ],
            [
                'nama' => 'Kantor Kecamatan Beji',
                'singkatan' => 'KEC. BEJI',
                'wilayah_id' => 36,
            ],
            [
                'nama' => 'Kantor Kelurahan Beji',
                'singkatan' => 'KEL. BEJI',
                'wilayah_id' => 37,
            ],
            [
                'nama' => 'Kantor Kelurahan Beji Timur',
                'singkatan' => 'KEL. BEJI TIMUR',
                'wilayah_id' => 38,
            ],
            [
                'nama' => 'Kantor Kelurahan Kemiri Muka',
                'singkatan' => 'KEL. KEMIRI MUKA',
                'wilayah_id' => 39,
            ],
            [
                'nama' => 'Kantor Kelurahan Pondok Cina',
                'singkatan' => 'KEL. PONDOK CINA',
                'wilayah_id' => 40,
            ],
            [
                'nama' => 'Kantor Kelurahan Kukusan',
                'singkatan' => 'KEL. KUKUSAN',
                'wilayah_id' => 41,
            ],
            [
                'nama' => 'Kantor Kelurahan Tanah Baru',
                'singkatan' => 'KEL. TANAH BARU',
                'wilayah_id' => 42,
            ],
            [
                'nama' => 'Kantor Kecamatan Cipayung',
                'singkatan' => 'KEC. CIPAYUNG',
                'wilayah_id' => 43,
            ],
            [
                'nama' => 'Kantor Kelurahan Cipayung',
                'singkatan' => 'KEL. CIPAYUNG',
                'wilayah_id' => 44,
            ],
            [
                'nama' => 'Kantor Kelurahan Cipayung Jaya',
                'singkatan' => 'KEL. CIPAYUNG JAYA',
                'wilayah_id' => 45,
            ],
            [
                'nama' => 'Kantor Kelurahan Ratu Jaya',
                'singkatan' => 'KEL. RATU JAYA',
                'wilayah_id' => 46,
            ],
            [
                'nama' => 'Kantor Kelurahan Pondok Jaya',
                'singkatan' => 'KEL. PONDOK JAYA',
                'wilayah_id' => 47,
            ],
            [
                'nama' => 'Kantor Kelurahan Bojong Pondok Terong',
                'singkatan' => 'KEL. BOJONG PONDOK TERONG',
                'wilayah_id' => 48,
            ],
            [
                'nama' => 'Kantor Kecamatan Cilodong',
                'singkatan' => 'KEC. CILODONG',
                'wilayah_id' => 49,
            ],
            [
                'nama' => 'Kantor Kelurahan Cilodong',
                'singkatan' => 'KEL. CILODONG',
                'wilayah_id' => 50,
            ],
            [
                'nama' => 'Kantor Kelurahan Sukamaju',
                'singkatan' => 'KEL. SUKAMAJU',
                'wilayah_id' => 51,
            ],
            [
                'nama' => 'Kantor Kelurahan Kalibaru',
                'singkatan' => 'KEL. KALIBARU',
                'wilayah_id' => 52,
            ],
            [
                'nama' => 'Kantor Kelurahan Kalimulya',
                'singkatan' => 'KEL. KALIMULYA',
                'wilayah_id' => 53,
            ],
            [
                'nama' => 'Kantor Kelurahan Jatimulya',
                'singkatan' => 'KEL. JATIMULYA',
                'wilayah_id' => 54,
            ],
            [
                'nama' => 'Kantor Kecamatan Tapos',
                'singkatan' => 'KEC. TAPOS',
                'wilayah_id' => 55,
            ],
            [
                'nama' => 'Kantor Kelurahan Tapos',
                'singkatan' => 'KEL. TAPOS',
                'wilayah_id' => 56,
            ],
            [
                'nama' => 'Kantor Kelurahan Leuwinanggung',
                'singkatan' => 'KEL. LEUWINANGGUNG',
                'wilayah_id' => 57,
            ],
            [
                'nama' => 'Kantor Kelurahan Sukatani',
                'singkatan' => 'KEL. SUKATANI',
                'wilayah_id' => 58,
            ],
            [
                'nama' => 'Kantor Kelurahan Sukamaju Baru',
                'singkatan' => 'KEL. SUKAMAJU BARU',
                'wilayah_id' => 59,
            ],
            [
                'nama' => 'Kantor Kelurahan Jatijajar',
                'singkatan' => 'KEL. JATIJAJAR',
                'wilayah_id' => 60,
            ],
            [
                'nama' => 'Kantor Kelurahan Cilangkap',
                'singkatan' => 'KEL. CILANGKAP',
                'wilayah_id' => 61,
            ],
            [
                'nama' => 'Kantor Kelurahan Cimpaeun',
                'singkatan' => 'KEL. CIMPAEUN',
                'wilayah_id' => 62,
            ],
            [
                'nama' => 'Kantor Kecamatan Bojongsari',
                'singkatan' => 'KEC. BOJONGSARI',
                'wilayah_id' => 63,
            ],
            [
                'nama' => 'Kantor Kelurahan Bojongsari',
                'singkatan' => 'KEL. BOJONGSARI',
                'wilayah_id' => 64,
            ],
            [
                'nama' => 'Kantor Kelurahan Bojongsari Baru',
                'singkatan' => 'KEL. BOJONGSARI BARU',
                'wilayah_id' => 65,
            ],
            [
                'nama' => 'Kantor Kelurahan Serua',
                'singkatan' => 'KEL. SERUA',
                'wilayah_id' => 66,
            ],
            [
                'nama' => 'Kantor Kelurahan Pondok Petir',
                'singkatan' => 'KEL. PONDOK PETIR',
                'wilayah_id' => 67,
            ],
            [
                'nama' => 'Kantor Kelurahan Curug',
                'singkatan' => 'KEL. CURUG',
                'wilayah_id' => 68,
            ],
            [
                'nama' => 'Kantor Kelurahan Duren Seribu',
                'singkatan' => 'KEL. DUREN SERIBU',
                'wilayah_id' => 69,
            ],
            [
                'nama' => 'Kantor Kelurahan Duren Mekar',
                'singkatan' => 'KEL. DUREN MEKAR',
                'wilayah_id' => 70,
            ],
            [
                'nama' => 'Kantor Kecamatan Cinere',
                'singkatan' => 'KEC. CINERE',
                'wilayah_id' => 71,
            ],
            [
                'nama' => 'Kantor Kelurahan Cinere',
                'singkatan' => 'KEL. CINERE',
                'wilayah_id' => 72,
            ],
            [
                'nama' => 'Kantor Kelurahan Gandul',
                'singkatan' => 'KEL. GANDUL',
                'wilayah_id' => 73,
            ],
            [
                'nama' => 'Kantor Kelurahan Pangkal Jati Baru',
                'singkatan' => 'KEL. PANGKAL JATI BARU',
                'wilayah_id' => 74,
            ],
            [
                'nama' => 'Kantor Kelurahan Pangkal Jati Selatan',
                'singkatan' => 'KEL. PANGKAL JATI SELATAN',
                'wilayah_id' => 75,
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

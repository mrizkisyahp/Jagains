<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoriList = [
            [
                'nama' => 'Jalan Berlubang',
                'radius_gabung_m' => 15,
                'aktif' => true,
            ],
            [
                'nama' => 'Lampu Jalan Padam',
                'radius_gabung_m' => 20,
                'aktif' => true,
            ],
            [
                'nama' => 'Drainase Tersumbat',
                'radius_gabung_m' => 25,
                'aktif' => true,
            ],
            [
                'nama' => 'Trotoar Rusak',
                'radius_gabung_m' => 25,
                'aktif' => true,
            ],
            [
                'nama' => 'Rambu Lalu Lintas Rusak',
                'radius_gabung_m' => 25,
                'aktif' => true,
            ],
            [
                'nama' => 'Jembatan Rusak',
                'radius_gabung_m' => 25,
                'aktif' => true,
            ],
            [
                'nama' => 'Sampah Liar',
                'radius_gabung_m' => 25,
                'aktif' => true,
            ],
        ];

        foreach ($kategoriList as $data) {
            Kategori::updateOrCreate(
                ['nama' => $data['nama']],
                [
                    'radius_gabung_m' => $data['radius_gabung_m'],
                    'aktif' => $data['aktif'],
                ]
            );
        }
    }
}


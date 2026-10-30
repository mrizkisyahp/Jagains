<?php

namespace Database\Seeders;

use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AturanRoutingJakartaSeeder extends Seeder
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

        DB::transaction(function () use ($dkiCities) {
            foreach ($dkiCities as $kota) {
                $sudinBm = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Suku Dinas Bina Marga%')
                    ->first();
                $sudinSda = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Suku Dinas Sumber Daya Air%')
                    ->first();
                $sudinDishub = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Suku Dinas Perhubungan%')
                    ->first();
                $sudinDlh = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Suku Dinas Lingkungan Hidup%')
                    ->first();

                $mapping = [
                    'Jalan Berlubang' => $sudinBm?->id,
                    'Lampu Jalan Padam' => $sudinDishub?->id,
                    'Drainase Tersumbat' => $sudinSda?->id,
                    'Trotoar Rusak' => $sudinBm?->id,
                    'Rambu Lalu Lintas Rusak' => $sudinDishub?->id,
                    'Jembatan Rusak' => $sudinBm?->id,
                    'Sampah Liar' => $sudinDlh?->id,
                ];

                foreach ($mapping as $namaKategori => $instansiId) {
                    if (! $instansiId) {
                        continue;
                    }

                    $kategori = Kategori::where('nama', $namaKategori)->first();
                    if (! $kategori) {
                        continue;
                    }

                    AturanRouting::updateOrCreate(
                        [
                            'kategori_id' => $kategori->id,
                            'wilayah_id' => $kota->id,
                            'instansi_id' => $instansiId,
                        ],
                        [
                            'prioritas' => 100,
                        ]
                    );
                }
            }
        });
    }
}

<?php

namespace Database\Seeders;

use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AturanRoutingBodetabekSeeder extends Seeder
{
    /**
     * Run the database seeds for Bodetabek routing rules.
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

        DB::transaction(function () use ($cities) {
            foreach ($cities as $kota) {
                $dinasInfra = Instansi::where('wilayah_id', $kota->id)
                    ->where(function ($q) {
                        $q->where('nama', 'like', 'Dinas Pekerjaan Umum%')
                            ->orWhere('nama', 'like', 'Dinas Bina Marga%')
                            ->orWhere('nama', 'like', 'Dinas Sumber Daya Air%');
                    })
                    ->first();

                $dinasDishub = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Dinas Perhubungan%')
                    ->first();

                $dinasDlh = Instansi::where('wilayah_id', $kota->id)
                    ->where('nama', 'like', 'Dinas Lingkungan Hidup%')
                    ->first();

                $mapping = [
                    'Jalan Berlubang' => $dinasInfra?->id,
                    'Lampu Jalan Padam' => $dinasDishub?->id,
                    'Drainase Tersumbat' => $dinasInfra?->id,
                    'Trotoar Rusak' => $dinasInfra?->id,
                    'Rambu Lalu Lintas Rusak' => $dinasDishub?->id,
                    'Jembatan Rusak' => $dinasInfra?->id,
                    'Sampah Liar' => $dinasDlh?->id,
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

<?php

namespace Database\Seeders;

use App\Models\AturanRouting;
use App\Models\AturanSla;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;

class AturanRoutingDanSlaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kotaDepok = Wilayah::where('tingkat', 'kota')->first();
        if (! $kotaDepok) {
            return;
        }

        $pupr = Instansi::where('singkatan', 'DPUPR')->first();
        $dishub = Instansi::where('singkatan', 'DISHUB')->first();
        $dlhk = Instansi::where('singkatan', 'DLHK')->first();

        // Pemetaan kategori ke instansi penanggung jawab default Kota Depok
        $mapping = [
            'Jalan Berlubang' => $pupr?->id,
            'Lampu Jalan Padam' => $dishub?->id,
            'Drainase Tersumbat' => $pupr?->id,
            'Trotoar Rusak' => $pupr?->id,
            'Rambu Lalu Lintas Rusak' => $dishub?->id,
            'Jembatan Rusak' => $pupr?->id,
            'Sampah Liar' => $dlhk?->id,
        ];

        foreach ($mapping as $namaKategori => $instansiId) {
            $kategori = Kategori::where('nama', $namaKategori)->first();
            if (! $kategori) {
                continue;
            }

            // 1. Buat / update Aturan SLA standar untuk kategori ini
            AturanSla::updateOrCreate(
                ['kategori_id' => $kategori->id],
                [
                    'batas_respons_hk' => 3,       // Batas respon awal dinas: 3 Hari Kerja
                    'batas_survei_hk' => 5,        // Batas survei fisik: 5 Hari Kerja
                    'batas_anggaran_hk' => 10,     // Batas alokasi anggaran: 10 Hari Kerja
                    'batas_jawab_sengketa_hk' => 7, // Batas dinas menjawab sengketa: 7 Hari Kerja
                    'batas_verifikasi_hari' => 14, // Jendela kuorum verifikasi warga: 14 Hari Kalender
                ]
            );

            // 2. Buat / update Aturan Routing jika instansi tersedia
            if ($instansiId) {
                AturanRouting::updateOrCreate(
                    [
                        'kategori_id' => $kategori->id,
                        'wilayah_id' => $kotaDepok->id,
                        'instansi_id' => $instansiId,
                    ],
                    [
                        'prioritas' => 100, // Prioritas default tingkat kota
                    ]
                );
            }
        }
    }
}

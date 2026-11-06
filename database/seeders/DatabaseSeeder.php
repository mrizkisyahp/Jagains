<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            WilayahSeeder::class,
            WilayahJakartaSeeder::class,
            WilayahBodetabekSeeder::class,
            InstansiSeeder::class,
            InstansiJakartaSeeder::class,
            InstansiBodetabekSeeder::class,
            UserSeeder::class,
            KategoriSeeder::class,
            AturanRoutingDanSlaSeeder::class,
            AturanRoutingJakartaSeeder::class,
            AturanRoutingBodetabekSeeder::class,
            HariLiburSeeder::class,
            PengaturanSeeder::class,
            ParameterKuorumSeeder::class,
            LaporanSiklusHidupDemoSeeder::class,
        ]);
    }
}

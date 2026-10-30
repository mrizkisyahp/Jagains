<?php

namespace Tests\Feature\Kategori;

use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class KategoriDanRoutingSeederTest extends TestCase
{
    use DatabaseTransactions;

    public function test_kategori_seeder_mengisi_7_kategori_standar_srs(): void
    {
        $this->seed(KategoriSeeder::class);

        $this->assertDatabaseCount('kategori', 7);

        $kategoriHarapan = [
            'Jalan Berlubang',
            'Lampu Jalan Padam',
            'Drainase Tersumbat',
            'Trotoar Rusak',
            'Rambu Lalu Lintas Rusak',
            'Jembatan Rusak',
            'Sampah Liar',
        ];

        foreach ($kategoriHarapan as $nama) {
            $this->assertDatabaseHas('kategori', [
                'nama' => $nama,
            ]);
        }
    }

    public function test_aturan_routing_dan_sla_terisi_lengkap_untuk_semua_kategori(): void
    {
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }

        if (Instansi::count() === 0) {
            $this->seed(InstansiSeeder::class);
        }

        $this->seed(KategoriSeeder::class);
        $this->seed(AturanRoutingDanSlaSeeder::class);

        // Pastikan setiap kategori memiliki minimal 1 aturan SLA dengan batas positif
        $daftarKategori = Kategori::all();
        $this->assertCount(7, $daftarKategori);

        foreach ($daftarKategori as $kategori) {
            $this->assertDatabaseHas('aturan_sla', [
                'kategori_id' => $kategori->id,
                'batas_respons_hk' => 3, // Respons awal dinas 3 hari kerja
            ]);

            // Memastikan memiliki minimal 1 aturan routing ke instansi
            $routing = AturanRouting::where('kategori_id', $kategori->id)->first();
            $this->assertNotNull($routing, "Kategori {$kategori->nama} wajib memiliki aturan routing default.");
            $this->assertTrue(Instansi::where('id', $routing->instansi_id)->exists());
        }
    }
}

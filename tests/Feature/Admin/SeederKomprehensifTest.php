<?php

namespace Tests\Feature\Admin;

use App\Models\HariLibur;
use App\Models\Laporan;
use App\Models\ParameterKuorum;
use App\Models\Pengaturan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SeederKomprehensifTest extends TestCase
{
    use DatabaseTransactions;

    public function test_seeder_komprehensif_mengisi_parameter_hari_libur_dan_demo_data(): void
    {
        $this->seed(DatabaseSeeder::class);

        // 1. Verifikasi Hari Libur 2026
        $this->assertGreaterThanOrEqual(15, HariLibur::count());
        $this->assertDatabaseHas('hari_libur', [
            'tanggal' => '2026-08-17',
        ]);

        // 2. Verifikasi Pengaturan Sistem (P-01 s/d P-25)
        $this->assertDatabaseHas('pengaturan', ['key' => 'batas_sla_respons_hk', 'nilai' => '3']);
        $this->assertDatabaseHas('pengaturan', ['key' => 'ambang_dashboard_tiket', 'nilai' => '20']);
        $this->assertDatabaseHas('pengaturan', ['key' => 'jeda_ganti_kelurahan_hari', 'nilai' => '90']);

        // 3. Verifikasi Parameter Kuorum
        $this->assertGreaterThanOrEqual(1, ParameterKuorum::count());

        // 4. Verifikasi Akun Staf & Warga Demo
        $this->assertDatabaseHas('users', ['username' => 'admin1', 'peran' => 'admin']);
        $this->assertDatabaseHas('users', ['peran' => 'auditor']);
        $this->assertDatabaseHas('users', ['peran' => 'instansi']);
        $this->assertGreaterThanOrEqual(5, User::where('peran', 'warga')->count());

        // 5. Verifikasi Tiket Sampel Siklus Hidup
        $this->assertGreaterThanOrEqual(10, Laporan::count());
        $this->assertDatabaseHas('laporan', ['status' => 'PERLU_ROUTING']);
        $this->assertDatabaseHas('laporan', ['status' => 'DITERUSKAN']);
        $this->assertDatabaseHas('laporan', ['status' => 'TERTUTUP_WARGA']);
    }
}

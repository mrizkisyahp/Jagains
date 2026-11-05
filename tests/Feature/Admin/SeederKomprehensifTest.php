<?php

namespace Tests\Feature\Admin;

use App\Models\HariLibur;
use App\Models\Instansi;
use App\Models\Laporan;
use App\Models\ParameterKuorum;
use App\Models\Pengaturan;
use App\Models\RiwayatStatus;
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

        // 5. Verifikasi 255 tiket demo dan kepemilikan lima instansi penerima
        $laporanDemo = Laporan::query()
            ->where('nomor_tiket', 'like', 'JAG-2026-DEP-%');

        $this->assertSame(255, (clone $laporanDemo)->count());
        $this->assertSame(5, (clone $laporanDemo)->where('status', 'PERLU_ROUTING')->count());

        foreach (['DPUPR', 'DISHUB', 'DLHK', 'DPKP', 'DISRUMKIM'] as $singkatan) {
            $instansi = Instansi::where('singkatan', $singkatan)->firstOrFail();
            $this->assertSame(50, (clone $laporanDemo)->whereBelongsTo($instansi)->count());
        }

        $this->assertGreaterThanOrEqual(
            200,
            (clone $laporanDemo)->selectRaw('lintang, bujur')->distinct()->count(),
            'Koordinat laporan demo harus tersebar, bukan bertumpuk pada satu titik.',
        );

        // 6. Setiap tiket memiliki linimasa yang mencatat transisi awal hingga status saat ini
        $jumlahRiwayatMinimum = [
            'PERLU_ROUTING' => 1,
            'DITERUSKAN' => 1,
            'USULAN_TOLAK' => 2,
            'DITOLAK' => 3,
            'DITERIMA' => 2,
            'DISURVEI' => 3,
            'TERJADWAL_ANGGARAN' => 4,
            'DIKERJAKAN' => 5,
            'MENUNGGU_VERIFIKASI' => 6,
            'DISENGKETAKAN' => 7,
            'MENUNGGU_KEPUTUSAN_AUDITOR' => 7,
            'TERTUTUP_WARGA' => 7,
            'TERTUTUP_AUDITOR' => 8,
        ];

        $laporanDemo->each(function (Laporan $laporan) use ($jumlahRiwayatMinimum): void {
            $this->assertGreaterThanOrEqual(
                $jumlahRiwayatMinimum[$laporan->status],
                RiwayatStatus::whereBelongsTo($laporan)->count(),
                "Linimasa {$laporan->nomor_tiket} tidak lengkap.",
            );
        });
    }
}

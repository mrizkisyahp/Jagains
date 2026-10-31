<?php

namespace Tests\Feature\Instansi;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardInstansiFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }
    }

    public function test_petugas_instansi_dapat_mengakses_dashboard_kinerja_internal(): void
    {
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Uji Coba Kinerja',
            'singkatan' => 'DUCK',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $petugas = User::factory()->instansi()->create([
            'instansi_id' => $instansi->id,
        ]);

        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();
        $warga = User::factory()->warga()->create();

        Laporan::create([
            'nomor_tiket' => 'JAG-INST-DSH-01',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Uji Coba Laporan Instansi',
            'keterangan' => 'Deskripsi aduan uji coba dashboard instansi',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        $response = $this->actingAs($petugas)->get('/instansi/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('instansi/dashboard')
            ->has('statistik.total_tiket')
            ->has('statistik.tiket_berjalan')
            ->has('statistik.tiket_lewat_sla')
            ->has('statistik.tiket_menunggu_verifikasi')
            ->has('statistik.tiket_selesai')
            ->has('distribusiTahap')
            ->has('tiketPrioritas')
        );
    }

    public function test_warga_dan_guest_ditolak_mengakses_dashboard_instansi(): void
    {
        $warga = User::factory()->warga()->create();

        $this->get('/instansi/dashboard')->assertRedirect('/login');
        $this->actingAs($warga)->get('/instansi/dashboard')->assertForbidden();
    }
}

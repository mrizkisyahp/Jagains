<?php

namespace Tests\Feature\Tiket;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TiketPublikFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->seed([WilayahSeeder::class, KategoriSeeder::class]);
    }

    public function test_detail_tiket_bisa_diakses_publik_tanpa_login(): void
    {
        $pelapor = User::factory()->create([
            'peran' => 'warga',
            'status_akun' => 'aktif',
            'username' => 'warga_rahasia_123',
        ]);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        Laporan::create([
            'nomor_tiket' => 'JAG-2026-PUB-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Rusak Parah di Margonda',
            'keterangan' => 'Aspal mengelupas panjang 5 meter',
            'keparahan' => 'berat',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $response = $this->get('/tiket/JAG-2026-PUB-001');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('tiket/detail')
            ->has('tiket', fn (Assert $t) => $t
                ->where('nomor_tiket', 'JAG-2026-PUB-001')
                ->where('judul', 'Jalan Rusak Parah di Margonda')
                ->where('disembunyikan', false)
                ->where('kelurahan_nama', $kelurahan->nama)
                ->missing('pelapor_id')
                ->missing('pelapor')
                ->etc()
            )
        );

        // Pastikan tidak ada data identitas pelapor pada seluruh konten halaman
        $response->assertDontSee('warga_rahasia_123');
    }

    public function test_detail_tiket_tidak_ditemukan_mengembalikan_404(): void
    {
        $response = $this->get('/tiket/JAG-TIDAK-ADA-999');
        $response->assertStatus(404);
    }

    public function test_detail_tiket_disembunyikan_moderasi_menampilkan_pesan_khusus(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        Laporan::create([
            'nomor_tiket' => 'JAG-2026-PUB-HIDDEN',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Judul Mengandung Kata Terlarang',
            'keterangan' => 'Deskripsi tidak pantas',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => true,
        ]);

        $response = $this->get('/tiket/JAG-2026-PUB-HIDDEN');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('tiket/detail')
            ->has('tiket', fn (Assert $t) => $t
                ->where('nomor_tiket', 'JAG-2026-PUB-HIDDEN')
                ->where('disembunyikan', true)
                ->where('keterangan', '')
                ->etc()
            )
        );
        $response->assertDontSee('Judul Mengandung Kata Terlarang');
    }

    public function test_detail_tiket_dapat_diakses_berbagai_peran_pengguna(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-ROLES-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Lampu PJU Rusak',
            'keterangan' => 'PJU padam total',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        // 1. Warga Terdaftar
        $warga = User::factory()->warga()->create(['status_akun' => 'aktif']);
        $this->actingAs($warga)->get('/tiket/JAG-2026-ROLES-001')->assertStatus(200);

        // 2. Petugas Instansi
        $instansi = User::factory()->instansi()->create(['status_akun' => 'aktif']);
        $this->actingAs($instansi)->get('/tiket/JAG-2026-ROLES-001')->assertStatus(200);

        // 3. Auditor Independen
        $auditor = User::factory()->auditor()->create(['status_akun' => 'aktif']);
        $this->actingAs($auditor)->get('/tiket/JAG-2026-ROLES-001')->assertStatus(200);

        // 4. Administrator Sistem
        $admin = User::factory()->admin()->create(['status_akun' => 'aktif']);
        $this->actingAs($admin)->get('/tiket/JAG-2026-ROLES-001')->assertStatus(200);
    }
}

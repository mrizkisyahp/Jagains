<?php

namespace Tests\Feature\Admin;

use App\Models\AturanRouting;
use App\Models\AturanSla;
use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\ParameterKuorum;
use App\Models\Pengaturan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\PengaturanSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class KonfigurasiSistemFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }
        if (Pengaturan::count() === 0) {
            $this->seed(PengaturanSeeder::class);
        }
    }

    public function test_admin_dapat_melihat_halaman_konfigurasi_sistem(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/konfigurasi');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/konfigurasi')
            ->has('pengaturan')
            ->has('masterInstansi')
            ->has('masterKategori')
            ->has('masterWilayah')
            ->has('aturanRouting')
            ->has('aturanSla')
            ->has('parameterKuorum')
        );
    }

    public function test_admin_dapat_memperbarui_parameter_sistem(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->put('/admin/konfigurasi/parameter/batas_sla_respons_hk', [
            'nilai' => '7',
            'alasan' => 'Penyesuaian batas SLA respons default sistem',
        ]);

        $response->assertRedirect();

        $p = Pengaturan::where('key', 'batas_sla_respons_hk')->first();
        $this->assertEquals('7', $p->nilai);
        $this->assertEquals(2, $p->versi);
        $this->assertEquals($admin->id, $p->diubah_oleh);

        $audit = AuditLog::where('aksi', 'UBAH_PENGATURAN_SISTEM')
            ->where('objek_id', null)
            ->latest('id')
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_admin_dapat_menambah_dan_mengubah_master_instansi(): void
    {
        $admin = User::factory()->admin()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();

        // Tambah Instansi
        $response = $this->actingAs($admin)->post('/admin/konfigurasi/instansi', [
            'nama' => 'Dinas Ketahanan Pangan Pengujian',
            'singkatan' => 'DKPP',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $response->assertRedirect();
        $instansi = Instansi::where('singkatan', 'DKPP')->first();
        $this->assertNotNull($instansi);

        // Ubah Instansi
        $responseEdit = $this->actingAs($admin)->put("/admin/konfigurasi/instansi/{$instansi->id}", [
            'nama' => 'Dinas Ketahanan Pangan dan Pertanian',
            'singkatan' => 'DKPP_NEW',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $responseEdit->assertRedirect();
        $this->assertEquals('DKPP_NEW', $instansi->fresh()->singkatan);
    }

    public function test_admin_dapat_menambah_dan_mengubah_master_kategori(): void
    {
        $admin = User::factory()->admin()->create();

        // Tambah Kategori
        $response = $this->actingAs($admin)->post('/admin/konfigurasi/kategori', [
            'nama' => 'Pohon Tumbang Berbahaya',
            'radius_gabung_m' => 30,
            'aktif' => true,
        ]);

        $response->assertRedirect();
        $kategori = Kategori::where('nama', 'Pohon Tumbang Berbahaya')->first();
        $this->assertNotNull($kategori);
        $this->assertEquals(30, $kategori->radius_gabung_m);

        // Ubah Kategori
        $responseEdit = $this->actingAs($admin)->put("/admin/konfigurasi/kategori/{$kategori->id}", [
            'nama' => 'Pohon Tumbang dan Ranting Rapuh',
            'radius_gabung_m' => 35,
            'aktif' => false,
        ]);

        $responseEdit->assertRedirect();
        $this->assertEquals('Pohon Tumbang dan Ranting Rapuh', $kategori->fresh()->nama);
        $this->assertFalse($kategori->fresh()->aktif);
        $this->assertEquals(35, $kategori->fresh()->radius_gabung_m);

        // Audit Log tercatat
        $audit = AuditLog::where('aksi', 'UBAH_MASTER_KATEGORI')
            ->where('objek_id', $kategori->id)
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_admin_dapat_menambah_dan_mengubah_master_wilayah(): void
    {
        $admin = User::factory()->admin()->create();
        $kecamatan = Wilayah::where('tingkat', 'kecamatan')->first() ?? Wilayah::where('tingkat', 'kota')->first();

        // Tambah Wilayah (Kelurahan)
        $response = $this->actingAs($admin)->post('/admin/konfigurasi/wilayah', [
            'tingkat' => 'kelurahan',
            'nama' => 'Kelurahan Uji Baru',
            'kode_bps' => '3276999999',
            'induk_id' => $kecamatan->id,
        ]);

        $response->assertRedirect();
        $wilayah = Wilayah::where('nama', 'Kelurahan Uji Baru')->first();
        $this->assertNotNull($wilayah);
        $this->assertEquals('kelurahan', $wilayah->tingkat);
        $this->assertEquals($kecamatan->id, $wilayah->induk_id);

        // Ubah Wilayah
        $responseEdit = $this->actingAs($admin)->put("/admin/konfigurasi/wilayah/{$wilayah->id}", [
            'tingkat' => 'kelurahan',
            'nama' => 'Kelurahan Uji Baru Revisi',
            'kode_bps' => '3276999988',
            'induk_id' => $kecamatan->id,
        ]);

        $responseEdit->assertRedirect();
        $this->assertEquals('Kelurahan Uji Baru Revisi', $wilayah->fresh()->nama);
        $this->assertEquals('3276999988', $wilayah->fresh()->kode_bps);

        // Audit Log tercatat
        $audit = AuditLog::where('aksi', 'UBAH_MASTER_WILAYAH')
            ->where('objek_id', $wilayah->id)
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_admin_dapat_mengatur_aturan_routing_disposisi(): void
    {
        $admin = User::factory()->admin()->create();
        $kategori = Kategori::first();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $instansi = Instansi::create([
            'nama' => 'Dinas Routing Baru',
            'singkatan' => 'DRB',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $response = $this->actingAs($admin)->post('/admin/konfigurasi/routing', [
            'kategori_id' => $kategori->id,
            'wilayah_id' => $kota->id,
            'instansi_id' => $instansi->id,
            'prioritas' => 10,
        ]);

        $response->assertRedirect();
        $aturan = AturanRouting::where('kategori_id', $kategori->id)
            ->where('wilayah_id', $kota->id)
            ->where('instansi_id', $instansi->id)
            ->first();
        $this->assertNotNull($aturan);
        $this->assertEquals(10, $aturan->prioritas);

        // Ubah Aturan Routing
        $responseEdit = $this->actingAs($admin)->put("/admin/konfigurasi/routing/{$aturan->id}", [
            'kategori_id' => $kategori->id,
            'wilayah_id' => $kota->id,
            'instansi_id' => $instansi->id,
            'prioritas' => 50,
        ]);

        $responseEdit->assertRedirect();
        $this->assertEquals(50, $aturan->fresh()->prioritas);

        // Hapus Aturan Routing
        $responseHapus = $this->actingAs($admin)->delete("/admin/konfigurasi/routing/{$aturan->id}");
        $responseHapus->assertRedirect();
        $this->assertNull(AturanRouting::find($aturan->id));

        // Audit Log penghapusan tercatat
        $auditHapus = AuditLog::where('aksi', 'HAPUS_ATURAN_ROUTING')
            ->where('objek_id', $aturan->id)
            ->first();
        $this->assertNotNull($auditHapus);
    }

    public function test_fallback_update_ketika_aturan_routing_sama_persis_ditambahkan(): void
    {
        $admin = User::factory()->admin()->create();
        $kategori = Kategori::first();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $instansi = Instansi::create([
            'nama' => 'Dinas Fallback Routing',
            'singkatan' => 'DFR',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        // Simpan aturan pertama kali
        $this->actingAs($admin)->post('/admin/konfigurasi/routing', [
            'kategori_id' => $kategori->id,
            'wilayah_id' => $kota->id,
            'instansi_id' => $instansi->id,
            'prioritas' => 20,
        ]);

        $aturanAwal = AturanRouting::where('kategori_id', $kategori->id)
            ->where('wilayah_id', $kota->id)
            ->where('instansi_id', $instansi->id)
            ->first();
        $this->assertNotNull($aturanAwal);
        $this->assertEquals(20, $aturanAwal->prioritas);

        // Simpan aturan baru dengan kombinasi (kategori, wilayah, instansi) yang sama persis tapi beda prioritas
        // Sistem harus melakukan fallback update dan tidak melempar duplicate key exception
        $responseDuplicate = $this->actingAs($admin)->post('/admin/konfigurasi/routing', [
            'kategori_id' => $kategori->id,
            'wilayah_id' => $kota->id,
            'instansi_id' => $instansi->id,
            'prioritas' => 80,
        ]);

        $responseDuplicate->assertRedirect();
        $this->assertEquals(80, $aturanAwal->fresh()->prioritas);
        $this->assertEquals(
            1,
            AturanRouting::where('kategori_id', $kategori->id)
                ->where('wilayah_id', $kota->id)
                ->where('instansi_id', $instansi->id)
                ->count()
        );
    }

    public function test_admin_dapat_mengubah_standar_sla_dan_parameter_kuorum(): void
    {
        $admin = User::factory()->admin()->create();
        $kategori = Kategori::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        // Update SLA Kategori
        $responseSla = $this->actingAs($admin)->post('/admin/konfigurasi/sla', [
            'kategori_id' => $kategori->id,
            'batas_respons_hk' => 4,
            'batas_survei_hk' => 6,
            'batas_anggaran_hk' => 12,
            'batas_jawab_sengketa_hk' => 8,
            'batas_verifikasi_hari' => 14,
        ]);

        $responseSla->assertRedirect();
        $sla = AturanSla::where('kategori_id', $kategori->id)->first();
        $this->assertNotNull($sla);
        $this->assertEquals(4, $sla->batas_respons_hk);

        // Update Kuorum Wilayah
        $responseKuorum = $this->actingAs($admin)->post('/admin/konfigurasi/kuorum', [
            'wilayah_id' => $kelurahan->id,
            'k_bp' => 250,
            'kmin' => 2.5,
            'kmax' => 6.0,
        ]);

        $responseKuorum->assertRedirect();
        $kuorum = ParameterKuorum::where('wilayah_id', $kelurahan->id)->first();
        $this->assertNotNull($kuorum);
        $this->assertEquals(250, $kuorum->k_bp);
    }
}

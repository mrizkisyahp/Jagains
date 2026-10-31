<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AdminRoutingFeatureTest extends TestCase
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

    public function test_admin_dapat_melihat_antrean_tiket_menggantung(): void
    {
        $admin = User::factory()->admin()->create();
        $warga = User::factory()->warga()->create();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        // Buat tiket berstatus PERLU_ROUTING (instansi_id harus null)
        Laporan::create([
            'nomor_tiket' => 'JAG-ROUTING-TEST-01',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Butuh Routing Manual',
            'keterangan' => 'Laporan tidak menemukan aturan routing otomatis di sistem',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        $response = $this->actingAs($admin)->get('/admin/antrean-routing');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/antrean-routing')
            ->has('antrean')
            ->has('daftarInstansi')
        );
    }

    public function test_admin_dapat_melakukan_disposisi_routing_manual(): void
    {
        $admin = User::factory()->admin()->create();
        $warga = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Bina Marga Pengujian',
            'singkatan' => 'DBMP',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-ROUTING-TEST-02',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Akan Didisposisikan Manual',
            'keterangan' => 'Keterangan laporan untuk uji coba disposisi admin',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        $response = $this->actingAs($admin)->post("/admin/antrean-routing/{$laporan->nomor_tiket}/disposisi", [
            'instansi_id' => $instansi->id,
            'catatan' => 'Didisposisikan secara manual ke dinas terkait karena kategori khusus.',
        ]);

        $response->assertRedirect();

        $laporanSegar = $laporan->fresh();
        $this->assertEquals('DITERUSKAN', $laporanSegar->status);
        $this->assertEquals($instansi->id, $laporanSegar->instansi_id);

        // Periksa riwayat status tercatat
        $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->latest('id')->first();
        $this->assertNotNull($riwayat);
        $this->assertEquals('DITERUSKAN', $riwayat->status_baru);
        $this->assertEquals('PERLU_ROUTING', $riwayat->status_lama);

        // Periksa audit log tercatat
        $audit = AuditLog::where('laporan_id', $laporan->id)
            ->where('aksi', 'DISPOSISI_ROUTING_MANUAL')
            ->first();
        $this->assertNotNull($audit);
        $this->assertEquals($admin->id, $audit->pelaku_id);
    }

    public function test_disposisi_gagal_jika_catatan_kurang_dari_10_karakter(): void
    {
        $admin = User::factory()->admin()->create();
        $warga = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Uji Pendek',
            'singkatan' => 'DUP',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-ROUTING-TEST-03',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Uji Catatan Pendek',
            'keterangan' => 'Keterangan laporan untuk uji coba catatan pendek',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        $response = $this->actingAs($admin)->post("/admin/antrean-routing/{$laporan->nomor_tiket}/disposisi", [
            'instansi_id' => $instansi->id,
            'catatan' => 'Pendek',
        ]);

        $response->assertSessionHasErrors(['catatan']);
        $this->assertEquals('PERLU_ROUTING', $laporan->fresh()->status);
    }

    public function test_non_admin_ditolak_melakukan_disposisi(): void
    {
        $warga = User::factory()->warga()->create();

        $response = $this->actingAs($warga)->get('/admin/antrean-routing');
        $response->assertForbidden();

        $postResponse = $this->actingAs($warga)->post('/admin/antrean-routing/JAG-XYZ/disposisi', [
            'instansi_id' => 1,
            'catatan' => 'Percobaan oleh warga non-admin harus ditolak',
        ]);
        $postResponse->assertForbidden();
    }
}

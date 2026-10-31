<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BukaIdentitasPelaporFeatureTest extends TestCase
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

    public function test_admin_dan_auditor_dapat_membuka_identitas_pelapor_dengan_alasan_sah(): void
    {
        $admin = User::factory()->admin()->create();
        $auditor = User::factory()->auditor()->create();
        $warga = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Investigasi',
            'singkatan' => 'DI',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-INV-TEST-01',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Butuh Investigasi Hukum',
            'keterangan' => 'Terindikasi adanya tindak pidana perusakan fasilitas umum.',
            'keparahan' => 'berat',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        // 1. Admin Request
        $responseAdmin = $this->actingAs($admin)->postJson("/api/tiket/{$laporan->nomor_tiket}/buka-identitas", [
            'alasan' => 'Investigasi formal aparat penegak hukum atas perusakan aset daerah.',
        ]);

        $responseAdmin->assertOk();
        $responseAdmin->assertJson([
            'sukses' => true,
            'pelapor' => [
                'id' => $warga->id,
                'username' => $warga->username,
            ],
        ]);

        // Pastikan Audit Log Terbentuk
        $auditAdmin = AuditLog::where('aksi', 'BUKA_IDENTITAS_PELAPOR')
            ->where('pelaku_id', $admin->id)
            ->where('laporan_id', $laporan->id)
            ->first();
        $this->assertNotNull($auditAdmin);
        $this->assertEquals('Investigasi formal aparat penegak hukum atas perusakan aset daerah.', $auditAdmin->alasan);

        // 2. Auditor Request
        $responseAuditor = $this->actingAs($auditor)->postJson("/api/tiket/{$laporan->nomor_tiket}/buka-identitas", [
            'alasan' => 'Audit investigatif independen atas indikasi sengketa berulang.',
        ]);

        $responseAuditor->assertOk();
        $auditAuditor = AuditLog::where('aksi', 'BUKA_IDENTITAS_PELAPOR')
            ->where('pelaku_id', $auditor->id)
            ->where('laporan_id', $laporan->id)
            ->first();
        $this->assertNotNull($auditAuditor);
    }

    public function test_permintaan_buka_identitas_gagal_jika_alasan_kurang_dari_10_karakter(): void
    {
        $admin = User::factory()->admin()->create();
        $warga = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Investigasi 2',
            'singkatan' => 'DI2',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-INV-TEST-02',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Uji Alasan Singkat',
            'keterangan' => 'Deskripsi laporan uji',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/tiket/{$laporan->nomor_tiket}/buka-identitas", [
            'alasan' => 'Pendek',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['alasan']);
    }

    public function test_warga_dan_petugas_instansi_ditolak_membuka_identitas_pelapor(): void
    {
        $warga = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $instansi = Instansi::create([
            'nama' => 'Dinas Penolakan',
            'singkatan' => 'DP',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);
        $petugasInstansi = User::factory()->instansi()->create([
            'instansi_id' => $instansi->id,
        ]);

        $responseWarga = $this->actingAs($warga)->postJson('/api/tiket/JAG-INV-XYZ/buka-identitas', [
            'alasan' => 'Mencoba mengakses tanpa hak wewenang investigasi.',
        ]);
        $responseWarga->assertForbidden();

        $responseInstansi = $this->actingAs($petugasInstansi)->postJson('/api/tiket/JAG-INV-XYZ/buka-identitas', [
            'alasan' => 'Dinas teknis tidak memiliki wewenang membuka identitas pelapor.',
        ]);
        $responseInstansi->assertForbidden();
    }
}

<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\LaporanPelanggaran;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ModerasiKontenFeatureTest extends TestCase
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

    public function test_admin_dapat_melihat_daftar_antrean_moderasi(): void
    {
        $admin = User::factory()->admin()->create();
        $wargaPelapor = User::factory()->warga()->create();
        $wargaPengadu = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Moderasi 1',
            'singkatan' => 'DM1',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-MOD-TEST-01',
            'pelapor_id' => $wargaPelapor->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Konten Menyesatkan',
            'keterangan' => 'Foto yang dilampirkan tidak sesuai fakta di lapangan.',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $wargaPengadu->id,
            'alasan' => 'informasi_palsu',
            'catatan' => 'Laporan ini menggunakan foto lama dari internet.',
            'status' => 'menunggu',
        ]);

        $response = $this->actingAs($admin)->get('/admin/moderasi');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/moderasi')
            ->has('antreanModerasi')
        );
    }

    public function test_tindakan_sembunyikan_tiket_menyembunyikan_laporan_dan_mencatat_audit(): void
    {
        $admin = User::factory()->admin()->create();
        $wargaPelapor = User::factory()->warga()->create();
        $wargaPengadu = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Moderasi 2',
            'singkatan' => 'DM2',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-MOD-TEST-02',
            'pelapor_id' => $wargaPelapor->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Mengandung Unsur SARA',
            'keterangan' => 'Keterangan laporan tidak pantas',
            'keparahan' => 'berat',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        $pelanggaran = LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $wargaPengadu->id,
            'alasan' => 'sara_ujaran_kebencian',
            'catatan' => 'Terdapat kata-kata penghinaan kelompok masyarakat tertentu.',
            'status' => 'menunggu',
        ]);

        $response = $this->actingAs($admin)->post("/admin/moderasi/{$pelanggaran->id}/tindak", [
            'tindakan' => 'disembunyikan',
            'catatan' => 'Terbukti melanggar panduan komunitas; disembunyikan dari publik.',
        ]);

        $response->assertRedirect();

        $this->assertTrue($laporan->fresh()->disembunyikan);
        $pelanggaranSegar = $pelanggaran->fresh();
        $this->assertEquals('selesai', $pelanggaranSegar->status);
        $this->assertEquals('disembunyikan', $pelanggaranSegar->tindakan);
        $this->assertEquals($admin->id, $pelanggaranSegar->moderator_id);

        $audit = AuditLog::where('aksi', 'MODERASI_KONTEN')
            ->where('laporan_id', $laporan->id)
            ->first();
        $this->assertNotNull($audit);
        $this->assertEquals($admin->id, $audit->pelaku_id);
    }

    public function test_tindakan_beri_peringatan_menaikkan_poin_peringatan_pelapor(): void
    {
        $admin = User::factory()->admin()->create();
        $wargaPelapor = User::factory()->warga()->create([
            'poin_peringatan' => 0,
        ]);
        $wargaPengadu = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Moderasi 3',
            'singkatan' => 'DM3',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-MOD-TEST-03',
            'pelapor_id' => $wargaPelapor->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Spam Laporan Berulang',
            'keterangan' => 'Laporan promosi',
            'keparahan' => 'ringan',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        $pelanggaran = LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $wargaPengadu->id,
            'alasan' => 'spam_promosi',
            'catatan' => 'Laporan iklan komersial',
            'status' => 'menunggu',
        ]);

        $response = $this->actingAs($admin)->post("/admin/moderasi/{$pelanggaran->id}/tindak", [
            'tindakan' => 'peringatan',
            'catatan' => 'Peringatan pertama atas laporan spam komersial.',
        ]);

        $response->assertRedirect();
        $this->assertEquals(1, $wargaPelapor->fresh()->poin_peringatan);
    }

    public function test_tindakan_bekukan_akun_mengubah_status_akun_pelapor(): void
    {
        $admin = User::factory()->admin()->create();
        $wargaPelapor = User::factory()->warga()->create([
            'status_akun' => 'aktif',
        ]);
        $wargaPengadu = User::factory()->warga()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Moderasi 4',
            'singkatan' => 'DM4',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-MOD-TEST-04',
            'pelapor_id' => $wargaPelapor->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Pelecehan Berat',
            'keterangan' => 'Konten sangat tidak pantas',
            'keparahan' => 'berat',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'DITERUSKAN',
            'disembunyikan' => false,
        ]);

        $pelanggaran = LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $wargaPengadu->id,
            'alasan' => 'foto_tidak_senonoh',
            'catatan' => 'Pelanggaran berat',
            'status' => 'menunggu',
        ]);

        $response = $this->actingAs($admin)->post("/admin/moderasi/{$pelanggaran->id}/tindak", [
            'tindakan' => 'dibekukan',
            'catatan' => 'Pelanggaran berat terhadap ketentuan hukum dan privasi.',
        ]);

        $response->assertRedirect();
        $this->assertEquals('dibekukan', $wargaPelapor->fresh()->status_akun);
    }
}

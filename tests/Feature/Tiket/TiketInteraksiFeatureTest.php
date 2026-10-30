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
use Tests\TestCase;

class TiketInteraksiFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->seed([WilayahSeeder::class, KategoriSeeder::class]);
    }

    public function test_dukung_tiket_gagal_jika_belum_login(): void
    {
        $response = $this->postJson('/tiket/JAG-2026-TEST/dukung');
        $response->assertStatus(401);
    }

    public function test_dukung_tiket_berhasil_untuk_warga_aktif(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-INTERAKSI-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Sampah Menumpuk di Pasar',
            'keterangan' => 'Sudah 3 hari tidak diangkut',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $warga = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        $response = $this->actingAs($warga)->postJson('/tiket/JAG-2026-INTERAKSI-001/dukung');

        $response->assertStatus(200);
        $response->assertJson([
            'sukses' => true,
            'sudah_didukung' => true,
            'total_dukungan' => 1,
        ]);
    }

    public function test_dukung_tiket_ditolak_jika_akun_dibekukan(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        Laporan::create([
            'nomor_tiket' => 'JAG-2026-INTERAKSI-002',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Ambles',
            'keterangan' => 'Jalan ambles sedalam 30 cm',
            'keparahan' => 'berat',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $wargaDibekukan = User::factory()->create([
            'peran' => 'warga',
            'status_akun' => 'dibekukan',
            'poin_peringatan' => 5,
        ]);

        $response = $this->actingAs($wargaDibekukan)->postJson('/tiket/JAG-2026-INTERAKSI-002/dukung');
        $response->assertStatus(403);
    }

    public function test_lapor_konten_validasi_alasan_wajib(): void
    {
        $warga = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        $response = $this->actingAs($warga)->postJson('/tiket/JAG-2026-INTERAKSI-001/lapor-konten', [
            'alasan' => '',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['alasan']);
    }

    public function test_lapor_konten_berhasil_masuk_antrean_moderasi(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-INTERAKSI-003',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Laporan Konten Ujaran Kebencian',
            'keterangan' => 'Laporan uji coba konten pelanggaran',
            'keparahan' => 'ringan',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $warga = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        $response = $this->actingAs($warga)->postJson('/tiket/JAG-2026-INTERAKSI-003/lapor-konten', [
            'alasan' => 'sara_ujaran_kebencian',
            'catatan' => 'Uraian kata-kata mengandung diskriminasi SARA.',
        ]);

        $response->assertStatus(201);
        $response->assertJson(['sukses' => true]);

        $this->assertDatabaseHas('laporan_pelanggaran', [
            'laporan_id' => $laporan->id,
            'pelapor_id' => $warga->id,
            'alasan' => 'sara_ujaran_kebencian',
            'status' => 'menunggu',
        ]);
    }
}

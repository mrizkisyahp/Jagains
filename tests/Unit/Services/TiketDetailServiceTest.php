<?php

namespace Tests\Unit\Services;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\PetaLaporanService;
use App\Services\TiketDetailService;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TiketDetailServiceTest extends TestCase
{
    use DatabaseTransactions;

    private TiketDetailService $service;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->seed([WilayahSeeder::class, KategoriSeeder::class]);
        $petaService = new PetaLaporanService;
        $this->service = new TiketDetailService($petaService);
    }

    public function test_ambil_detail_tiket_zero_knowledge_privacy(): void
    {
        $pelapor = User::factory()->create([
            'peran' => 'warga',
            'status_akun' => 'aktif',
            'username' => 'rahasia_pelapor_123',
        ]);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-ZK-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Berlubang Dekat Stasiun',
            'keterangan' => 'Lubang sedalam 15cm membahayakan pemotor',
            'keparahan' => 'berat',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 4.5,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $detail = $this->service->ambilDetailTiket('JAG-2026-ZK-001');

        $this->assertNotNull($detail);
        $this->assertEquals('JAG-2026-ZK-001', $detail['nomor_tiket']);
        $this->assertEquals('Jalan Berlubang Dekat Stasiun', $detail['judul']);
        $this->assertArrayNotHasKey('pelapor_id', $detail);
        $this->assertArrayNotHasKey('pelapor', $detail);
        $this->assertStringNotContainsString('rahasia_pelapor_123', json_encode($detail));
    }

    public function test_ambil_detail_tiket_disembunyikan_moderasi(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-HIDDEN-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Judul Berisi Konten Terlarang',
            'keterangan' => 'Deskripsi tidak pantas',
            'keparahan' => 'ringan',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 5.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => true,
        ]);

        $detail = $this->service->ambilDetailTiket('JAG-2026-HIDDEN-001');

        $this->assertNotNull($detail);
        $this->assertTrue($detail['disembunyikan']);
        $this->assertStringNotContainsString('Judul Berisi Konten Terlarang', $detail['judul']);
        $this->assertEmpty($detail['keterangan']);
    }

    public function test_toggle_dukungan_laporan(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-VOTE-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Lampu PJU Padam',
            'keterangan' => 'Gelap gulita di malam hari',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 5.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $warga = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        // 1. Dukung pertama kali -> bertambah
        $hasil1 = $this->service->toggleDukungan('JAG-2026-VOTE-001', $warga);
        $this->assertTrue($hasil1['sukses']);
        $this->assertTrue($hasil1['sudah_didukung']);
        $this->assertEquals(1, $hasil1['total_dukungan']);
        $this->assertDatabaseHas('dukungan', [
            'laporan_id' => $laporan->id,
            'pengguna_id' => $warga->id,
        ]);

        // Cek update aktivitas warga
        $warga->refresh();
        $this->assertNotNull($warga->aktivitas_terakhir_pada);

        // 2. Dukung kedua kali -> dibatalkan
        $hasil2 = $this->service->toggleDukungan('JAG-2026-VOTE-001', $warga);
        $this->assertTrue($hasil2['sukses']);
        $this->assertFalse($hasil2['sudah_didukung']);
        $this->assertEquals(0, $hasil2['total_dukungan']);
        $this->assertDatabaseMissing('dukungan', [
            'laporan_id' => $laporan->id,
            'pengguna_id' => $warga->id,
        ]);
    }

    public function test_toggle_dukungan_ditolak_jika_akun_dibekukan(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-FROZEN-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Drainase Mampet',
            'keterangan' => 'Air meluap',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 5.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $wargaBeku = User::factory()->create([
            'peran' => 'warga',
            'status_akun' => 'dibekukan',
            'poin_peringatan' => 5,
        ]);

        $hasil = $this->service->toggleDukungan('JAG-2026-FROZEN-001', $wargaBeku);
        $this->assertFalse($hasil['sukses']);
        $this->assertEquals(403, $hasil['status_code']);
    }

    public function test_laporkan_konten_melanggar(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-FLAG-001',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Trotoar Rusak',
            'keterangan' => 'Batu conblock copot',
            'keparahan' => 'ringan',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 5.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $warga = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        $hasil = $this->service->laporkanKonten(
            'JAG-2026-FLAG-001',
            $warga,
            'spam_promosi',
            'Memuat link promosi judi online'
        );

        $this->assertTrue($hasil['sukses']);
        $this->assertDatabaseHas('laporan_pelanggaran', [
            'laporan_id' => $laporan->id,
            'pelapor_id' => $warga->id,
            'alasan' => 'spam_promosi',
            'status' => 'menunggu',
        ]);

        // Uji coba lapor lagi saat masih menunggu -> harus ditolak
        $hasilDuplikat = $this->service->laporkanKonten(
            'JAG-2026-FLAG-001',
            $warga,
            'spam_promosi',
            'Laporan kedua'
        );
        $this->assertFalse($hasilDuplikat['sukses']);
        $this->assertEquals(422, $hasilDuplikat['status_code']);
    }
}

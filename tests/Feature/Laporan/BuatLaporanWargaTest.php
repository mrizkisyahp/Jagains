<?php

namespace Tests\Feature\Laporan;

use App\Models\Dukungan;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BuatLaporanWargaTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Instansi::count() === 0) {
            $this->seed(InstansiSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
            $this->seed(AturanRoutingDanSlaSeeder::class);
        }
    }

    private function generateBase64Image(): string
    {
        $img = imagecreatetruecolor(640, 480);
        $color = imagecolorallocate($img, 100, 150, 200);
        imagefill($img, 0, 0, $color);
        ob_start();
        imagejpeg($img, null, 80);
        $data = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,'.base64_encode($data);
    }

    public function test_warga_dapat_membuat_laporan_dengan_foto_kamera_dan_routing_otomatis(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::where('nama', 'Jalan Berlubang')->first();

        // Titik di Kelurahan Kemiri Muka, Beji, Depok (-6.375, 106.828)
        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Jalan berlubang cukup parah di depan ruko, membahayakan motor.',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'akurasi_gps_m' => 8.5,
            'lokasi_sumber' => 'gps',
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)->postJson('/warga/lapor', $payload);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'sukses',
            'pesan',
            'nomor_tiket',
            'laporan' => [
                'id',
                'nomor_tiket',
                'judul',
                'status',
            ],
        ]);

        $nomorTiket = $response->json('nomor_tiket');
        $this->assertStringStartsWith('JAG-', $nomorTiket);

        // Verifikasi tabel laporan
        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->first();
        $this->assertNotNull($laporan);
        $this->assertEquals($warga->id, $laporan->pelapor_id);
        $this->assertEquals('DITERUSKAN', $laporan->status);
        $this->assertNotNull($laporan->instansi_id);
        $this->assertEquals('RESPONS', $laporan->sla_tahap);
        $this->assertEquals(3, $laporan->sla_batas);
        $this->assertEquals('hari_kerja', $laporan->sla_satuan);
        $this->assertNotNull($laporan->sla_riwayat_id);

        // Verifikasi riwayat status T-01 append-only
        $this->assertDatabaseHas('riwayat_status', [
            'laporan_id' => $laporan->id,
            'kode_transisi' => 'T-01',
            'status_lama' => null,
            'status_baru' => 'DITERUSKAN',
            'pelaku_id' => $warga->id,
        ]);

        // Verifikasi lampiran
        $this->assertDatabaseHas('lampiran', [
            'laporan_id' => $laporan->id,
            'tahap' => 'awal',
            'pengguna_id' => $warga->id,
        ]);
    }

    public function test_menolak_laporan_jika_keterangan_kurang_dari_10_karakter(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();

        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'pendek', // < 10 karakter
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 10.0,
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)->postJson('/warga/lapor', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['keterangan']);
    }

    public function test_menolak_laporan_jika_titik_di_luar_wilayah_depok(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::first();

        // Titik Monas Jakarta (-6.175392, 106.827153)
        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Jalan rusak di luar daerah depok.',
            'lintang' => -6.175392,
            'bujur' => 106.827153,
            'lokasi_sumber' => 'manual',
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)->postJson('/warga/lapor', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['lintang']);
    }

    public function test_warga_dapat_mendukung_laporan_serupa_yang_sudah_ada(): void
    {
        $wargaPelapor = User::factory()->warga()->create();
        $wargaPendukung = User::factory()->warga()->create();
        $kategori = Kategori::first();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();

        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $tiket = Laporan::create([
            'nomor_tiket' => 'JAG-2026-DKG001',
            'pelapor_id' => $wargaPelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Amblas',
            'keterangan' => 'Jalan amblas di dekat jembatan',
            'keparahan' => 'sedang',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 10.0,
            'status' => 'PERLU_ROUTING',
            'instansi_id' => null,
        ]);

        $response = $this->actingAs($wargaPendukung)->postJson('/warga/lapor/dukung', [
            'laporan_id' => $tiket->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('dukungan', [
            'laporan_id' => $tiket->id,
            'pengguna_id' => $wargaPendukung->id,
        ]);
        $this->assertEquals(1, Dukungan::where('laporan_id', $tiket->id)->count());
    }
}

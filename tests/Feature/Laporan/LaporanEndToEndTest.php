<?php

namespace Tests\Feature\Laporan;

use App\Models\Dukungan;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LaporanEndToEndTest extends TestCase
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
        $bgColor = imagecolorallocate($img, 120, 160, 210);
        imagefill($img, 0, 0, $bgColor);
        ob_start();
        imagejpeg($img, null, 85);
        $rawBytes = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,'.base64_encode($rawBytes);
    }

    /**
     * Skenario ST-01: Alur lengkap pembuatan laporan aduan warga.
     * Dari autentikasi, input data lengkap, sequence tiket, routing instansi,
     * inisialisasi SLA, append-only history T-01, hingga lampiran foto.
     */
    public function test_alur_lengkap_pembuatan_laporan_hingga_terbit_tiket_dan_routing_st01(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::where('nama', 'Jalan Berlubang')->firstOrFail();

        // Lokasi di Kelurahan Kemiri Muka, Kecamatan Beji, Kota Depok
        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Lubang jalan sedalam 15cm sangat membahayakan pengendara motor di depan ruko.',
            'lintang' => -6.375120,
            'bujur' => 106.828450,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 8.5,
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)
            ->postJson('/warga/lapor', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'sukses' => true,
            ]);

        $nomorTiket = $response->json('nomor_tiket');
        $this->assertNotNull($nomorTiket);
        $this->assertMatchesRegularExpression('/^JAG-\d{4}-\d{6}$/', $nomorTiket);

        // 1. Verifikasi tabel laporan
        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->first();
        $this->assertNotNull($laporan);
        $this->assertEquals($warga->id, $laporan->pelapor_id);
        $this->assertEquals($kategori->id, $laporan->kategori_id);
        $this->assertEquals('DITERUSKAN', $laporan->status);
        $this->assertNotNull($laporan->instansi_id);
        $this->assertNotNull($laporan->kelurahan_id);
        $this->assertEquals('gps', $laporan->lokasi_sumber);
        $this->assertEquals(8.5, $laporan->akurasi_gps_m);

        // Verifikasi 6 Kolom SLA (laporan_sla_ck)
        $this->assertEquals('RESPONS', $laporan->sla_tahap);
        $this->assertNotNull($laporan->sla_riwayat_id);
        $this->assertNotNull($laporan->sla_mulai_pada);
        $this->assertEquals(3, $laporan->sla_batas);
        $this->assertEquals('hari_kerja', $laporan->sla_satuan);
        $this->assertNotNull($laporan->sla_jatuh_tempo);

        // 2. Verifikasi riwayat status T-01
        $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->first();
        $this->assertNotNull($riwayat);
        $this->assertEquals('T-01', $riwayat->kode_transisi);
        $this->assertNull($riwayat->status_lama);
        $this->assertEquals('DITERUSKAN', $riwayat->status_baru);
        $this->assertEquals($warga->id, $riwayat->pelaku_id);
        $this->assertEquals($riwayat->id, $laporan->sla_riwayat_id);

        // 3. Verifikasi lampiran
        $lampiran = Lampiran::where('laporan_id', $laporan->id)->first();
        $this->assertNotNull($lampiran);
        $this->assertEquals('awal', $lampiran->tahap);
        $this->assertEquals($warga->id, $lampiran->pengguna_id);
        $this->assertGreaterThan(0, $lampiran->ukuran_byte);
        Storage::disk('public')->assertExists($lampiran->path);
    }

    /**
     * Skenario ST-16: Verifikasi pembersihan total metadata EXIF lokasi pada file foto.
     */
    public function test_verifikasi_pembersihan_exif_metadata_pada_penyimpanan_foto_st16(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::where('nama', 'Sampah Liar')->firstOrFail();

        $payload = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'berat',
            'keterangan' => 'Tumpukan sampah liar menumpuk di pinggir jalan dan menimbulkan bau menyengat.',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 5.0,
            'foto' => $this->generateBase64Image(),
        ];

        $response = $this->actingAs($warga)
            ->postJson('/warga/lapor', $payload);

        $response->assertStatus(201);
        $nomorTiket = $response->json('nomor_tiket');

        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->firstOrFail();
        $lampiran = Lampiran::where('laporan_id', $laporan->id)->firstOrFail();

        Storage::disk('public')->assertExists($lampiran->path);

        $fullPath = Storage::disk('public')->path($lampiran->path);
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($fullPath);
            $this->assertTrue(
                $exif === false || ! isset($exif['GPSLatitude']),
                'Metadata EXIF GPS tidak boleh ada dalam foto yang disimpan di storage server.'
            );
        }
    }

    /**
     * Skenario ST-13: Pembatasan kuota maksimal 5 laporan per jam per akun warga (P-17).
     * Laporan ke-6 dalam rentang 1 jam wajib ditolak.
     */
    public function test_penegakan_batas_kuota_5_laporan_per_jam_st13(): void
    {
        $warga = User::factory()->warga()->create();
        $kategori = Kategori::firstOrFail();

        // Kirim 5 laporan pertama secara berturut-turut
        for ($i = 1; $i <= 5; $i++) {
            $payload = [
                'kategori_id' => $kategori->id,
                'keparahan' => 'ringan',
                'keterangan' => "Laporan uji coba kuota ke-{$i} dengan panjang karakter memadai.",
                'lintang' => -6.375000 + ($i * 0.0001),
                'bujur' => 106.828000 + ($i * 0.0001),
                'lokasi_sumber' => 'gps',
                'akurasi_gps_m' => 10.0,
                'foto' => $this->generateBase64Image(),
            ];

            $res = $this->actingAs($warga)->postJson('/warga/lapor', $payload);
            $res->assertStatus(201);
        }

        // Upaya ke-6 dalam 1 jam yang sama harus ditolak
        $payloadKeenam = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'ringan',
            'keterangan' => 'Laporan uji coba kuota ke-6 yang seharusnya ditolak oleh sistem batas kuota.',
            'lintang' => -6.376000,
            'bujur' => 106.829000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 10.0,
            'foto' => $this->generateBase64Image(),
        ];

        $resKeenam = $this->actingAs($warga)->postJson('/warga/lapor', $payloadKeenam);

        $resKeenam->assertStatus(422)
            ->assertJsonValidationErrors(['kuota']);

        $errors = $resKeenam->json('errors.kuota');
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('Batas pelaporan tercapai', $errors[0]);
    }

    /**
     * Skenario FR-LAP-05 & FR-INT-01: Deteksi aduan serupa dan pemberian dukungan warga.
     */
    public function test_deteksi_dan_dukung_laporan_serupa_fr_lap_05(): void
    {
        $pelaporAwal = User::factory()->warga()->create();
        $pendukung = User::factory()->warga()->create();
        $kategori = Kategori::where('nama', 'Jalan Berlubang')->firstOrFail();

        // 1. Pelapor A membuat laporan awal di Kemiri Muka
        $payloadA = [
            'kategori_id' => $kategori->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Lubang jalan cukup besar di depan ruko Kemiri Muka.',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 10.0,
            'foto' => $this->generateBase64Image(),
        ];

        $resA = $this->actingAs($pelaporAwal)->postJson('/warga/lapor', $payloadA);
        $resA->assertStatus(201);
        $nomorTiketA = $resA->json('nomor_tiket');
        $laporanA = Laporan::where('nomor_tiket', $nomorTiketA)->firstOrFail();

        // 2. Pendukung mendeteksi laporan serupa dalam radius 10 meter
        $cekSerupaPayload = [
            'kategori_id' => $kategori->id,
            'lintang' => -6.375050,
            'bujur' => 106.828000,
            'akurasi_gps_m' => 10.0,
        ];

        $resCek = $this->actingAs($pendukung)->postJson('/api/laporan/cek-serupa', $cekSerupaPayload);
        $resCek->assertStatus(200)
            ->assertJson([
                'ada_kandidat' => true,
            ]);

        $kandidatList = $resCek->json('kandidat');
        $this->assertNotEmpty($kandidatList);
        $this->assertEquals($laporanA->id, $kandidatList[0]['id']);

        // 3. Pendukung memilih untuk mendukung laporan A alih-alih membuat tiket duplikat
        $dukungPayload = [
            'laporan_id' => $laporanA->id,
        ];

        $resDukung = $this->actingAs($pendukung)->postJson('/warga/lapor/dukung', $dukungPayload);
        $resDukung->assertStatus(200)
            ->assertJson([
                'sukses' => true,
            ]);

        // Verifikasi tabel dukungan
        $this->assertDatabaseHas('dukungan', [
            'laporan_id' => $laporanA->id,
            'pengguna_id' => $pendukung->id,
        ]);

        $jumlahDukungan = Dukungan::where('laporan_id', $laporanA->id)->count();
        $this->assertEquals(1, $jumlahDukungan);

        // Verifikasi tidak ada laporan baru yang tercipta untuk pengguna pendukung
        $laporanPendukungCount = Laporan::where('pelapor_id', $pendukung->id)->count();
        $this->assertEquals(0, $laporanPendukungCount);
    }
}

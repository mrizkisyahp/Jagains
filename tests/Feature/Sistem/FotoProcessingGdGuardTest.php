<?php

namespace Tests\Feature\Sistem;

use App\Models\BeritaAcara;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\VerifikasiWarga;
use App\Models\Wilayah;
use App\Services\FotoLaporanService;
use App\Services\InstansiTiketService;
use App\Services\LaporanService;
use App\Services\VerifikasiWargaService;
use Database\Seeders\AturanRoutingDanSlaSeeder;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FotoProcessingGdGuardTest extends TestCase
{
    use DatabaseTransactions;

    protected User $warga;

    protected User $petugas;

    protected Kategori $kategori;

    protected Instansi $instansi;

    protected Wilayah $kelurahan;

    protected string $fotoBase64;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        FotoLaporanService::setGdCapabilityChecker(null);

        // Pastikan seeder wilayah, instansi, kategori & routing tersedia
        $this->seed(WilayahSeeder::class);
        $this->seed(InstansiSeeder::class);
        $this->seed(KategoriSeeder::class);
        $this->seed(AturanRoutingDanSlaSeeder::class);

        // Buat gambar sintetis valid untuk pengujian
        $img = imagecreatetruecolor(400, 300);
        $bgColor = imagecolorallocate($img, 10, 100, 200);
        imagefill($img, 0, 0, $bgColor);
        ob_start();
        imagejpeg($img, null, 85);
        $rawBytes = ob_get_clean();
        imagedestroy($img);
        $this->fotoBase64 = 'data:image/jpeg;base64,'.base64_encode($rawBytes);

        $this->kategori = Kategori::where('nama', 'Jalan Berlubang')->firstOrFail();
        $this->instansi = Instansi::where('singkatan', 'DPUPR')->firstOrFail();
        $this->kelurahan = Wilayah::where('tingkat', 'kelurahan')->firstOrFail();

        $this->warga = User::factory()->warga()->create([
            'kelurahan_id' => $this->kelurahan->id,
        ]);

        $this->petugas = User::factory()->instansi()->create([
            'instansi_id' => $this->instansi->id,
        ]);
    }

    protected function tearDown(): void
    {
        FotoLaporanService::setGdCapabilityChecker(null);
        parent::tearDown();
    }

    /**
     * Skenario 1: Ketika GD tidak tersedia saat pengajuan laporan baru oleh warga,
     * sistem menolak dengan ValidationException pada field 'foto', pesan ramah pengguna,
     * dan sama sekali TIDAK menyimpan data laporan palsu/parsial ke database.
     */
    public function test_pembuatan_laporan_gagal_terkendali_dan_tidak_menyimpan_data_saat_gd_absen(): void
    {
        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        $service = app(LaporanService::class);
        $laporanCountAwal = Laporan::count();

        $gagal = false;
        try {
            $service->buatLaporan($this->warga, [
                'kategori_id' => $this->kategori->id,
                'kelurahan_id' => $this->kelurahan->id,
                'keparahan' => 'sedang',
                'keterangan' => 'Jalan berlubang cukup parah di depan ruko, membahayakan motor.',
                'foto' => $this->fotoBase64,
                'lintang' => -6.375000,
                'bujur' => 106.828000,
                'lokasi_sumber' => 'gps',
                'akurasi_gps_m' => 8.5,
            ]);
        } catch (ValidationException $e) {
            $gagal = true;
            $this->assertArrayHasKey('foto', $e->errors());
            $pesan = $e->errors()['foto'][0];
            $this->assertSame(
                'Layanan pemrosesan foto saat ini tidak tersedia pada server. Silakan hubungi administrator.',
                $pesan
            );
            $this->assertStringNotContainsString('imagecreatefromstring', $pesan);
            $this->assertStringNotContainsString('Call to undefined function', $pesan);
        }

        $this->assertTrue($gagal, 'LaporanService wajib melempar ValidationException saat GD tidak tersedia.');
        $this->assertSame($laporanCountAwal, Laporan::count(), 'Tidak boleh ada record laporan yang tersimpan saat proses foto gagal.');
    }

    /**
     * Skenario 2: Ketika GD tidak tersedia saat dinas mengajukan selesai fisik (FR-TIK-08),
     * sistem menolak dengan ValidationException dan status tiket TETAP 'DIKERJAKAN'
     * (tidak bertransisi ke MENUNGGU_VERIFIKASI).
     */
    public function test_penyelesaian_fisik_instansi_gagal_terkendali_dan_status_tidak_berubah_saat_gd_absen(): void
    {
        // Buat tiket berstatus DIKERJAKAN
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-CMP'.rand(10000, 99999),
            'judul' => 'Perbaikan Jalan di Kemiri Muka',
            'keterangan' => 'Pekerjaan perbaikan jalan sedang berlangsung.',
            'kategori_id' => $this->kategori->id,
            'kelurahan_id' => $this->kelurahan->id,
            'instansi_id' => $this->instansi->id,
            'pelapor_id' => $this->warga->id,
            'status' => 'DIKERJAKAN',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'gps',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'akurasi_gps_m' => 5.0,
            'ronde_sengketa' => 0,
            'jumlah_pengalihan' => 0,
        ]);

        BeritaAcara::create([
            'laporan_id' => $laporan->id,
            'instansi_id' => $this->instansi->id,
            'penulis_id' => $this->petugas->id,
            'versi' => 1,
            'kegiatan' => 'Penambalan aspal lubang jalan',
            'hasil' => 'Permukaan jalan sudah rata dengan aspal hotmix',
            'created_at' => now(),
        ]);
        DB::statement('RESET jagains.izin_status');

        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        $service = app(InstansiTiketService::class);
        $gagal = false;

        try {
            $service->ajukanSelesai(
                $laporan,
                $this->fotoBase64,
                -6.375000,
                106.828000,
                5.0,
                $this->petugas,
                'Pekerjaan fisik telah selesai dikerjakan.'
            );
        } catch (ValidationException $e) {
            $gagal = true;
            $this->assertArrayHasKey('foto', $e->errors());
            $pesan = $e->errors()['foto'][0];
            $this->assertSame(
                'Layanan pemrosesan foto saat ini tidak tersedia pada server. Silakan hubungi administrator.',
                $pesan
            );
        }

        $this->assertTrue($gagal, 'InstansiTiketService wajib melempar ValidationException saat GD tidak tersedia.');
        $this->assertSame('DIKERJAKAN', $laporan->fresh()->status, 'Status tiket harus tetap DIKERJAKAN dan tidak boleh berubah.');
    }

    /**
     * Skenario 3: Ketika GD tidak tersedia saat verifikasi warga Jalur A di lokasi (FR-VER-02),
     * sistem menolak dengan ValidationException dan suara verifikasi TIDAK tersimpan.
     */
    public function test_verifikasi_warga_jalur_a_gagal_terkendali_dan_suara_tidak_tersimpan_saat_gd_absen(): void
    {
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-VRF'.rand(10000, 99999),
            'judul' => 'Verifikasi Lapangan Aspal',
            'keterangan' => 'Menunggu konfirmasi warga sekitar.',
            'kategori_id' => $this->kategori->id,
            'kelurahan_id' => $this->kelurahan->id,
            'instansi_id' => $this->instansi->id,
            'pelapor_id' => $this->warga->id,
            'status' => 'MENUNGGU_VERIFIKASI',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'gps',
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'akurasi_gps_m' => 5.0,
            'ronde_sengketa' => 0,
            'jumlah_pengalihan' => 0,
        ]);

        $lampiranSesudah = Lampiran::create([
            'uuid' => (string) Str::uuid(),
            'laporan_id' => $laporan->id,
            'pengguna_id' => $this->petugas->id,
            'tahap' => 'sesudah',
            'path' => 'lampiran/dummy-sesudah.jpg',
            'ukuran_byte' => 1024,
            'lebar' => 800,
            'tinggi' => 600,
            'gps_cocok' => true,
            'jarak_m' => 5.0,
            'akurasi_m' => 5.0,
        ]);

        RondeVerifikasi::create([
            'laporan_id' => $laporan->id,
            'nomor' => 1,
            'k' => 5.0,
            'k_param' => ['k' => 5],
            'lampiran_sesudah_id' => $lampiranSesudah->id,
            'mulai' => now(),
            'batas_waktu' => now()->addDays(14),
        ]);
        DB::statement('RESET jagains.izin_status');

        FotoLaporanService::setGdCapabilityChecker(fn () => false);

        $service = app(VerifikasiWargaService::class);
        $suaraAwal = VerifikasiWarga::count();
        $gagal = false;

        try {
            $service->kirimSuara($this->warga, $laporan, [
                'setuju' => true,
                'jalur' => 'A',
                'latitude' => -6.375000,
                'longitude' => 106.828000,
                'akurasi_m' => 5.0,
                'foto_base64' => $this->fotoBase64,
            ]);
        } catch (ValidationException $e) {
            $gagal = true;
            $this->assertArrayHasKey('foto', $e->errors());
            $pesan = $e->errors()['foto'][0];
            $this->assertSame(
                'Layanan pemrosesan foto saat ini tidak tersedia pada server. Silakan hubungi administrator.',
                $pesan
            );
        }

        $this->assertTrue($gagal, 'VerifikasiWargaService wajib melempar ValidationException saat GD tidak tersedia.');
        $this->assertSame($suaraAwal, VerifikasiWarga::count(), 'Tidak boleh ada suara verifikasi tersimpan saat proses foto gagal.');
    }

    /**
     * Skenario 4: Ketika GD tersedia secara normal, pembuatan laporan aduan berhasil penuh.
     */
    public function test_pembuatan_laporan_berhasil_saat_gd_tersedia(): void
    {
        FotoLaporanService::setGdCapabilityChecker(null);

        $service = app(LaporanService::class);
        $laporan = $service->buatLaporan($this->warga, [
            'kategori_id' => $this->kategori->id,
            'kelurahan_id' => $this->kelurahan->id,
            'keparahan' => 'sedang',
            'keterangan' => 'Jalan berlubang cukup parah di depan ruko, membahayakan motor.',
            'foto' => $this->fotoBase64,
            'lintang' => -6.375000,
            'bujur' => 106.828000,
            'lokasi_sumber' => 'gps',
            'akurasi_gps_m' => 8.5,
        ]);

        $this->assertNotNull($laporan->id);
        $this->assertDatabaseHas('laporan', ['id' => $laporan->id]);
        $this->assertDatabaseHas('lampiran', ['laporan_id' => $laporan->id, 'tahap' => 'awal']);
    }
}

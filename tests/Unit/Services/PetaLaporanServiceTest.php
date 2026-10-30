<?php

namespace Tests\Unit\Services;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\PetaLaporanService;
use Carbon\Carbon;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PetaLaporanServiceTest extends TestCase
{
    use DatabaseTransactions;

    private PetaLaporanService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PetaLaporanService;
    }

    public function test_evaluasi_kondisi_sla_selesai(): void
    {
        $laporan = new Laporan([
            'status' => 'TERTUTUP_WARGA',
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan);

        $this->assertEquals('selesai', $evaluasi['kondisi']);
        $this->assertEquals('Selesai', $evaluasi['label']);
        $this->assertEquals('#64748b', $evaluasi['warna']);
        $this->assertEquals('CheckCheck', $evaluasi['ikon']);
    }

    public function test_evaluasi_kondisi_sla_menunggu_verifikasi_warga(): void
    {
        $laporan = new Laporan([
            'status' => 'MENUNGGU_VERIFIKASI',
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan);

        $this->assertEquals('menunggu_warga', $evaluasi['kondisi']);
        $this->assertEquals('Menunggu Verifikasi Warga', $evaluasi['label']);
        $this->assertEquals('#3b82f6', $evaluasi['warna']);
        $this->assertEquals('Users', $evaluasi['ikon']);
    }

    public function test_evaluasi_kondisi_sla_lewat_jatuh_tempo(): void
    {
        $sekarang = Carbon::parse('2026-10-30 10:00:00');
        $laporan = new Laporan([
            'status' => 'DIKERJAKAN',
            'sla_tahap' => 'PELAKSANAAN',
            'sla_batas' => 5,
            'sla_satuan' => 'hari_kerja',
            'sla_mulai_pada' => Carbon::parse('2026-10-20 08:00:00'),
            'sla_jatuh_tempo' => Carbon::parse('2026-10-27'), // Sudah lewat
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan, $sekarang);

        $this->assertEquals('lewat_sla', $evaluasi['kondisi']);
        $this->assertEquals('Lewat Batas SLA', $evaluasi['label']);
        $this->assertEquals('#ef4444', $evaluasi['warna']);
        $this->assertEquals('AlertTriangle', $evaluasi['ikon']);
        $this->assertStringContainsString('Terlambat', $evaluasi['sisa_teks']);
    }

    public function test_evaluasi_kondisi_sla_hampir_lewat(): void
    {
        // 5 hari batas, sisa 2 hari kerja (2/5 = 40% <= 50%)
        $sekarang = Carbon::parse('2026-10-28 09:00:00'); // Rabu
        $jatuhTempo = Carbon::parse('2026-10-30'); // Jumat (sisa 2 hari kerja)
        $laporan = new Laporan([
            'status' => 'DIKERJAKAN',
            'sla_tahap' => 'PELAKSANAAN',
            'sla_batas' => 5,
            'sla_satuan' => 'hari_kerja',
            'sla_mulai_pada' => Carbon::parse('2026-10-23 08:00:00'),
            'sla_jatuh_tempo' => $jatuhTempo,
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan, $sekarang);

        $this->assertEquals('hampir_lewat', $evaluasi['kondisi']);
        $this->assertEquals('Hampir Lewat', $evaluasi['label']);
        $this->assertEquals('#f59e0b', $evaluasi['warna']);
        $this->assertEquals('Hourglass', $evaluasi['ikon']);
    }

    public function test_evaluasi_kondisi_sla_dalam_sla_aman(): void
    {
        // 5 hari batas, sisa 4 hari kerja (4/5 = 80% > 50%)
        $sekarang = Carbon::parse('2026-10-26 09:00:00'); // Senin
        $jatuhTempo = Carbon::parse('2026-10-30'); // Jumat (sisa 4 hari kerja)
        $laporan = new Laporan([
            'status' => 'DITERUSKAN',
            'sla_tahap' => 'RESPONS',
            'sla_batas' => 5,
            'sla_satuan' => 'hari_kerja',
            'sla_mulai_pada' => Carbon::parse('2026-10-26 08:00:00'),
            'sla_jatuh_tempo' => $jatuhTempo,
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan, $sekarang);

        $this->assertEquals('dalam_sla', $evaluasi['kondisi']);
        $this->assertEquals('Dalam SLA', $evaluasi['label']);
        $this->assertEquals('#10b981', $evaluasi['warna']);
        $this->assertEquals('ShieldCheck', $evaluasi['ikon']);
    }

    public function test_evaluasi_tiket_perlu_routing_tanpa_sla(): void
    {
        $laporan = new Laporan([
            'status' => 'PERLU_ROUTING',
            'instansi_id' => null,
            'sla_tahap' => null,
        ]);

        $evaluasi = $this->service->tentukanKondisiSla($laporan);

        $this->assertEquals('dalam_sla', $evaluasi['kondisi']);
        $this->assertEquals('Menunggu Disposisi', $evaluasi['label']);
        $this->assertEquals('#10b981', $evaluasi['warna']);
    }

    public function test_ambil_data_titik_mengecualikan_tiket_disembunyikan_dan_menjaga_privasi(): void
    {
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
        if (Kategori::count() === 0) {
            $this->seed(KategoriSeeder::class);
        }

        $warga = User::factory()->warga()->create();
        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        $kategori = Kategori::first();

        // Aktifkan izin status untuk trigger PostgreSQL (DD-02, BR-STS-01)
        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        // 1. Tiket publik normal
        $laporanPublik = Laporan::create([
            'nomor_tiket' => 'JAG-TEST-0001',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Jalan Rusak Margonda',
            'keterangan' => 'Lubang 20cm',
            'keparahan' => 'sedang',
            'lintang' => -6.3728,
            'bujur' => 106.8315,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => false,
        ]);

        // 2. Tiket yang disembunyikan oleh moderasi Admin
        $laporanTersembunyi = Laporan::create([
            'nomor_tiket' => 'JAG-TEST-HIDDEN',
            'pelapor_id' => $warga->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => null,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Konten Melanggar Disembunyikan',
            'keterangan' => 'Teks mengandung SARA',
            'keparahan' => 'ringan',
            'lintang' => -6.3729,
            'bujur' => 106.8316,
            'lokasi_sumber' => 'manual',
            'status' => 'PERLU_ROUTING',
            'disembunyikan' => true,
        ]);

        $titikList = $this->service->ambilDataTitik();

        $nomorList = array_column($titikList, 'nomor_tiket');
        $this->assertContains('JAG-TEST-0001', $nomorList);
        $this->assertNotContains('JAG-TEST-HIDDEN', $nomorList);

        // Pastikan TIDAK ADA atribut pelapor_id atau pelapor dalam data titik (Zero-Knowledge)
        foreach ($titikList as $titik) {
            $this->assertArrayNotHasKey('pelapor_id', $titik);
            $this->assertArrayNotHasKey('pelapor', $titik);
            $this->assertArrayNotHasKey('email', $titik);
        }
    }
}

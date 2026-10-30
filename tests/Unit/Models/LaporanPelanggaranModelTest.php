<?php

namespace Tests\Unit\Models;

use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\LaporanPelanggaran;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\KategoriSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LaporanPelanggaranModelTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->seed([WilayahSeeder::class, KategoriSeeder::class]);
    }

    public function test_relasi_dan_default_laporan_pelanggaran(): void
    {
        $pelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);
        $kelurahan = Wilayah::whereNotNull('induk_id')->first();
        $kategori = Kategori::first();

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-TEST-PLG',
            'pelapor_id' => $pelapor->id,
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Uji Coba Laporan Pelanggaran',
            'keterangan' => 'Deskripsi fasilitas publik yang dilaporkan',
            'keparahan' => 'sedang',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'akurasi_gps_m' => 5.0,
            'lokasi_sumber' => 'gps',
            'status' => 'PERLU_ROUTING',
        ]);

        $wargaPelapor = User::factory()->create(['peran' => 'warga', 'status_akun' => 'aktif']);

        $pelanggaran = LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $wargaPelapor->id,
            'alasan' => 'sara_ujaran_kebencian',
            'catatan' => 'Mengandung ujaran kebencian di foto',
        ]);

        $this->assertDatabaseHas('laporan_pelanggaran', [
            'id' => $pelanggaran->id,
            'alasan' => 'sara_ujaran_kebencian',
            'status' => 'menunggu',
        ]);

        $this->assertEquals($laporan->id, $pelanggaran->laporan->id);
        $this->assertEquals($wargaPelapor->id, $pelanggaran->pelapor->id);
        $this->assertTrue($laporan->pelanggaran->contains($pelanggaran));
    }
}

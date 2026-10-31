<?php

use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    DB::statement("SET jagains.izin_status = 'on'");

    $this->kota = Wilayah::create([
        'kode' => '32.76',
        'nama' => 'Kota Depok',
        'tingkat' => 'kota',
    ]);

    $this->kecamatan = Wilayah::create([
        'kode' => '32.76.01',
        'nama' => 'Pancoran Mas',
        'tingkat' => 'kecamatan',
        'induk_id' => $this->kota->id,
    ]);

    $this->kelurahan = Wilayah::create([
        'kode' => '32.76.01.1001',
        'nama' => 'Depok',
        'tingkat' => 'kelurahan',
        'induk_id' => $this->kecamatan->id,
    ]);

    $this->instansi = Instansi::create([
        'nama' => 'Dinas PUPR Depok',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Jalan Berlubang',
        'radius_gabung_m' => 25,
        'aktif' => true,
    ]);

    $this->auditor = User::create([
        'username' => 'auditor_feat',
        'password' => bcrypt('password123'),
        'peran' => 'auditor',
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    $this->admin = User::create([
        'username' => 'admin_feat',
        'password' => bcrypt('password123'),
        'peran' => 'admin',
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    $this->warga = User::create([
        'username' => 'warga_feat',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga_feat@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);
});

function buatEskalasiFeatureFixture($test): array
{
    $laporan = Laporan::create([
        'nomor_tiket' => 'JAG-2026-F'.rand(10000, 99999),
        'judul' => 'Jembatan Penyeberangan Rusak',
        'keterangan' => 'Bantalan jembatan retak dan berisiko ambruk.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $test->warga->id,
        'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
        'keparahan' => 'berat',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => 1,
        'jumlah_pengalihan' => 0,
        'created_at' => now(),
    ]);

    $petugas = User::create([
        'username' => 'petugas_'.uniqid(),
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $test->instansi->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    $lampiranSesudah = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $laporan->id,
        'pengguna_id' => $petugas->id,
        'tahap' => 'sesudah',
        'path' => 'lampiran/2026/10/sesudah.jpg',
        'ukuran_byte' => 2048,
        'lebar' => 1280,
        'tinggi' => 720,
        'gps_cocok' => true,
        'jarak_m' => 5.0,
        'akurasi_m' => 10.0,
        'created_at' => now(),
    ]);

    $ronde = RondeVerifikasi::create([
        'laporan_id' => $laporan->id,
        'nomor' => 1,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah->id,
        'mulai' => now()->subDays(15),
        'batas_waktu' => now()->subDay(),
        'hasil' => 'kedaluwarsa',
        'selesai_pada' => now()->subDay(),
        'created_at' => now()->subDays(15),
    ]);

    $eskalasi = Eskalasi::create([
        'laporan_id' => $laporan->id,
        'pemicu' => 'TANPA_KUORUM',
        'ronde_id' => $ronde->id,
        'created_at' => now(),
    ]);

    return [$laporan, $ronde, $eskalasi];
}

test('auditor dapat mengakses antrean eskalasi (FR-AUD-01)', function () {
    [$laporan, , $eskalasi] = buatEskalasiFeatureFixture($this);

    $response = $this->actingAs($this->auditor)
        ->get(route('auditor.antrean'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('auditor/antrean')
        ->has('antrean.data', 1)
        ->where('antrean.data.0.id', $eskalasi->id)
        ->has('ringkasan')
        ->has('kategoriList')
        ->has('instansiList')
    );
});

test('tamu tidak dapat mengakses antrean eskalasi dan diarahkan ke login', function () {
    $response = $this->get(route('auditor.antrean'));
    $response->assertRedirect(route('login'));
});

test('peran non-auditor (warga dan admin) dilarang mengakses antrean eskalasi (403)', function () {
    $this->actingAs($this->warga)
        ->get(route('auditor.antrean'))
        ->assertStatus(403);

    $this->actingAs($this->admin)
        ->get(route('auditor.antrean'))
        ->assertStatus(403);
});

test('auditor dapat mengambil detail berkas eskalasi via JSON (FR-AUD-01)', function () {
    [$laporan, , $eskalasi] = buatEskalasiFeatureFixture($this);

    $response = $this->actingAs($this->auditor)
        ->getJson(route('auditor.antrean.show', $eskalasi->id));

    $response->assertStatus(200);
    $response->assertJson([
        'eskalasi' => [
            'id' => $eskalasi->id,
            'pemicu' => 'TANPA_KUORUM',
        ],
        'laporan' => [
            'nomor_tiket' => $laporan->nomor_tiket,
        ],
    ]);
});

test('auditor dapat mengirim keputusan PERBAIKAN_SAH via endpoint HTTP (FR-AUD-02)', function () {
    [$laporan, , $eskalasi] = buatEskalasiFeatureFixture($this);

    $response = $this->actingAs($this->auditor)
        ->from(route('auditor.antrean'))
        ->post(route('auditor.antrean.putuskan', $eskalasi->id), [
            'jenis' => 'PERBAIKAN_SAH',
            'alasan' => 'Pekerjaan perbaikan fisik jembatan telah memenuhi standar kelayakan teknis dinas.',
        ]);

    $response->assertRedirect(route('auditor.antrean'));
    $response->assertSessionHas('sukses');

    expect($laporan->fresh()->status)->toBe('TERTUTUP_AUDITOR');
    expect($eskalasi->fresh()->selesai_pada)->not->toBeNull();
});

test('admin dilarang mengirimkan keputusan eskalasi (403, BR-AUD-03)', function () {
    [, , $eskalasi] = buatEskalasiFeatureFixture($this);

    $response = $this->actingAs($this->admin)
        ->postJson(route('auditor.antrean.putuskan', $eskalasi->id), [
            'jenis' => 'PERBAIKAN_SAH',
            'alasan' => 'Admin mencoba mengambil keputusan perbaikan sah.',
        ]);

    $response->assertStatus(403);
});

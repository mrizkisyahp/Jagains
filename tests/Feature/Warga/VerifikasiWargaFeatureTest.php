<?php

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\VerifikasiWarga;
use App\Models\Wilayah;
use App\Services\FotoLaporanService;
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

    $this->kelurahanLain = Wilayah::create([
        'kode' => '32.76.01.1002',
        'nama' => 'Mampang',
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
        'nama' => 'Jalan Rusak & Berlubang',
        'radius_gabung_m' => 25,
        'aktif' => true,
    ]);

    $this->warga = User::create([
        'username' => 'warga_depok_1',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga_depok_1@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->wargaLain = User::create([
        'username' => 'warga_mampang_1',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga_mampang_1@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahanLain->id,
        'status_akun' => 'aktif',
    ]);

    $this->fotoServiceMock = Mockery::mock(FotoLaporanService::class);
    $this->fotoServiceMock->shouldReceive('prosesFotoKamera')
        ->byDefault()
        ->andReturn([
            'uuid' => (string) Str::uuid(),
            'path' => 'lampiran/2026/10/verif-feature.jpg',
            'ukuran_byte' => 1024,
            'lebar' => 800,
            'tinggi' => 600,
        ]);
    $this->app->instance(FotoLaporanService::class, $this->fotoServiceMock);
});

function buatLaporanVerifikasiFeature($test): array
{
    $pelapor = User::create([
        'username' => 'pelapor_'.uniqid(),
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', uniqid().'@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $test->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $laporan = Laporan::create([
        'nomor_tiket' => 'JAG-2026-F'.rand(10000, 99999),
        'judul' => 'Perbaikan Saluran Air RW 04',
        'keterangan' => 'Saluran air tersumbat dan meluap ke badan jalan.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $pelapor->id,
        'status' => 'MENUNGGU_VERIFIKASI',
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => 0,
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
        'path' => 'lampiran/2026/10/sesudah_feat.jpg',
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
        'mulai' => now(),
        'batas_waktu' => now()->addDays(14),
        'created_at' => now(),
    ]);

    return [$laporan, $ronde];
}

test('warga dapat melihat daftar antrean tiket verifikasi kelurahannya (FR-VER-01)', function () {
    [$laporan] = buatLaporanVerifikasiFeature($this);

    $response = $this->actingAs($this->warga)
        ->get(route('warga.verifikasi'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('warga/verifikasi')
        ->has('daftarTiket.data', 1)
        ->where('daftarTiket.data.0.nomor_tiket', $laporan->nomor_tiket)
        ->has('kategoriList')
        ->where('kelurahan.nama', 'Depok')
    );
});

test('tamu tidak dapat mengakses antrean verifikasi dan diarahkan ke login', function () {
    $response = $this->get(route('warga.verifikasi'));
    $response->assertRedirect(route('login'));
});

test('warga kelurahan lain dapat melihat detail verifikasi namun tidak memiliki hak suara (FR-VER-07)', function () {
    [$laporan] = buatLaporanVerifikasiFeature($this);

    // wargaLain dari kelurahan Mampang melihat tiket verifikasi Depok
    $response = $this->actingAs($this->wargaLain)
        ->getJson(route('warga.verifikasi.show', $laporan->nomor_tiket));

    $response->assertStatus(200);
    $response->assertJson([
        'bisa_memberi_suara' => false,
    ]);
});

test('warga kelurahan lain dilarang memberikan suara verifikasi pada tiket kelurahan berbeda (403)', function () {
    [$laporan] = buatLaporanVerifikasiFeature($this);

    // wargaLain dari kelurahan Mampang mencoba kirim suara untuk tiket Depok
    $response = $this->actingAs($this->wargaLain)
        ->post(route('warga.verifikasi.store', $laporan->nomor_tiket), [
            'setuju' => true,
            'jalur' => 'B',
        ]);

    $response->assertStatus(403);
});

test('warga dapat memberikan suara Jalur B lewat endpoint HTTP (FR-VER-02)', function () {
    [$laporan, $ronde] = buatLaporanVerifikasiFeature($this);

    $response = $this->actingAs($this->warga)
        ->from(route('warga.verifikasi'))
        ->post(route('warga.verifikasi.store', $laporan->nomor_tiket), [
            'setuju' => true,
            'jalur' => 'B',
        ]);

    $response->assertRedirect(route('warga.verifikasi'));
    $response->assertSessionHas('sukses');

    expect(VerifikasiWarga::where('ronde_id', $ronde->id)->where('pengguna_id', $this->warga->id)->exists())->toBeTrue();
});

test('warga dapat memberikan suara Jalur A dengan foto dan koordinat GPS (FR-VER-02)', function () {
    [$laporan, $ronde] = buatLaporanVerifikasiFeature($this);

    $response = $this->actingAs($this->warga)
        ->from(route('warga.verifikasi'))
        ->post(route('warga.verifikasi.store', $laporan->nomor_tiket), [
            'setuju' => true,
            'jalur' => 'A',
            'foto_base64' => 'data:image/jpeg;base64,'.base64_encode('gambar-verifikasi-uji'),
            'latitude' => -6.402480,
            'longitude' => 106.794240,
            'akurasi_m' => 8.0,
        ]);

    $response->assertRedirect(route('warga.verifikasi'));
    $response->assertSessionHas('sukses');

    $suara = VerifikasiWarga::where('ronde_id', $ronde->id)->where('pengguna_id', $this->warga->id)->first();
    expect($suara)->not->toBeNull();
    expect($suara->jalur)->toBe('A');
    expect($suara->bobot)->toEqual(1.0);
});

test('suara tolak tanpa alasan minimal 10 karakter menghasilkan error validasi 422', function () {
    [$laporan] = buatLaporanVerifikasiFeature($this);

    $response = $this->actingAs($this->warga)
        ->postJson(route('warga.verifikasi.store', $laporan->nomor_tiket), [
            'setuju' => false,
            'jalur' => 'B',
            'alasan' => 'Kurang', // < 10 chars
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['alasan']);
});

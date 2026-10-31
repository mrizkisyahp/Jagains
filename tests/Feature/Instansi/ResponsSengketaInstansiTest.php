<?php

use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\Sengketa;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    $this->instansiLain = Instansi::create([
        'nama' => 'Dinas Perhubungan Depok',
        'singkatan' => 'DISHUB',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Jalan Rusak & Berlubang',
        'radius_gabung_m' => 25,
        'aktif' => true,
    ]);

    $this->pelapor = User::create([
        'username' => 'pelapor_sengketa',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'pelapor_sengketa@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->petugas = User::create([
        'username' => 'petugas_pupr',
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    $this->petugasDishub = User::create([
        'username' => 'petugas_dishub',
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $this->instansiLain->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);
});

function buatLaporanSengketaFixture($test, int $rondeSengketa = 1): array
{
    $laporan = Laporan::create([
        'nomor_tiket' => 'JAG-2026-SNG'.rand(1000, 9999),
        'judul' => 'Pengaspalan Tidak Rata di Jalan Margonda',
        'keterangan' => 'Pengaspalan jalan tidak rata dan air tergenang saat hujan.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $test->pelapor->id,
        'status' => 'DISENGKETAKAN',
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => $rondeSengketa,
        'jumlah_pengalihan' => 0,
        'created_at' => now(),
    ]);

    $lampiranSesudah = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $laporan->id,
        'pengguna_id' => $test->petugas->id,
        'tahap' => 'sesudah',
        'path' => 'lampiran/2026/10/sengketa_sesudah.jpg',
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
        'nomor' => $rondeSengketa,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah->id,
        'mulai' => now()->subDays(5),
        'batas_waktu' => now()->addDays(9),
        'hasil' => 'tolak',
        'selesai_pada' => now()->subDay(),
        'created_at' => now()->subDays(5),
    ]);

    $sengketa = Sengketa::create([
        'ronde_id' => $ronde->id,
        'tenggat' => now()->addDays(7)->toDateString(),
        'created_at' => now()->subDay(),
    ]);

    return [$laporan, $ronde, $sengketa];
}

test('instansi dapat memilih kerjakan_ulang pada tiket sengketa (T-17, FR-VER-06)', function () {
    [$laporan, $ronde, $sengketa] = buatLaporanSengketaFixture($this, rondeSengketa: 1);

    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.respons-sengketa', $laporan->id), [
            'pilihan' => 'kerjakan_ulang',
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'sukses' => true,
        'status' => 'DIKERJAKAN',
    ]);

    expect($laporan->fresh()->status)->toBe('DIKERJAKAN');
    expect($sengketa->fresh()->jawaban)->toBe('kerjakan_ulang');
    expect($sengketa->fresh()->waktu_jawab)->not->toBeNull();

    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-17')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_lama)->toBe('DISENGKETAKAN');
    expect($riwayat->status_baru)->toBe('DIKERJAKAN');
});

test('instansi dapat memilih sanggah dengan alasan valid yang meneruskan ke Auditor (T-18, FR-VER-06)', function () {
    [$laporan, $ronde, $sengketa] = buatLaporanSengketaFixture($this, rondeSengketa: 1);

    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.respons-sengketa', $laporan->id), [
            'pilihan' => 'sanggah',
            'alasan_sanggah' => 'Pekerjaan pengaspalan telah lolos uji ketebalan core drill sesuai spesifikasi teknis.',
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'sukses' => true,
        'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
    ]);

    expect($laporan->fresh()->status)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
    expect($sengketa->fresh()->jawaban)->toBe('sanggah');
    expect($sengketa->fresh()->alasan_sanggah)->toContain('spesifikasi teknis');

    // Eskalasi SANGGAHAN terbentuk
    $eskalasi = Eskalasi::where('laporan_id', $laporan->id)->where('ronde_id', $ronde->id)->first();
    expect($eskalasi)->not->toBeNull();
    expect($eskalasi->pemicu)->toBe('SANGGAHAN');

    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-18')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_baru)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
});

test('sanggah tanpa alasan atau alasan kurang dari 10 karakter ditolak validasi 422', function () {
    [$laporan] = buatLaporanSengketaFixture($this);

    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.respons-sengketa', $laporan->id), [
            'pilihan' => 'sanggah',
            'alasan_sanggah' => 'tolak', // < 10 chars
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['alasan_sanggah']);
});

test('petugas dari instansi lain dilarang merespons tiket sengketa instansi berbeda (403)', function () {
    [$laporan] = buatLaporanSengketaFixture($this);

    $response = $this->actingAs($this->petugasDishub)
        ->postJson(route('instansi.tiket.respons-sengketa', $laporan->id), [
            'pilihan' => 'kerjakan_ulang',
        ]);

    $response->assertStatus(403);
});

test('penolakan sengketa ke-4 langsung dialihkan ke Auditor dengan pemicu RONDE (BR-VER-05)', function () {
    // Sengketa ke-4 (ronde_sengketa = 3 sebelumnya dan kuorum tolak lagi)
    [$laporan, $ronde, $sengketa] = buatLaporanSengketaFixture($this, rondeSengketa: 4);

    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.respons-sengketa', $laporan->id), [
            'pilihan' => 'kerjakan_ulang',
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
    ]);

    expect($laporan->fresh()->status)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');

    $eskalasi = Eskalasi::where('laporan_id', $laporan->id)->where('ronde_id', $ronde->id)->first();
    expect($eskalasi)->not->toBeNull();
    expect($eskalasi->pemicu)->toBe('RONDE');
});

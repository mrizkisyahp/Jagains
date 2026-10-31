<?php

use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
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

    $this->kategori = Kategori::create([
        'nama' => 'Jalan Rusak & Berlubang',
        'radius_gabung_m' => 25,
        'aktif' => true,
    ]);

    $this->pelapor = User::create([
        'username' => 'pelapor_cmd',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'pelapor_cmd@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->petugas = User::create([
        'username' => 'petugas_cmd',
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);
});

function buatLaporanDanRondeBatasWaktu($test, bool $sudahKedaluwarsa = false): array
{
    $laporan = Laporan::create([
        'nomor_tiket' => 'JAG-2026-CMD'.rand(1000, 9999),
        'judul' => 'Perbaikan Gorong-gorong Jalan Kartini',
        'keterangan' => 'Gorong-gorong rusak dan air meluap.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $test->pelapor->id,
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

    $lampiranSesudah = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $laporan->id,
        'pengguna_id' => $test->petugas->id,
        'tahap' => 'sesudah',
        'path' => 'lampiran/2026/10/cmd_sesudah.jpg',
        'ukuran_byte' => 2048,
        'lebar' => 1280,
        'tinggi' => 720,
        'gps_cocok' => true,
        'jarak_m' => 5.0,
        'akurasi_m' => 10.0,
        'created_at' => now(),
    ]);

    $mulai = $sudahKedaluwarsa ? now()->subDays(15) : now();
    $batasWaktu = $sudahKedaluwarsa ? now()->subDay() : now()->addDays(14);

    $ronde = RondeVerifikasi::create([
        'laporan_id' => $laporan->id,
        'nomor' => 1,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah->id,
        'mulai' => $mulai,
        'batas_waktu' => $batasWaktu,
        'created_at' => $mulai,
    ]);

    return [$laporan, $ronde];
}

test('command jagains:cek-kuorum-verifikasi memutasi tiket kedaluwarsa 14 hari ke MENUNGGU_KEPUTUSAN_AUDITOR (ST-05, FR-VER-05)', function () {
    [$laporanExpired, $rondeExpired] = buatLaporanDanRondeBatasWaktu($this, sudahKedaluwarsa: true);
    [$laporanActive, $rondeActive] = buatLaporanDanRondeBatasWaktu($this, sudahKedaluwarsa: false);

    $this->artisan('jagains:cek-kuorum-verifikasi')
        ->expectsOutputToContain('Sebanyak 1 tiket dialihkan')
        ->assertExitCode(0);

    // Tiket yang kedaluwarsa harus bermutasi
    expect($laporanExpired->fresh()->status)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
    expect($rondeExpired->fresh()->hasil)->toBe('kedaluwarsa');
    expect($rondeExpired->fresh()->selesai_pada)->not->toBeNull();

    // Eskalasi TANPA_KUORUM harus dibuat
    $eskalasi = Eskalasi::where('laporan_id', $laporanExpired->id)->where('ronde_id', $rondeExpired->id)->first();
    expect($eskalasi)->not->toBeNull();
    expect($eskalasi->pemicu)->toBe('TANPA_KUORUM');

    // Riwayat T-16 harus tercatat
    $riwayat = RiwayatStatus::where('laporan_id', $laporanExpired->id)->where('kode_transisi', 'T-16')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_lama)->toBe('MENUNGGU_VERIFIKASI');
    expect($riwayat->status_baru)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');

    // Tiket yang masih aktif tidak boleh terpengaruh
    expect($laporanActive->fresh()->status)->toBe('MENUNGGU_VERIFIKASI');
    expect($rondeActive->fresh()->hasil)->toBeNull();
});

test('command jagains:cek-kuorum-verifikasi aman dijalankan saat tidak ada tiket yang kedaluwarsa', function () {
    buatLaporanDanRondeBatasWaktu($this, sudahKedaluwarsa: false);

    $this->artisan('jagains:cek-kuorum-verifikasi')
        ->expectsOutputToContain('Sebanyak 0 tiket dialihkan')
        ->assertExitCode(0);
});

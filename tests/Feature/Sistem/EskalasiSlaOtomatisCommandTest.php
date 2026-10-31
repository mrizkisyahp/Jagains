<?php

use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

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
        'username' => 'auditor_cmd',
        'password' => bcrypt('password123'),
        'peran' => 'auditor',
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);
});

test('perintah jagains:cek-eskalasi-sla mendeteksi dan membuat eskalasi tiket lewat SLA (FR-ESK-01)', function () {
    // 1. Buat tiket lewat SLA
    $lap = Laporan::create([
        'nomor_tiket' => 'JAG-2026-CMD'.rand(1000, 9999),
        'judul' => 'Trotoar Rusak',
        'keterangan' => 'Ubin pemandu tuna netra hancur.',
        'kategori_id' => $this->kategori->id,
        'kelurahan_id' => $this->kelurahan->id,
        'instansi_id' => $this->instansi->id,
        'pelapor_id' => $this->auditor->id,
        'status' => 'DITERUSKAN',
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => 0,
        'jumlah_pengalihan' => 0,
        'created_at' => now()->subDays(6),
    ]);

    $riwayat = RiwayatStatus::create([
        'laporan_id' => $lap->id,
        'kode_transisi' => 'T-01',
        'status_lama' => null,
        'status_baru' => 'DITERUSKAN',
        'waktu' => now()->subDays(6),
    ]);

    $lap->update([
        'sla_tahap' => 'RESPONS',
        'sla_riwayat_id' => $riwayat->id,
        'sla_mulai_pada' => now()->subDays(6),
        'sla_batas' => 3,
        'sla_satuan' => 'hari_kerja',
        'sla_jatuh_tempo' => now()->subDay()->toDateString(),
    ]);

    // Jalankan perintah artisan
    $this->artisan('jagains:cek-eskalasi-sla')
        ->expectsOutputToContain('Sebanyak 1 tiket dieskalasi ke meja Auditor (SLA)')
        ->assertExitCode(0);

    // Pastikan eskalasi tercatat
    expect(Eskalasi::where('laporan_id', $lap->id)->where('pemicu', 'SLA')->exists())->toBeTrue();
});

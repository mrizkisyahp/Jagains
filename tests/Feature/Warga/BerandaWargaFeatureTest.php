<?php

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;

uses(DatabaseTransactions::class);

beforeEach(function () {
    DB::statement("SET LOCAL jagains.izin_status = 'on'");
});

test('warga dapat mengakses halaman beranda utama dengan props lengkap', function () {
    $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first() ?? Wilayah::factory()->kelurahan()->create();
    $kategori = Kategori::first() ?? Kategori::create(['nama' => 'Jalan Rusak', 'deskripsi' => 'Uji', 'aktif' => true]);

    $uniqueId = uniqid();
    $user = User::factory()->create([
        'username' => 'Sucipto_'.$uniqueId,
        'peran' => 'warga',
        'kelurahan_id' => $kelurahan->id,
        'email_hash' => hash('sha256', "warga_{$uniqueId}@gmail.com"),
        'password' => Hash::make('password123'),
    ]);

    $instansi = Instansi::first() ?? Instansi::create([
        'nama' => 'Dinas PUPR Uji',
        'wilayah_id' => $kelurahan->induk?->induk_id ?? Wilayah::first()->id,
        'aktif' => true,
    ]);

    // Buat laporan milik warga
    Laporan::create([
        'nomor_tiket' => 'JAG-WRG-BRD-01',
        'pelapor_id' => $user->id,
        'kategori_id' => $kategori->id,
        'instansi_id' => $instansi->id,
        'kelurahan_id' => $kelurahan->id,
        'judul' => 'Jalan Berlubang di Kelurahan Mampang',
        'keterangan' => 'Deskripsi aduan jalan berlubang',
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'manual',
        'lintang' => -6.402484,
        'bujur' => 106.794240,
        'status' => 'DITERUSKAN',
        'disembunyikan' => false,
    ]);

    $response = $this->actingAs($user)->get(route('warga.beranda'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('warga/beranda')
        ->where('nama_warga', 'Sucipto_'.$uniqueId)
        ->has('nama_wilayah')
        ->has('peta.titik')
        ->has('peta.laporan_unggulan')
        ->has('riwayat_laporan', 1)
        ->has('kinerja_wilayah.median_respons_hari')
        ->has('kinerja_wilayah.median_durasi_hari')
        ->has('kinerja_wilayah.indikator_kinerja.janji_ditepati')
        ->has('kinerja_wilayah.indikator_kinerja.persentase_verifikasi')
        ->has('kinerja_wilayah.indikator_kinerja.anggaran_menggantung')
    );
});

test('guest dan petugas non-warga ditolak mengakses beranda warga', function () {
    $this->get(route('warga.beranda'))->assertRedirect('/login');

    $petugas = User::factory()->instansi()->create();
    $this->actingAs($petugas)->get(route('warga.beranda'))->assertForbidden();
});

<?php

use App\Models\BeritaAcara;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\VerifikasiWarga;
use App\Models\Wilayah;
use App\Services\TiketDetailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    DB::statement("SET LOCAL jagains.izin_status = 'on'");

    $this->kota = Wilayah::create([
        'kode' => '32.76',
        'nama' => 'Kota Depok',
        'tingkat' => 'kota',
    ]);

    $this->kecamatan = Wilayah::create([
        'kode' => '32.76.03',
        'nama' => 'Pancoran Mas',
        'tingkat' => 'kecamatan',
        'induk_id' => $this->kota->id,
    ]);

    $this->kelurahan = Wilayah::create([
        'kode' => '32.76.03.1001',
        'nama' => 'Depok Jaya',
        'tingkat' => 'kelurahan',
        'induk_id' => $this->kecamatan->id,
    ]);

    $this->instansi = Instansi::create([
        'nama' => 'Dinas PUPR',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Jalan Rusak & Amblas',
        'aktif' => true,
    ]);

    $this->petugas = User::create([
        'username' => 'petugas_pupr',
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
    ]);

    $this->warga = User::create([
        'username' => 'warga_depok',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga@gmail.com'),
        'peran' => 'warga',
        'status_akun' => 'aktif',
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // Laporan koordinat (-6.398, 106.820)
    $this->laporan = Laporan::create([
        'nomor_tiket' => 'JGN-20261108-TEST',
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
        'lintang' => -6.398000,
        'bujur' => 106.820000,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 5.0,
        'keparahan' => 'sedang',
        'judul' => 'Jalan Rusak Parah di Depok Jaya',
        'keterangan' => 'Lubang jalan sedalam 10 cm membahayakan pengendara motor.',
        'status' => 'DIKERJAKAN',
        'created_at' => now(),
    ]);

    // Lampiran awal dari pelapor warga
    Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $this->laporan->id,
        'pengguna_id' => $this->warga->id,
        'tahap' => 'awal',
        'path' => 'laporan/awal.jpg',
        'ukuran_byte' => 10240,
        'lebar' => 800,
        'tinggi' => 600,
        'gps_cocok' => true,
        'created_at' => now()->subDays(2),
    ]);
});

test('instansi dapat mengunggah foto sebelum pengerjaan dengan validasi geofence 50m', function () {
    // Generate valid 1x1 base64 JPEG
    $pixelJpeg = imagecreatetruecolor(10, 10);
    ob_start();
    imagejpeg($pixelJpeg);
    $base64 = 'data:image/jpeg;base64,'.base64_encode(ob_get_clean());
    imagedestroy($pixelJpeg);

    // Posisi di lokasi (jarak ~0m)
    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.foto-sebelum', $this->laporan->id), [
            'foto' => $base64,
            'lintang' => -6.398000,
            'bujur' => 106.820000,
            'akurasi_gps_m' => 4.0,
        ]);

    $response->assertStatus(200);
    $response->assertJsonPath('sukses', true);

    $this->assertDatabaseHas('lampiran', [
        'laporan_id' => $this->laporan->id,
        'tahap' => 'sebelum',
        'pengguna_id' => $this->petugas->id,
        'gps_cocok' => true,
    ]);
});

test('unggah foto sebelum gagal jika koordinat berada di luar radius 50m', function () {
    $pixelJpeg = imagecreatetruecolor(10, 10);
    ob_start();
    imagejpeg($pixelJpeg);
    $base64 = 'data:image/jpeg;base64,'.base64_encode(ob_get_clean());
    imagedestroy($pixelJpeg);

    // Jarak jauh (~1.1 km)
    $response = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.foto-sebelum', $this->laporan->id), [
            'foto' => $base64,
            'lintang' => -6.408000,
            'bujur' => 106.820000,
            'akurasi_gps_m' => 4.0,
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['lokasi']);
});

test('validasi 256 karakter menolak input teks yang melebihi batas', function () {
    $teksPanjang = str_repeat('a', 257);

    // 1. Berita Acara (kegiatan max:256)
    $resBa = $this->actingAs($this->petugas)
        ->postJson(route('instansi.tiket.berita-acara', $this->laporan->id), [
            'kegiatan' => $teksPanjang,
            'hasil' => 'Pekerjaan selesai',
            'hambatan' => null,
        ]);
    $resBa->assertStatus(422);
    $resBa->assertJsonValidationErrors(['kegiatan']);

    // 2. Alasan Verifikasi Warga (alasan max:256)
    $this->laporan->update(['status' => 'MENUNGGU_VERIFIKASI']);
    $lampiranSesudahDummy = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $this->laporan->id,
        'pengguna_id' => $this->petugas->id,
        'tahap' => 'sesudah',
        'path' => 'laporan/sesudah_dummy.jpg',
        'ukuran_byte' => 10240,
        'lebar' => 800,
        'tinggi' => 600,
        'gps_cocok' => true,
        'jarak_m' => 4.2,
        'akurasi_m' => 5.0,
        'created_at' => now(),
    ]);

    RondeVerifikasi::create([
        'laporan_id' => $this->laporan->id,
        'nomor' => 1,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudahDummy->id,
        'mulai' => now(),
        'batas_waktu' => now()->addDays(14),
    ]);

    $resVerif = $this->actingAs($this->warga)
        ->postJson(route('warga.verifikasi.store', $this->laporan->nomor_tiket), [
            'setuju' => false,
            'jalur' => 'B',
            'alasan' => $teksPanjang,
        ]);
    $resVerif->assertStatus(422);
    $resVerif->assertJsonValidationErrors(['alasan']);
});

test('detail tiket menyematkan has_detail, komparasi foto, riwayat revisi berita acara, dan daftar pemilih pada timeline node', function () {
    // 1. Buat Berita Acara Versi 1
    BeritaAcara::create([
        'laporan_id' => $this->laporan->id,
        'instansi_id' => $this->instansi->id,
        'penulis_id' => $this->petugas->id,
        'versi' => 1,
        'kegiatan' => 'Pengerjaan draf awal penambalan aspal.',
        'hasil' => 'Tahap agregat dasar selesai.',
        'created_at' => now()->subDay(),
    ]);

    // 2. Buat Berita Acara Versi 2 (Revisi)
    BeritaAcara::create([
        'laporan_id' => $this->laporan->id,
        'instansi_id' => $this->instansi->id,
        'penulis_id' => $this->petugas->id,
        'versi' => 2,
        'kegiatan' => 'Overlay aspal hotmix dan pemadatan ulang.',
        'hasil' => 'Permukaan aspal rata sempurna.',
        'created_at' => now()->subHours(2),
    ]);

    // 3. Simpan foto sesudah
    $lampiranSesudah = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $this->laporan->id,
        'pengguna_id' => $this->petugas->id,
        'tahap' => 'sesudah',
        'path' => 'laporan/sesudah.jpg',
        'ukuran_byte' => 10240,
        'lebar' => 800,
        'tinggi' => 600,
        'gps_cocok' => true,
        'jarak_m' => 4.2,
        'akurasi_m' => 5.0,
        'created_at' => now()->subHours(1),
    ]);

    // 4. Catat riwayat status MENUNGGU_VERIFIKASI
    RiwayatStatus::create([
        'laporan_id' => $this->laporan->id,
        'kode_transisi' => 'T-08',
        'status_lama' => 'DIKERJAKAN',
        'status_baru' => 'MENUNGGU_VERIFIKASI',
        'pelaku_id' => $this->petugas->id,
        'instansi_id' => $this->instansi->id,
        'catatan' => 'Pekerjaan dinyatakan selesai oleh dinas.',
        'waktu' => now()->subMinutes(30),
    ]);

    // 5. Buka Ronde Verifikasi dan catat suara warga
    $ronde = RondeVerifikasi::create([
        'laporan_id' => $this->laporan->id,
        'nomor' => 1,
        'k' => 2.5,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah->id,
        'mulai' => now()->subMinutes(30),
        'batas_waktu' => now()->addDays(14),
        'hasil' => null,
    ]);

    VerifikasiWarga::create([
        'ronde_id' => $ronde->id,
        'pengguna_id' => $this->warga->id,
        'setuju' => true,
        'jalur' => 'B',
        'bobot' => 1.0,
        'alasan' => null,
        'waktu' => now()->subMinutes(15),
    ]);

    // Panggil service TiketDetailService
    $service = app(TiketDetailService::class);
    $detail = $service->ambilDetailTiket($this->laporan->nomor_tiket);

    expect($detail)->not->toBeNull();
    expect($detail['foto_sebelum'])->toBeNull(); // Petugas belum unggah 'sebelum' khusus, fallback ke 'awal'
    expect($detail['foto_sesudah'])->not->toBeNull();

    // Periksa riwayat_status
    $nodeVerifikasi = collect($detail['riwayat_status'])->firstWhere('status_baru', 'MENUNGGU_VERIFIKASI');
    expect($nodeVerifikasi)->not->toBeNull();
    expect($nodeVerifikasi['has_detail'])->toBeTrue();
    expect($nodeVerifikasi['tipe_detail'])->toBe('verifikasi');

    // Periksa komparasi foto
    $komparasi = $nodeVerifikasi['detail']['komparasi_foto'];
    expect($komparasi['sesudah'])->not->toBeNull();
    expect($komparasi['sebelum'])->not->toBeNull(); // fallback ke foto awal

    // Periksa berita acara tracking revisi
    $baDetail = $nodeVerifikasi['detail']['berita_acara'];
    expect($baDetail['terkini']['versi'])->toBe(2);
    expect($baDetail['riwayat_versi'])->toHaveCount(2);

    // Periksa verifikasi kuorum & daftar pemilih
    $verifDetail = $nodeVerifikasi['detail']['verifikasi_ringkasan'];
    expect($verifDetail['target_k'])->toBe(2.5);
    expect($verifDetail['daftar_pemilih'])->toHaveCount(1);
    expect($verifDetail['daftar_pemilih'][0]['label_warga'])->toBe('Warga #1');
    expect($verifDetail['daftar_pemilih'][0]['setuju'])->toBeTrue();
});

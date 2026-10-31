<?php

use App\Models\BeritaAcara;
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

uses(RefreshDatabase::class);

beforeEach(function () {
    DB::statement("SET jagains.izin_status = 'on'");

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
        'nama' => 'Dinas Perumahan dan Permukiman',
        'singkatan' => 'DISPERKIM',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->petugas = User::create([
        'username' => 'disperkim_officer',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
    ]);

    $this->warga = User::create([
        'username' => 'warga_depokjaya',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga_depokjaya@gmail.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Pohon Tumbang Membahayakan',
        'deskripsi' => 'Dahan pohon rapuh di ruang publik',
        'radius_gabung_m' => 15,
        'aktif' => true,
    ]);

    $this->dummyFoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
});

function buatLaporanPelaksanaan(array $attr = []): Laporan
{
    DB::statement("SET jagains.izin_status = 'on'");

    $seq = rand(1000, 99999);
    $default = [
        'nomor_tiket' => sprintf('JAG-2026-%06d', $seq),
        'judul' => 'Dahan Pohon Patah di Depok Jaya',
        'keterangan' => 'Dahan pohon besar patah dan tersangkut kabel listrik',
        'keparahan' => 'sedang',
        'lintang' => -6.398765,
        'bujur' => 106.812345,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 4.5,
        'status' => 'DIKERJAKAN',
        'jumlah_pengalihan' => 0,
    ];

    $data = array_merge($default, $attr);
    $laporan = Laporan::create($data);

    RiwayatStatus::create([
        'laporan_id' => $laporan->id,
        'kode_transisi' => 'T-07',
        'status_lama' => 'TERJADWAL_ANGGARAN',
        'status_baru' => 'DIKERJAKAN',
        'pelaku_id' => $data['pelapor_id'] ?? 1,
        'instansi_id' => $data['instansi_id'] ?? null,
        'catatan' => 'Mulai dikerjakan',
        'waktu' => now(),
    ]);

    return $laporan->fresh();
}

test('berita acara: pencatatan berkala membentuk versi baru append-only (FR-TIK-07)', function () {
    $laporan = buatLaporanPelaksanaan([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // Terbitkan BA versi 1
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/berita-acara", [
            'kegiatan' => 'Pemotongan dahan pohon dengan gergaji mesin',
            'hasil' => 'Dahan yang tersangkut kabel berhasil diturunkan',
        ])
        ->assertOk()
        ->assertJsonPath('berita_acara.versi', 1);

    // Terbitkan BA versi 2
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/berita-acara", [
            'kegiatan' => 'Pembersihan ranting dan pemuatan ke truk sampah',
            'hasil' => 'Jalanan telah bersih dari serpihan kayu',
            'hambatan' => 'Arus lalu lintas sempat ditutup 10 menit',
        ])
        ->assertOk()
        ->assertJsonPath('berita_acara.versi', 2);

    expect(BeritaAcara::where('laporan_id', $laporan->id)->count())->toBe(2);
});

test('ajukan selesai: wajib memiliki minimal 1 berita acara pengerjaan (FR-TIK-08)', function () {
    $laporan = buatLaporanPelaksanaan([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // Coba ajukan selesai tanpa berita acara
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/selesai", [
            'foto' => $this->dummyFoto,
            'lintang' => -6.398765,
            'bujur' => 106.812345,
            'akurasi_gps_m' => 5.0,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['berita_acara']);
});

test('ajukan selesai: foto sesudah dengan koordinat GPS > 50m ditolak validasi geofence (ST-03 & P-12)', function () {
    $laporan = buatLaporanPelaksanaan([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // Simpan BA prasyarat
    BeritaAcara::create([
        'laporan_id' => $laporan->id,
        'instansi_id' => $this->instansi->id,
        'penulis_id' => $this->petugas->id,
        'versi' => 1,
        'kegiatan' => 'Pemotongan dahan pohon',
        'hasil' => 'Pekerjaan selesai',
        'created_at' => now(),
    ]);

    // Petugas berada di luar 50 meter (Margonda Beji ~4 km dari Pancoran Mas)
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/selesai", [
            'foto' => $this->dummyFoto,
            'lintang' => -6.368765,
            'bujur' => 106.832345,
            'akurasi_gps_m' => 8.0,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['lokasi']);
});

test('ajukan selesai: koordinat GPS cocok <= 50m memicu status MENUNGGU_VERIFIKASI dan membuka ronde verifikasi warga (FR-TIK-08 & ST-16)', function () {
    $laporan = buatLaporanPelaksanaan([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
        'lintang' => -6.398765,
        'bujur' => 106.812345,
    ]);

    // Simpan BA prasyarat
    BeritaAcara::create([
        'laporan_id' => $laporan->id,
        'instansi_id' => $this->instansi->id,
        'penulis_id' => $this->petugas->id,
        'versi' => 1,
        'kegiatan' => 'Penebangan dahan lapuk',
        'hasil' => 'Area telah steril dan aman',
        'created_at' => now(),
    ]);

    // Koordinat petugas berada di lokasi (selisih ~1 meter)
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/selesai", [
            'foto' => $this->dummyFoto,
            'lintang' => -6.398760,
            'bujur' => 106.812345,
            'akurasi_gps_m' => 5.0,
        ])
        ->assertOk()
        ->assertJsonPath('sukses', true);

    $fresh = $laporan->fresh();
    expect($fresh->status)->toBe('MENUNGGU_VERIFIKASI');

    // Lampiran foto sesudah tersimpan
    $lampiran = Lampiran::where('laporan_id', $laporan->id)->where('tahap', 'sesudah')->first();
    expect($lampiran)->not->toBeNull();
    expect($lampiran->gps_cocok)->toBeTrue();

    // Ronde verifikasi dibuka
    $ronde = RondeVerifikasi::where('laporan_id', $laporan->id)->where('nomor', 1)->first();
    expect($ronde)->not->toBeNull();
    expect($ronde->k)->toBeGreaterThanOrEqual(2.0);
});

test('tanggapan resmi: instansi dapat menerbitkan pernyataan terbuka pada linimasa publik (FR-TIK-09)', function () {
    $laporan = buatLaporanPelaksanaan([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/tanggapan", [
            'tanggapan' => 'Petugas telah berkoordinasi dengan PLN untuk pengamanan kabel sebelum pemotongan dahan.',
        ])
        ->assertOk()
        ->assertJsonPath('sukses', true);

    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-09')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->catatan)->toContain('Tanggapan Resmi Instansi');
});

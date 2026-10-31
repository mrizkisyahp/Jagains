<?php

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        'nama' => 'Beji',
        'tingkat' => 'kecamatan',
        'induk_id' => $this->kota->id,
    ]);

    $this->kelurahan = Wilayah::create([
        'kode' => '32.76.01.1001',
        'nama' => 'Pondok Cina',
        'tingkat' => 'kelurahan',
        'induk_id' => $this->kecamatan->id,
    ]);

    $this->instansiA = Instansi::create([
        'nama' => 'Dinas Lingkungan Hidup dan Kebersihan',
        'singkatan' => 'DLHK',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->instansiB = Instansi::create([
        'nama' => 'Dinas Bina Marga',
        'singkatan' => 'DBM',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->petugasA = User::create([
        'username' => 'petugas_dlhk',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansiA->id,
        'status_akun' => 'aktif',
    ]);

    $this->warga = User::create([
        'username' => 'warga_biasa',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga@gmail.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Sampah Liar Menumpuk',
        'deskripsi' => 'Tumpukan sampah ilegal',
        'radius_gabung_m' => 20,
        'aktif' => true,
    ]);
});

function buatLaporanFeature(array $attr = []): Laporan
{
    DB::statement("SET jagains.izin_status = 'on'");

    $seq = rand(1000, 99999);
    $default = [
        'nomor_tiket' => sprintf('JAG-2026-%06d', $seq),
        'judul' => 'Sampah Liar di Jalan Margonda',
        'keterangan' => 'Tumpukan sampah meluap di bahu jalan',
        'keparahan' => 'sedang',
        'lintang' => -6.402484,
        'bujur' => 106.794240,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 10.0,
        'status' => 'DITERUSKAN',
        'jumlah_pengalihan' => 0,
    ];

    $data = array_merge($default, $attr);
    $laporan = Laporan::create($data);

    $riwayat = RiwayatStatus::create([
        'laporan_id' => $laporan->id,
        'kode_transisi' => 'T-01',
        'status_lama' => null,
        'status_baru' => $laporan->status,
        'pelaku_id' => $data['pelapor_id'] ?? 1,
        'instansi_id' => $data['instansi_id'] ?? null,
        'catatan' => 'Laporan awal',
        'waktu' => now(),
    ]);

    if ($laporan->status === 'DITERUSKAN') {
        DB::table('laporan')->where('id', $laporan->id)->update([
            'sla_tahap' => 'RESPONS',
            'sla_riwayat_id' => $riwayat->id,
            'sla_mulai_pada' => now(),
            'sla_batas' => 3,
            'sla_satuan' => 'hari_kerja',
            'sla_jatuh_tempo' => now()->addDays(3)->toDateString(),
        ]);
    }

    return $laporan->fresh();
}

test('guest dan warga dilarang mengakses /instansi/antrean (ST-09)', function () {
    // Guest
    $this->get('/instansi/antrean')
        ->assertRedirect('/login');

    // Warga
    $this->actingAs($this->warga)
        ->get('/instansi/antrean')
        ->assertForbidden();
});

test('petugas instansi dapat membuka halaman /instansi/antrean dengan data isolasi instansinya', function () {
    // Tiket milik instansi A
    buatLaporanFeature([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // Tiket milik instansi B
    buatLaporanFeature([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiB->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $response = $this->actingAs($this->petugasA)->get('/instansi/antrean');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('instansi/antrean')
            ->has('antrean.data', 1)
            ->has('ringkasan')
            ->has('kategoriList')
            ->has('instansiList')
        );
});

test('aksi terima tiket via HTTP controller sukses mengubah status menjadi DITERIMA', function () {
    $laporan = buatLaporanFeature([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
    ]);

    $response = $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/terima", [
            'catatan' => 'Siap disurvei oleh tim kebersihan lapangan',
        ]);

    $response->assertOk()
        ->assertJsonPath('sukses', true);

    expect($laporan->fresh()->status)->toBe('DITERIMA');
});

test('aksi alihkan tiket via HTTP controller berhasil memindahkan instansi penanggung jawab', function () {
    $laporan = buatLaporanFeature([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
    ]);

    $response = $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/alihkan", [
            'instansi_tujuan_id' => $this->instansiB->id,
            'alasan' => 'Sampah berada di aset jalan provinsi yang dikelola DBM',
        ]);

    $response->assertOk()
        ->assertJsonPath('sukses', true);

    expect($laporan->fresh()->instansi_id)->toBe($this->instansiB->id);
    expect($laporan->fresh()->jumlah_pengalihan)->toBe(1);
});

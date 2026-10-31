<?php

use App\Models\BeritaAcara;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\Pengalihan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\InstansiTiketService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Sesi trigger PostgreSQL untuk testing
    DB::statement("SET jagains.izin_status = 'on'");

    $this->kota = Wilayah::create([
        'kode' => '32.76',
        'nama' => 'Kota Depok',
        'tingkat' => 'kota',
        'induk_id' => null,
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

    $this->instansiA = Instansi::create([
        'nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->instansiB = Instansi::create([
        'nama' => 'Dinas Perhubungan',
        'singkatan' => 'DISHUB',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->petugasA = User::create([
        'username' => 'petugas_dpupr',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansiA->id,
        'status_akun' => 'aktif',
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Jalan Berlubang',
        'deskripsi' => 'Kerusakan fisik jalan',
        'radius_gabung_m' => 15,
        'aktif' => true,
    ]);

    $this->warga = User::create([
        'username' => 'warga_pelapor',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga@gmail.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->service = app(InstansiTiketService::class);
});

function buatLaporanUji(array $attributes = []): Laporan
{
    DB::statement("SET jagains.izin_status = 'on'");

    $seq = rand(1000, 99999);
    $default = [
        'nomor_tiket' => sprintf('JAG-2026-%06d', $seq),
        'judul' => 'Jalan Berlubang di Depok',
        'keterangan' => 'Aspal berlubang cukup parah sedalam 10cm',
        'keparahan' => 'sedang',
        'lintang' => -6.402484,
        'bujur' => 106.794240,
        'status' => 'DITERUSKAN',
        'jumlah_pengalihan' => 0,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 5.0,
    ];

    $data = array_merge($default, $attributes);

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

    // Berikan SLA jika DITERUSKAN
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

test('ambilAntreanInstansi hanya mengembalikan tiket milik instansi petugas', function () {
    buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiB->id, // Milik instansi lain
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $antrean = $this->service->ambilAntreanInstansi($this->petugasA, []);

    expect($antrean->total())->toBe(1);
    expect($antrean->items()[0]->instansi_id)->toBe($this->instansiA->id);
});

test('terimaTiket mengubah status menjadi DITERIMA dan memulai SLA survei', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
    ]);

    $hasil = $this->service->terimaTiket($laporan, $this->petugasA);

    expect($hasil->status)->toBe('DITERIMA');
    expect($hasil->sla_tahap)->toBe('SURVEI');
    expect($hasil->sla_batas)->toBe(5);

    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-02')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_baru)->toBe('DITERIMA');
});

test('alihkanTiket berhasil hingga 2 kali dan pengalihan ke-3 ditolak ValidationException', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
        'jumlah_pengalihan' => 0,
    ]);

    // Pengalihan ke-1 (dari A ke B)
    $laporan = $this->service->alihkanTiket(
        $laporan,
        $this->instansiB->id,
        'Bukan kewenangan DPUPR, dialihkan ke Dishub',
        $this->petugasA
    );

    expect($laporan->instansi_id)->toBe($this->instansiB->id);
    expect($laporan->jumlah_pengalihan)->toBe(1);
    expect(Pengalihan::where('laporan_id', $laporan->id)->count())->toBe(1);

    // Login sebagai petugas B untuk pengalihan ke-2 (kembali ke A)
    $petugasB = User::create([
        'username' => 'petugas_dishub',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansiB->id,
        'status_akun' => 'aktif',
    ]);

    $laporan = $this->service->alihkanTiket(
        $laporan,
        $this->instansiA->id,
        'Setelah koordinasi, ini tetap pekerjaan jalan DPUPR',
        $petugasB
    );

    expect($laporan->instansi_id)->toBe($this->instansiA->id);
    expect($laporan->jumlah_pengalihan)->toBe(2);
    expect(Pengalihan::where('laporan_id', $laporan->id)->count())->toBe(2);

    // Pengalihan ke-3 (WAJIB GAGAL sesuai ST-02 & P-07)
    $this->service->alihkanTiket(
        $laporan,
        $this->instansiB->id,
        'Mencoba mengalihkan untuk ke-3 kalinya',
        $this->petugasA
    );
})->throws(ValidationException::class);

test('kembalikanKeAdmin mengubah status menjadi PERLU_ROUTING (T-04)', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
    ]);

    $hasil = $this->service->kembalikanKeAdmin($laporan, 'Lokasi lintas perbatasan dinas, butuh disposisi admin', $this->petugasA);

    expect($hasil->status)->toBe('PERLU_ROUTING');
    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-04')->first();
    expect($riwayat)->not->toBeNull();
});

test('selesaikanSurvei dan jadwalkanAnggaran mematuhi alur transisi T-05 dan T-06', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DITERUSKAN',
    ]);

    $laporan = $this->service->terimaTiket($laporan, $this->petugasA);
    $laporan = $this->service->selesaikanSurvei($laporan, 'Survei lapangan selesai, volume kerusakan 12 m2', $this->petugasA);

    expect($laporan->status)->toBe('DISURVEI');

    $targetDate = now()->addDays(30)->toDateString();
    $laporan = $this->service->jadwalkanAnggaran(
        $laporan,
        'APBD_KOTA',
        $targetDate,
        $this->petugasA
    );

    expect($laporan->status)->toBe('TERJADWAL_ANGGARAN');
    expect($laporan->jenis_pendanaan)->toBe('APBD_KOTA');
    expect($laporan->tanggal_target->toDateString())->toBe($targetDate);
    expect($laporan->tanggal_target_awal->toDateString())->toBe($targetDate);
});

test('simpanBeritaAcara membentuk versi baru secara append-only (FR-TIK-07)', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DIKERJAKAN',
    ]);

    $ba1 = $this->service->simpanBeritaAcara($laporan, [
        'kegiatan' => 'Pengerukan aspal amblas',
        'hasil' => 'Pembersihan dasar selesai',
        'hambatan' => null,
    ], $this->petugasA);

    expect($ba1->versi)->toBe(1);

    $ba2 = $this->service->simpanBeritaAcara($laporan, [
        'kegiatan' => 'Pengaspalan hotmix',
        'hasil' => 'Aspal terpasang padat',
        'hambatan' => 'Hujan rintik di sore hari',
    ], $this->petugasA);

    expect($ba2->versi)->toBe(2);
    expect(BeritaAcara::where('laporan_id', $laporan->id)->count())->toBe(2);
});

test('ajukanSelesai memvalidasi geofence GPS 50m dan membuka ronde verifikasi (FR-TIK-08 & ST-03)', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'DIKERJAKAN',
        'lintang' => -6.402484,
        'bujur' => 106.794240,
    ]);

    // Simpan minimal 1 berita acara prasyarat
    $this->service->simpanBeritaAcara($laporan, [
        'kegiatan' => 'Penyelesaian akhir aspal',
        'hasil' => 'Permukaan rata dan siap dilalui',
    ], $this->petugasA);

    // Dummy 1x1 base64 transparent GIF
    $dummyFoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // 1. Coba ajukan dengan koordinat > 50 meter (Monas Jakarta: -6.175392, 106.827153)
    try {
        $this->service->ajukanSelesai(
            $laporan,
            $dummyFoto,
            -6.175392,
            106.827153,
            10.0,
            $this->petugasA
        );
        $this->fail('Seharusnya melempar ValidationException karena jarak > 50m');
    } catch (ValidationException $e) {
        expect($e->errors())->toHaveKey('lokasi');
    }

    // 2. Ajukan dengan koordinat cocok (berjarak < 5 meter dari titik awal)
    $laporanSelesai = $this->service->ajukanSelesai(
        $laporan,
        $dummyFoto,
        -6.402480, // Selisih sangat kecil ~0.5 meter
        106.794240,
        5.0,
        $this->petugasA
    );

    expect($laporanSelesai->status)->toBe('MENUNGGU_VERIFIKASI');

    // Cek lampiran tahap sesudah
    $lampiranSesudah = Lampiran::where('laporan_id', $laporan->id)->where('tahap', 'sesudah')->first();
    expect($lampiranSesudah)->not->toBeNull();
    expect($lampiranSesudah->gps_cocok)->toBeTrue();

    // Cek pembukaan ronde verifikasi ke-1
    $ronde = RondeVerifikasi::where('laporan_id', $laporan->id)->where('nomor', 1)->first();
    expect($ronde)->not->toBeNull();
    expect($ronde->k)->toBeGreaterThanOrEqual(2.0); // K minimum 2 bobot
});

test('revisiTanggalTarget dibatasi maksimal 2 kali per tiket (FR-TIK-14 & P-16)', function () {
    $laporan = buatLaporanUji([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'TERJADWAL_ANGGARAN',
        'jenis_pendanaan' => 'APBD_KOTA',
        'tanggal_target' => now()->addDays(20)->toDateString(),
        'tanggal_target_awal' => now()->addDays(20)->toDateString(),
    ]);

    // Revisi 1
    $laporan = $this->service->revisiTanggalTarget(
        $laporan,
        now()->addDays(35)->toDateString(),
        'Cuaca ekstrem menghambat pengadaan material',
        $this->petugasA
    );
    expect($laporan->tanggal_target->toDateString())->toBe(now()->addDays(35)->toDateString());

    // Revisi 2
    $laporan = $this->service->revisiTanggalTarget(
        $laporan,
        now()->addDays(45)->toDateString(),
        'Perbaikan saluran drainase pendukung memerlukan waktu tambahan',
        $this->petugasA
    );
    expect($laporan->tanggal_target->toDateString())->toBe(now()->addDays(45)->toDateString());

    // Revisi 3 (WAJIB DITOLAK sesuai P-16)
    $this->service->revisiTanggalTarget(
        $laporan,
        now()->addDays(60)->toDateString(),
        'Mencoba meminta perpanjangan ketiga',
        $this->petugasA
    );
})->throws(ValidationException::class);

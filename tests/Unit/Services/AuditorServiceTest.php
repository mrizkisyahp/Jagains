<?php

use App\Models\AuditLog;
use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\KeputusanAuditor;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\Pengalihan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\AuditorService;
use App\Services\NotifikasiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
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

    $this->instansi = Instansi::create([
        'nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->instansi2 = Instansi::create([
        'nama' => 'Dinas Lingkungan Hidup dan Kebersihan',
        'singkatan' => 'DLHK',
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
        'username' => 'auditor_independen',
        'password' => bcrypt('password123'),
        'peran' => 'auditor',
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    $this->warga = User::create([
        'username' => 'warga_pelapor',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->notifikasiService = app(NotifikasiService::class);
    $this->service = new AuditorService($this->notifikasiService);
});

function buatLampiranSesudah($test, $laporan): Lampiran
{
    $petugas = User::create([
        'username' => 'petugas_'.uniqid(),
        'password' => bcrypt('password123'),
        'peran' => 'instansi',
        'instansi_id' => $test->instansi->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    return Lampiran::create([
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
}

function buatLaporanUjiAuditor($test, array $attr = []): Laporan
{
    return Laporan::create(array_merge([
        'nomor_tiket' => 'JAG-2026-AUD'.rand(1000, 9999),
        'judul' => 'Kerusakan Saluran Drainase',
        'keterangan' => 'Saluran drainase tersumbat dan meluap ke badan jalan.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $test->warga->id,
        'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => 1,
        'jumlah_pengalihan' => 0,
        'created_at' => now(),
    ], $attr));
}

function buatLaporanSlaUji($test, string $status = 'DITERUSKAN', string $slaTahap = 'RESPONS', int $slaBatas = 3, int $hariLampau = 5, ?string $jatuhTempo = null): array
{
    $lap = Laporan::create([
        'nomor_tiket' => 'JAG-2026-SLA'.rand(1000, 9999),
        'judul' => 'Kerusakan Saluran Drainase',
        'keterangan' => 'Saluran drainase tersumbat dan meluap ke badan jalan.',
        'kategori_id' => $test->kategori->id,
        'kelurahan_id' => $test->kelurahan->id,
        'instansi_id' => $test->instansi->id,
        'pelapor_id' => $test->warga->id,
        'status' => $status,
        'keparahan' => 'sedang',
        'lokasi_sumber' => 'gps',
        'lintang' => -6.402484,
        'bujur' => 106.794241,
        'akurasi_gps_m' => 5.0,
        'ronde_sengketa' => 0,
        'jumlah_pengalihan' => 0,
        'created_at' => now()->subDays($hariLampau),
    ]);

    $riwayat = RiwayatStatus::create([
        'laporan_id' => $lap->id,
        'kode_transisi' => 'T-01',
        'status_lama' => null,
        'status_baru' => $status,
        'waktu' => now()->subDays($hariLampau),
    ]);

    $tenggat = $jatuhTempo ?: now()->subDays(max(1, $hariLampau - $slaBatas))->toDateString();

    $lap->update([
        'sla_tahap' => $slaTahap,
        'sla_riwayat_id' => $riwayat->id,
        'sla_mulai_pada' => now()->subDays($hariLampau),
        'sla_batas' => $slaBatas,
        'sla_satuan' => 'hari_kerja',
        'sla_jatuh_tempo' => $tenggat,
    ]);

    return [$lap, $riwayat];
}

test('auditor dapat mengambil antrean eskalasi terbuka dengan filter tab pemicu (FR-AUD-01)', function () {
    $lap1 = buatLaporanUjiAuditor($this, ['status' => 'MENUNGGU_KEPUTUSAN_AUDITOR']);
    $lampiranSesudah1 = buatLampiranSesudah($this, $lap1);
    $ronde1 = RondeVerifikasi::create([
        'laporan_id' => $lap1->id,
        'nomor' => 1,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah1->id,
        'mulai' => now()->subDays(15),
        'batas_waktu' => now()->subDay(),
        'hasil' => 'kedaluwarsa',
        'selesai_pada' => now()->subDay(),
        'created_at' => now()->subDays(15),
    ]);
    $esk1 = Eskalasi::create([
        'laporan_id' => $lap1->id,
        'pemicu' => 'TANPA_KUORUM',
        'ronde_id' => $ronde1->id,
        'created_at' => now(),
    ]);

    [$lap2, $riwayat2] = buatLaporanSlaUji($this, status: 'DITERIMA', slaTahap: 'SURVEI', slaBatas: 5, hariLampau: 10);
    $esk2 = Eskalasi::create([
        'laporan_id' => $lap2->id,
        'pemicu' => 'SLA',
        'tahap' => 'SURVEI',
        'riwayat_masuk_id' => $riwayat2->id,
        'created_at' => now(),
    ]);

    // Ambil tab semua
    $semua = $this->service->ambilAntreanEskalasi($this->auditor, ['tab' => 'semua']);
    expect($semua->total())->toBe(2);

    // Ambil tab SLA
    $tabSla = $this->service->ambilAntreanEskalasi($this->auditor, ['tab' => 'sla']);
    expect($tabSla->total())->toBe(1);
    expect($tabSla->first()->id)->toBe($esk2->id);

    // Ambil tab tanpa_kuorum
    $tabTanpaKuorum = $this->service->ambilAntreanEskalasi($this->auditor, ['tab' => 'tanpa_kuorum']);
    expect($tabTanpaKuorum->total())->toBe(1);
    expect($tabTanpaKuorum->first()->id)->toBe($esk1->id);
});

test('auditor dapat menerbitkan perintah dan tenggat untuk eskalasi pemicu SLA (FR-AUD-02, BR-AUD-05)', function () {
    [$lap, $riwayat] = buatLaporanSlaUji($this, status: 'DITERUSKAN', slaTahap: 'RESPONS', slaBatas: 3, hariLampau: 6);

    $eskalasi = Eskalasi::create([
        'laporan_id' => $lap->id,
        'pemicu' => 'SLA',
        'tahap' => 'RESPONS',
        'riwayat_masuk_id' => $riwayat->id,
        'created_at' => now(),
    ]);

    $tenggatPerintah = now()->addDays(3)->toDateString();
    $hasil = $this->service->putuskanEskalasi($this->auditor, $eskalasi, [
        'jenis' => 'PERINTAH',
        'perintah' => 'Instansi wajib segera merespons disposisi tiket dalam 3 hari kalender.',
        'tenggat' => $tenggatPerintah,
    ]);

    expect($hasil['sukses'])->toBeTrue();
    // Status tiket TIDAK boleh berubah (tetap DITERUSKAN)
    expect($lap->fresh()->status)->toBe('DITERUSKAN');

    // Catatan keputusan tersimpan di keputusan_auditor
    $keputusan = KeputusanAuditor::where('eskalasi_id', $eskalasi->id)->first();
    expect($keputusan)->not->toBeNull();
    expect($keputusan->jenis)->toBe('PERINTAH');
    expect($keputusan->perintah)->toContain('dalam 3 hari kalender');
    expect($keputusan->tenggat->toDateString())->toBe($tenggatPerintah);

    // Audit log terbentuk
    expect(AuditLog::where('laporan_id', $lap->id)->where('aksi', 'AUDITOR_PERINTAH_SLA')->exists())->toBeTrue();
});

test('auditor dapat menetapkan PERBAIKAN_SAH pada eskalasi non-SLA (T-19, status menjadi TERTUTUP_AUDITOR)', function () {
    $lap = buatLaporanUjiAuditor($this, ['status' => 'MENUNGGU_KEPUTUSAN_AUDITOR']);
    $lampiranSesudah = buatLampiranSesudah($this, $lap);
    $ronde = RondeVerifikasi::create([
        'laporan_id' => $lap->id,
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
        'laporan_id' => $lap->id,
        'pemicu' => 'TANPA_KUORUM',
        'ronde_id' => $ronde->id,
        'created_at' => now(),
    ]);

    $hasil = $this->service->putuskanEskalasi($this->auditor, $eskalasi, [
        'jenis' => 'PERBAIKAN_SAH',
        'alasan' => 'Berdasarkan dokumentasi foto sesudah dan berita acara, fisik saluran telah diperbaiki sesuai standar baku.',
    ]);

    expect($hasil['sukses'])->toBeTrue();
    expect($lap->fresh()->status)->toBe('TERTUTUP_AUDITOR');
    expect($lap->fresh()->ditutup_pada)->not->toBeNull();
    expect($eskalasi->fresh()->selesai_pada)->not->toBeNull();
    expect($eskalasi->fresh()->selesai_alasan)->toBe('diputuskan');

    // Riwayat status T-19
    $riwayat = RiwayatStatus::where('laporan_id', $lap->id)->where('kode_transisi', 'T-19')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_baru)->toBe('TERTUTUP_AUDITOR');
});

test('auditor dapat memerintahkan KERJAKAN_ULANG pada eskalasi non-SLA (T-20, status menjadi DIKERJAKAN)', function () {
    $lap = buatLaporanUjiAuditor($this, ['status' => 'MENUNGGU_KEPUTUSAN_AUDITOR', 'ronde_sengketa' => 1]);
    $lampiranSesudah = buatLampiranSesudah($this, $lap);
    $ronde = RondeVerifikasi::create([
        'laporan_id' => $lap->id,
        'nomor' => 1,
        'k' => 2.0,
        'k_param' => ['k_bp' => 200, 'kmin' => 2.0, 'kmax' => 5.0],
        'lampiran_sesudah_id' => $lampiranSesudah->id,
        'mulai' => now()->subDays(10),
        'batas_waktu' => now()->addDays(4),
        'hasil' => 'tolak',
        'selesai_pada' => now()->subDays(2),
        'created_at' => now()->subDays(10),
    ]);
    $eskalasi = Eskalasi::create([
        'laporan_id' => $lap->id,
        'pemicu' => 'SANGGAHAN',
        'ronde_id' => $ronde->id,
        'created_at' => now(),
    ]);

    $tenggatUlang = now()->addDays(7)->toDateString();
    $hasil = $this->service->putuskanEskalasi($this->auditor, $eskalasi, [
        'jenis' => 'KERJAKAN_ULANG',
        'alasan' => 'Dinas wajib melakukan pengaspalan ulang karena uji warga membuktikan ketebalan belum memadai.',
        'perintah' => 'Lakukan perataan ulang dan pelapisan aspal hotmix.',
        'tenggat' => $tenggatUlang,
    ]);

    expect($hasil['sukses'])->toBeTrue();
    expect($lap->fresh()->status)->toBe('DIKERJAKAN');
    expect($lap->fresh()->ronde_sengketa)->toBe(2);
    expect($eskalasi->fresh()->selesai_pada)->not->toBeNull();
    expect($eskalasi->fresh()->selesai_alasan)->toBe('diputuskan');

    // Riwayat status T-20
    $riwayat = RiwayatStatus::where('laporan_id', $lap->id)->where('kode_transisi', 'T-20')->first();
    expect($riwayat)->not->toBeNull();
    expect($riwayat->status_baru)->toBe('DIKERJAKAN');
});

test('putuskan eskalasi ditolak jika perkara eskalasi sudah diputuskan sebelumnya', function () {
    $lap = buatLaporanUjiAuditor($this);
    $lampiranSesudah = buatLampiranSesudah($this, $lap);
    $ronde = RondeVerifikasi::create([
        'laporan_id' => $lap->id,
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
        'laporan_id' => $lap->id,
        'pemicu' => 'TANPA_KUORUM',
        'ronde_id' => $ronde->id,
        'created_at' => now()->subDay(),
        'selesai_pada' => now()->subHour(),
        'selesai_alasan' => 'diputuskan',
    ]);

    expect(fn () => $this->service->putuskanEskalasi($this->auditor, $eskalasi, [
        'jenis' => 'PERBAIKAN_SAH',
        'alasan' => 'Perbaikan fisik sah dan memenuhi spesifikasi.',
    ]))->toThrow(ValidationException::class);
});

test('prosesEskalasiSlaOtomatis membuat eskalasi SLA secara idempoten saat lewat jatuh tempo (FR-ESK-01)', function () {
    // Tiket yang jatuh tempo kemarin
    [$lapTerlambat, $riwayat1] = buatLaporanSlaUji($this, status: 'DITERUSKAN', slaTahap: 'RESPONS', slaBatas: 3, hariLampau: 5, jatuhTempo: now()->subDay()->toDateString());

    // Tiket yang masih aman (jatuh tempo 2 hari lagi)
    [$lapAman, $riwayat2] = buatLaporanSlaUji($this, status: 'DITERIMA', slaTahap: 'SURVEI', slaBatas: 5, hariLampau: 1, jatuhTempo: now()->addDays(2)->toDateString());

    // Jalankan scan pertama
    $jumlah1 = $this->service->prosesEskalasiSlaOtomatis();
    expect($jumlah1)->toBe(1);

    // Pastikan eskalasi tercatat
    $esk = Eskalasi::where('laporan_id', $lapTerlambat->id)->where('pemicu', 'SLA')->first();
    expect($esk)->not->toBeNull();
    expect($esk->tahap)->toBe('RESPONS');

    // Jalankan scan kedua (uji idempotensi)
    $jumlah2 = $this->service->prosesEskalasiSlaOtomatis();
    expect($jumlah2)->toBe(0);

    // Eskalasi tetap hanya ada 1
    expect(Eskalasi::where('laporan_id', $lapTerlambat->id)->where('pemicu', 'SLA')->count())->toBe(1);
});

test('tutupEskalasiSlaSaatTahapBerpindah menutup eskalasi SLA terbuka dengan alasan tahap_berpindah', function () {
    [$lap, $riwayat] = buatLaporanSlaUji($this, status: 'DITERUSKAN', slaTahap: 'RESPONS', slaBatas: 3, hariLampau: 5, jatuhTempo: now()->subDay()->toDateString());

    $eskalasi = Eskalasi::create([
        'laporan_id' => $lap->id,
        'pemicu' => 'SLA',
        'tahap' => 'RESPONS',
        'riwayat_masuk_id' => $riwayat->id,
        'created_at' => now(),
    ]);

    $ditutup = $this->service->tutupEskalasiSlaSaatTahapBerpindah($lap, 'RESPONS');
    expect($ditutup)->toBe(1);

    expect($eskalasi->fresh()->selesai_pada)->not->toBeNull();
    expect($eskalasi->fresh()->selesai_alasan)->toBe('tahap_berpindah');
});

test('ambilPolaPengawasan menghitung metrik analitik dan matriks pengalihan (FR-AUD-03)', function () {
    $lap = buatLaporanUjiAuditor($this);

    // Buat riwayat pengalihan
    Pengalihan::create([
        'laporan_id' => $lap->id,
        'instansi_asal_id' => $this->instansi->id,
        'instansi_tujuan_id' => $this->instansi2->id,
        'alasan' => 'Bukan wewenang bina marga, melainkan penanganan taman.',
        'pelaku_id' => $this->warga->id,
        'waktu' => now(),
    ]);

    $pola = $this->service->ambilPolaPengawasan();

    expect($pola)->toHaveKeys(['ringkasan', 'pengalihan', 'performa_instansi']);
    expect($pola['pengalihan'])->toHaveCount(1);
    expect($pola['pengalihan'][0]['asal'])->toBe('DPUPR');
    expect($pola['pengalihan'][0]['tujuan'])->toBe('DLHK');
    expect($pola['performa_instansi'])->toHaveCount(2);
});

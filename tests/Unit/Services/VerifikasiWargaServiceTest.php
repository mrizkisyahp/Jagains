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
use App\Models\VerifikasiWarga;
use App\Models\Wilayah;
use App\Services\FotoLaporanService;
use App\Services\NotifikasiService;
use App\Services\VerifikasiWargaService;
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

    $this->fotoServiceMock = Mockery::mock(FotoLaporanService::class);
    $this->fotoServiceMock->shouldReceive('prosesFotoKamera')
        ->byDefault()
        ->andReturn([
            'uuid' => (string) Str::uuid(),
            'path' => 'lampiran/2026/10/verif-test.jpg',
            'ukuran_byte' => 1024,
            'lebar' => 800,
            'tinggi' => 600,
        ]);

    $this->notifikasiService = app(NotifikasiService::class);
    $this->service = new VerifikasiWargaService($this->fotoServiceMock, $this->notifikasiService);
});

// Helper membuat tiket laporan yang berada pada status MENUNGGU_VERIFIKASI
function buatTiketMenungguVerifikasi(array $attr = []): array
{
    $pelapor = buatWargaUji();

    $laporan = Laporan::create(array_merge([
        'nomor_tiket' => 'JAG-2026-'.str_pad((string) rand(1, 999999), 6, '0', STR_PAD_LEFT),
        'judul' => 'Aspal Rusak di Jalan Kartini',
        'keterangan' => 'Kerusakan aspal berlubang parah membahayakan pengendara motor.',
        'kategori_id' => test()->kategori->id,
        'kelurahan_id' => test()->kelurahan->id,
        'instansi_id' => test()->instansi->id,
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
    ], $attr));

    // Buat lampiran foto sesudah yang menjadi prasyarat ronde
    $lampiranSesudah = Lampiran::create([
        'uuid' => (string) Str::uuid(),
        'laporan_id' => $laporan->id,
        'pengguna_id' => User::create([
            'username' => 'petugas_'.uniqid(),
            'password' => bcrypt('password'),
            'peran' => 'instansi',
            'instansi_id' => test()->instansi->id,
            'status_akun' => 'aktif',
            'email_hash' => null,
        ])->id,
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

// Helper membuat user warga di kelurahan tertentu
function buatWargaUji(array $attr = []): User
{
    return User::create(array_merge([
        'username' => 'warga_'.uniqid(),
        'password' => bcrypt('password'),
        'email_hash' => hash('sha256', uniqid().'@example.com'),
        'peran' => 'warga',
        'kelurahan_id' => test()->kelurahan->id,
        'status_akun' => 'aktif',
    ], $attr));
}

test('warga kelurahan dapat memberikan suara Jalur B (jarak jauh, bobot 0.5)', function () {
    [$laporan, $ronde] = buatTiketMenungguVerifikasi();
    $warga = buatWargaUji();

    $hasil = $this->service->kirimSuara($warga, $laporan, [
        'setuju' => true,
        'jalur' => 'B',
    ]);

    expect($hasil['keputusan'])->toBe('BERJALAN');

    $suara = VerifikasiWarga::where('ronde_id', $ronde->id)->where('pengguna_id', $warga->id)->first();
    expect($suara)->not->toBeNull();
    expect($suara->bobot)->toEqual(0.5);
    expect($suara->jalur)->toBe('B');
    expect($suara->setuju)->toBeTrue();
    expect($suara->lampiran_id)->toBeNull();
});

test('warga kelurahan dapat memberikan suara Jalur A dengan foto dan GPS cocok <= 50m (bobot 1.0)', function () {
    [$laporan, $ronde] = buatTiketMenungguVerifikasi();
    $warga = buatWargaUji();

    // Titik lokasi warga berjarak ~10 meter dari titik laporan (-6.402484, 106.794241)
    $hasil = $this->service->kirimSuara($warga, $laporan, [
        'setuju' => true,
        'jalur' => 'A',
        'foto_base64' => 'data:image/jpeg;base64,dummyfakecontent',
        'latitude' => -6.402500,
        'longitude' => 106.794250,
        'akurasi_m' => 8.0,
    ]);

    $suara = VerifikasiWarga::where('ronde_id', $ronde->id)->where('pengguna_id', $warga->id)->first();
    expect($suara)->not->toBeNull();
    expect($suara->bobot)->toEqual(1.0);
    expect($suara->jalur)->toBe('A');
    expect($suara->lampiran_id)->not->toBeNull();
});

test('suara Jalur A ditolak jika koordinat GPS berjarak lebih dari 50 meter (ST-03, P-12)', function () {
    [$laporan] = buatTiketMenungguVerifikasi();
    $warga = buatWargaUji();

    // Titik warga berjarak ~200 meter
    expect(fn () => $this->service->kirimSuara($warga, $laporan, [
        'setuju' => true,
        'jalur' => 'A',
        'foto_base64' => 'data:image/jpeg;base64,dummy',
        'latitude' => -6.404500,
        'longitude' => 106.796000,
        'akurasi_m' => 10.0,
    ]))->toThrow(ValidationException::class);
});

test('suara tolak wajib menyertakan alasan teks minimal 10 karakter (FR-VER-03, AS-05)', function () {
    [$laporan] = buatTiketMenungguVerifikasi();
    $warga = buatWargaUji();

    // Tolak tanpa alasan
    expect(fn () => $this->service->kirimSuara($warga, $laporan, [
        'setuju' => false,
        'jalur' => 'B',
        'alasan' => '',
    ]))->toThrow(ValidationException::class);

    // Tolak dengan alasan terlalu pendek (< 10 karakter)
    expect(fn () => $this->service->kirimSuara($warga, $laporan, [
        'setuju' => false,
        'jalur' => 'B',
        'alasan' => 'jelek',
    ]))->toThrow(ValidationException::class);
});

test('satu warga dilarang memberi suara lebih dari 1 kali pada ronde yang sama (FR-VER-07, AS-01)', function () {
    [$laporan] = buatTiketMenungguVerifikasi();
    $warga = buatWargaUji();

    $this->service->kirimSuara($warga, $laporan, [
        'setuju' => true,
        'jalur' => 'B',
    ]);

    // Upaya memberi suara kedua
    expect(fn () => $this->service->kirimSuara($warga, $laporan, [
        'setuju' => true,
        'jalur' => 'B',
    ]))->toThrow(ValidationException::class);
});

test('ST-06: bobot mencapai K murni Jalur B tidak menutup tiket sampai ada minimal 1 suara Jalur A', function () {
    // Target K = 2.0
    [$laporan, $ronde] = buatTiketMenungguVerifikasi(['nomor_tiket' => 'JAG-ST06-001']);

    // 4 Warga Jalur B memberi suara setuju (4 x 0.5 = 2.0 bobot, memenuhi K = 2.0)
    for ($i = 1; $i <= 4; $i++) {
        $wargaB = buatWargaUji();
        $res = $this->service->kirimSuara($wargaB, $laporan, [
            'setuju' => true,
            'jalur' => 'B',
        ]);

        if ($i < 4) {
            expect($res['keputusan'])->toBe('BERJALAN');
        } else {
            // Saat bobot mencapai 2.0 tanpa ada Jalur A
            expect($res['keputusan'])->toBe('MENUNGGU_JALUR_A');
        }
    }

    // Tiket harus TETAP MENUNGGU_VERIFIKASI
    expect($laporan->fresh()->status)->toBe('MENUNGGU_VERIFIKASI');
    expect($ronde->fresh()->hasil)->toBeNull();

    // Warga ke-5 hadir di lokasi memberikan suara Jalur A (bobot 1.0)
    $wargaA = buatWargaUji();
    $resA = $this->service->kirimSuara($wargaA, $laporan, [
        'setuju' => true,
        'jalur' => 'A',
        'foto_base64' => 'data:image/jpeg;base64,dummy',
        'latitude' => -6.402490,
        'longitude' => 106.794245,
        'akurasi_m' => 5.0,
    ]);

    // Sekarang tiket resmi lolos kuorum warga TERTUTUP_WARGA (T-14)
    expect($resA['keputusan'])->toBe('TERTUTUP_WARGA');
    expect($laporan->fresh()->status)->toBe('TERTUTUP_WARGA');
    expect($ronde->fresh()->hasil)->toBe('setuju');
    expect($laporan->fresh()->ditutup_pada)->not->toBeNull();
});

test('kuorum tolak dengan Jalur A mengubah status tiket menjadi DISENGKETAKAN (T-15, FR-VER-04)', function () {
    [$laporan, $ronde] = buatTiketMenungguVerifikasi();

    // Warga 1: Jalur B tolak (bobot 0.5)
    $w1 = buatWargaUji();
    $this->service->kirimSuara($w1, $laporan, [
        'setuju' => false,
        'jalur' => 'B',
        'alasan' => 'Aspal masih bergelombang dan belum padat.',
    ]);

    // Warga 2: Jalur B tolak (bobot 0.5)
    $w2 = buatWargaUji();
    $this->service->kirimSuara($w2, $laporan, [
        'setuju' => false,
        'jalur' => 'B',
        'alasan' => 'Pekerjaan asal-asalan, trotoar malah rusak.',
    ]);

    // Warga 3: Jalur A tolak (bobot 1.0, hadir di lokasi)
    $w3 = buatWargaUji();
    $res = $this->service->kirimSuara($w3, $laporan, [
        'setuju' => false,
        'jalur' => 'A',
        'alasan' => 'Lubang jalan masih menganga dan membahayakan warga.',
        'foto_base64' => 'data:image/jpeg;base64,dummy',
        'latitude' => -6.402485,
        'longitude' => 106.794240,
        'akurasi_m' => 5.0,
    ]);

    expect($res['keputusan'])->toBe('DISENGKETAKAN');
    expect($laporan->fresh()->status)->toBe('DISENGKETAKAN');
    expect($ronde->fresh()->hasil)->toBe('tolak');

    // Berkas sengketa harus terbentuk dengan tenggat 7 hari kerja
    $sengketa = Sengketa::where('ronde_id', $ronde->id)->first();
    expect($sengketa)->not->toBeNull();
    expect($sengketa->tenggat)->not->toBeNull();
    expect($sengketa->jawaban)->toBeNull();
});

test('ST-05: tiket melewati 14 hari kalender bermutasi ke MENUNGGU_KEPUTUSAN_AUDITOR dengan pemicu TANPA_KUORUM', function () {
    [$laporan, $ronde] = buatTiketMenungguVerifikasi();

    // Manipulasi batas waktu menjadi telah lampau (mulai 15 hari lalu dan berakhir 1 hari lalu)
    $ronde->update([
        'mulai' => now()->subDays(15),
        'batas_waktu' => now()->subDay(),
    ]);

    $diproses = $this->service->prosesBatasWaktu14Hari();

    expect($diproses)->toBe(1);
    expect($laporan->fresh()->status)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
    expect($ronde->fresh()->hasil)->toBe('kedaluwarsa');

    $eskalasi = Eskalasi::where('laporan_id', $laporan->id)->where('ronde_id', $ronde->id)->first();
    expect($eskalasi)->not->toBeNull();
    expect($eskalasi->pemicu)->toBe('TANPA_KUORUM');

    $riwayat = RiwayatStatus::where('laporan_id', $laporan->id)->where('kode_transisi', 'T-16')->first();
    expect($riwayat)->not->toBeNull();
});

test('instansi dapat merespons sengketa dengan kerjakan_ulang (T-17) atau sanggah (T-18)', function () {
    [$laporan, $ronde] = buatTiketMenungguVerifikasi();

    // Buat status DISENGKETAKAN & entri sengketa
    $laporan->update(['status' => 'DISENGKETAKAN', 'ronde_sengketa' => 1]);
    $sengketa = Sengketa::create([
        'ronde_id' => $ronde->id,
        'tenggat' => now()->addDays(7)->toDateString(),
        'created_at' => now(),
    ]);

    $petugas = User::create([
        'username' => 'petugas_res',
        'password' => bcrypt('password'),
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);

    // 1. Uji kerjakan_ulang
    $resKerjakan = $this->service->responsSengketaInstansi($petugas, $laporan, 'kerjakan_ulang');
    expect($resKerjakan['status'])->toBe('DIKERJAKAN');
    expect($laporan->fresh()->status)->toBe('DIKERJAKAN');
    expect($sengketa->fresh()->jawaban)->toBe('kerjakan_ulang');

    // 2. Uji sanggah pada tiket sengketa baru
    [$laporan2, $ronde2] = buatTiketMenungguVerifikasi();
    $laporan2->update(['status' => 'DISENGKETAKAN', 'ronde_sengketa' => 1]);
    $sengketa2 = Sengketa::create([
        'ronde_id' => $ronde2->id,
        'tenggat' => now()->addDays(7)->toDateString(),
        'created_at' => now(),
    ]);

    $resSanggah = $this->service->responsSengketaInstansi(
        $petugas,
        $laporan2,
        'sanggah',
        'Pekerjaan pengaspalan telah memenuhi uji laboratorium Dinas Bina Marga.'
    );

    expect($resSanggah['status'])->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
    expect($laporan2->fresh()->status)->toBe('MENUNGGU_KEPUTUSAN_AUDITOR');
    expect($sengketa2->fresh()->jawaban)->toBe('sanggah');

    $eskalasi = Eskalasi::where('laporan_id', $laporan2->id)->where('ronde_id', $ronde2->id)->first();
    expect($eskalasi)->not->toBeNull();
    expect($eskalasi->pemicu)->toBe('SANGGAHAN');
});

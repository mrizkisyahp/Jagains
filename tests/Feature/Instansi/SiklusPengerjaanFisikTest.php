<?php

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
        'kode' => '32.76.02',
        'nama' => 'Sukmajaya',
        'tingkat' => 'kecamatan',
        'induk_id' => $this->kota->id,
    ]);

    $this->kelurahan = Wilayah::create([
        'kode' => '32.76.02.1001',
        'nama' => 'Mekarjaya',
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

    $this->petugas = User::create([
        'username' => 'officer_pupr',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansi->id,
        'status_akun' => 'aktif',
    ]);

    $this->warga = User::create([
        'username' => 'warga_mekarjaya',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga_mekarjaya@gmail.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Drainase Tersumbat',
        'deskripsi' => 'Saluran drainase mampet',
        'radius_gabung_m' => 15,
        'aktif' => true,
    ]);
});

function buatLaporanSiklusFisik(array $attr = []): Laporan
{
    DB::statement("SET jagains.izin_status = 'on'");

    $seq = rand(1000, 99999);
    $default = [
        'nomor_tiket' => sprintf('JAG-2026-%06d', $seq),
        'judul' => 'Drainase Mampet di Sukmajaya',
        'keterangan' => 'Endapan lumpur dan sampah menyumbat gorong-gorong',
        'keparahan' => 'sedang',
        'lintang' => -6.391234,
        'bujur' => 106.845678,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 5.0,
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

test('siklus fisik: alur DITERIMA -> DISURVEI -> TERJADWAL_ANGGARAN -> DIKERJAKAN berjalan sukses (ST-01)', function () {
    $laporan = buatLaporanSiklusFisik([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    // 1. Terima tiket
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/terima")
        ->assertOk();
    expect($laporan->fresh()->status)->toBe('DITERIMA');

    // 2. Selesaikan survei
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/survei", [
            'catatan' => 'Panjang saluran tersumbat sekitar 20 meter',
        ])
        ->assertOk();
    expect($laporan->fresh()->status)->toBe('DISURVEI');

    // 3. Jadwalkan anggaran & tanggal target (FR-TIK-05)
    $targetDate = now()->addDays(25)->toDateString();
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/anggaran", [
            'jenis_pendanaan' => 'APBD_KOTA',
            'tanggal_target' => $targetDate,
            'catatan' => 'Pembersihan dijadwalkan dengan regu pemeliharaan rutin',
        ])
        ->assertOk();

    $laporanAnggaran = $laporan->fresh();
    expect($laporanAnggaran->status)->toBe('TERJADWAL_ANGGARAN');
    expect($laporanAnggaran->jenis_pendanaan)->toBe('APBD_KOTA');
    expect($laporanAnggaran->tanggal_target->toDateString())->toBe($targetDate);

    // 4. Mulai pengerjaan fisik (FR-TIK-06)
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/mulai", [
            'catatan' => 'Armada pengerukan lumpur telah tiba di lokasi',
        ])
        ->assertOk();

    expect($laporan->fresh()->status)->toBe('DIKERJAKAN');
});

test('siklus fisik: revisi tanggal target dibatasi maksimal 2 kali dan pengajuan ke-3 ditolak HTTP 422 (P-16)', function () {
    $targetAwal = now()->addDays(20)->toDateString();

    $laporan = buatLaporanSiklusFisik([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansi->id,
        'kelurahan_id' => $this->kelurahan->id,
        'status' => 'TERJADWAL_ANGGARAN',
        'jenis_pendanaan' => 'APBD_KOTA',
        'tanggal_target' => $targetAwal,
        'tanggal_target_awal' => $targetAwal,
    ]);

    // Revisi 1
    $target1 = now()->addDays(35)->toDateString();
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/revisi-target", [
            'tanggal_target_baru' => $target1,
            'alasan' => 'Hujan lebat menyebabkan debit air tinggi dan menunda pengerukan',
        ])
        ->assertOk();
    expect($laporan->fresh()->tanggal_target->toDateString())->toBe($target1);

    // Revisi 2
    $target2 = now()->addDays(50)->toDateString();
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/revisi-target", [
            'tanggal_target_baru' => $target2,
            'alasan' => 'Ditemukan utilitas kabel yang melintang di dalam gorong-gorong',
        ])
        ->assertOk();
    expect($laporan->fresh()->tanggal_target->toDateString())->toBe($target2);

    // Revisi 3: WAJIB DITOLAK HTTP 422 (P-16)
    $target3 = now()->addDays(65)->toDateString();
    $this->actingAs($this->petugas)
        ->postJson("/instansi/tiket/{$laporan->id}/revisi-target", [
            'tanggal_target_baru' => $target3,
            'alasan' => 'Mencoba meminta perpanjangan ketiga kalinya',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['revisi']);
});

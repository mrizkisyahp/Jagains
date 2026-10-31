<?php

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\Pengalihan;
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
        'nama' => 'Cinere',
        'tingkat' => 'kecamatan',
        'induk_id' => $this->kota->id,
    ]);

    $this->kelurahan = Wilayah::create([
        'kode' => '32.76.01.1001',
        'nama' => 'Cinere',
        'tingkat' => 'kelurahan',
        'induk_id' => $this->kecamatan->id,
    ]);

    $this->instansiA = Instansi::create([
        'nama' => 'Dinas Perhubungan',
        'singkatan' => 'DISHUB',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->instansiB = Instansi::create([
        'nama' => 'Dinas Pekerjaan Umum',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->petugasA = User::create([
        'username' => 'dishub_officer',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansiA->id,
        'status_akun' => 'aktif',
    ]);

    $this->petugasB = User::create([
        'username' => 'dpupr_officer',
        'password' => bcrypt('password123'),
        'email_hash' => null,
        'peran' => 'instansi',
        'instansi_id' => $this->instansiB->id,
        'status_akun' => 'aktif',
    ]);

    $this->warga = User::create([
        'username' => 'warga_pelapor',
        'password' => bcrypt('password123'),
        'email_hash' => hash('sha256', 'warga@gmail.com'),
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'status_akun' => 'aktif',
    ]);

    $this->kategori = Kategori::create([
        'nama' => 'Rambu Rusak',
        'deskripsi' => 'Rambu lalu lintas patah',
        'radius_gabung_m' => 10,
        'aktif' => true,
    ]);
});

function buatTiketTriage(array $attr = []): Laporan
{
    DB::statement("SET jagains.izin_status = 'on'");

    $seq = rand(1000, 99999);
    $default = [
        'nomor_tiket' => sprintf('JAG-2026-%06d', $seq),
        'judul' => 'Rambu Patah di Cinere',
        'keterangan' => 'Rambu stop tertabrak kendaraan dan roboh ke bahu jalan',
        'keparahan' => 'sedang',
        'lintang' => -6.324567,
        'bujur' => 106.781234,
        'lokasi_sumber' => 'gps',
        'akurasi_gps_m' => 8.0,
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

test('triage: aksi terima tiket sukses memicu status DITERIMA dan SLA survei (FR-TIK-03)', function () {
    $laporan = buatTiketTriage([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/terima", [
            'catatan' => 'Diterima, segera disurvei lokasi rambu',
        ])
        ->assertOk()
        ->assertJsonPath('sukses', true);

    $fresh = $laporan->fresh();
    expect($fresh->status)->toBe('DITERIMA');
    expect($fresh->sla_tahap)->toBe('SURVEI');
    expect($fresh->sla_batas)->toBe(5);
});

test('triage: aksi alihkan tiket maksimal 2 kali dan pengalihan ke-3 ditolak HTTP 422 (ST-02)', function () {
    $laporan = buatTiketTriage([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
        'jumlah_pengalihan' => 0,
    ]);

    // Pengalihan 1: Dari Dishub ke DPUPR
    $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/alihkan", [
            'instansi_tujuan_id' => $this->instansiB->id,
            'alasan' => 'Kerusakan rambu disertai trotoar jebol yang perlu ditangani DPUPR',
        ])
        ->assertOk();

    expect($laporan->fresh()->instansi_id)->toBe($this->instansiB->id);
    expect($laporan->fresh()->jumlah_pengalihan)->toBe(1);

    // Pengalihan 2: Dari DPUPR kembali ke Dishub
    $this->actingAs($this->petugasB)
        ->postJson("/instansi/tiket/{$laporan->id}/alihkan", [
            'instansi_tujuan_id' => $this->instansiA->id,
            'alasan' => 'Trotoar telah diperbaiki, penegakan tiang rambu wewenang Dishub',
        ])
        ->assertOk();

    expect($laporan->fresh()->instansi_id)->toBe($this->instansiA->id);
    expect($laporan->fresh()->jumlah_pengalihan)->toBe(2);

    // Pengalihan 3: WAJIB DITOLAK HTTP 422 (ST-02 & P-07)
    $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/alihkan", [
            'instansi_tujuan_id' => $this->instansiB->id,
            'alasan' => 'Mencoba mengalihkan untuk ke-3 kalinya',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['pengalihan']);
});

test('triage: aksi kembalikan ke admin mengubah status PERLU_ROUTING (FR-TIK-03)', function () {
    $laporan = buatTiketTriage([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/kembalikan", [
            'alasan' => 'Objek berada di ruas tol non-kewenangan daerah, mohon disposisi admin',
        ])
        ->assertOk();

    expect($laporan->fresh()->status)->toBe('PERLU_ROUTING');
    expect($laporan->fresh()->instansi_id)->toBeNull();
});

test('triage: usulkan penolakan tiket memicu status USULAN_TOLAK (FR-TIK-13)', function () {
    $laporan = buatTiketTriage([
        'pelapor_id' => $this->warga->id,
        'kategori_id' => $this->kategori->id,
        'instansi_id' => $this->instansiA->id,
        'kelurahan_id' => $this->kelurahan->id,
    ]);

    $this->actingAs($this->petugasA)
        ->postJson("/instansi/tiket/{$laporan->id}/usul-tolak", [
            'alasan_baku' => 'bukan_fasilitas_publik',
            'keterangan' => 'Rambu terletak di dalam area perumahan klaster swasta yang belum diserahkan PSU-nya',
        ])
        ->assertOk();

    expect($laporan->fresh()->status)->toBe('USULAN_TOLAK');
});

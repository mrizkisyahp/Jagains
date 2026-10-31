<?php

use App\Models\Instansi;
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

    $this->instansi = Instansi::create([
        'nama' => 'Dinas PUPR Depok',
        'singkatan' => 'DPUPR',
        'kategori' => 'opd',
        'wilayah_id' => $this->kota->id,
        'aktif' => true,
    ]);

    $this->auditor = User::create([
        'username' => 'auditor_pola',
        'password' => bcrypt('password123'),
        'peran' => 'auditor',
        'status_akun' => 'aktif',
        'email_hash' => null,
    ]);
});

test('auditor dapat mengakses halaman pola pengawasan (FR-AUD-03)', function () {
    $response = $this->actingAs($this->auditor)
        ->get(route('auditor.pola-pengawasan'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('auditor/pola-pengawasan')
        ->has('analitik.ringkasan')
        ->has('analitik.pengalihan')
        ->has('analitik.performa_instansi')
    );
});

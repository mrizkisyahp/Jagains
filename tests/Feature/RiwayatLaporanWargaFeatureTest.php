<?php

use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

uses(DatabaseTransactions::class);

test('warga dapat mengakses halaman riwayat laporan dengan props lengkap', function () {
    $kelurahan = Wilayah::factory()->kelurahan()->create();
    $uniqueId = uniqid();
    $user = User::factory()->create([
        'username' => 'warga_'.$uniqueId,
        'peran' => 'warga',
        'kelurahan_id' => $kelurahan->id,
        'email_hash' => hash('sha256', "warga_{$uniqueId}@gmail.com"),
        'password' => Hash::make('password123'),
    ]);

    $response = $this->actingAs($user)->get(route('warga.riwayat'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('warga/riwayat')
        ->has('laporanList')
        ->has('dukunganList')
        ->has('masterFilter')
    );
});

<?php

use App\Models\Instansi;
use App\Models\Wilayah;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('wilayah seeder mengisi 75 wilayah dengan struktur hierarki kota kecamatan kelurahan yang valid', function () {
    $this->seed(WilayahSeeder::class);

    expect(Wilayah::count())->toBe(75);

    $kota = Wilayah::where('tingkat', 'kota')->get();
    expect($kota)->toHaveCount(1)
        ->and($kota->first()->nama)->toBe('Kota Depok')
        ->and($kota->first()->induk_id)->toBeNull();

    $kecamatan = Wilayah::where('tingkat', 'kecamatan')->get();
    expect($kecamatan)->toHaveCount(11);
    foreach ($kecamatan as $kec) {
        expect($kec->induk_id)->toBe($kota->first()->id);
    }

    $kelurahan = Wilayah::where('tingkat', 'kelurahan')->get();
    expect($kelurahan)->toHaveCount(63);
    $kecamatanIds = $kecamatan->pluck('id')->all();
    foreach ($kelurahan as $kel) {
        expect($kel->induk_id)->toBeIn($kecamatanIds);
    }
});

test('wilayah seeder mematuhi aturan bounding box dan geometri geojson', function () {
    $this->seed(WilayahSeeder::class);

    $semuaWilayah = Wilayah::all();
    foreach ($semuaWilayah as $w) {
        expect($w->min_lintang)->not->toBeNull()
            ->and($w->max_lintang)->not->toBeNull()
            ->and($w->min_bujur)->not->toBeNull()
            ->and($w->max_bujur)->not->toBeNull()
            ->and((float) $w->min_lintang)->toBeLessThanOrEqual((float) $w->max_lintang)
            ->and((float) $w->min_bujur)->toBeLessThanOrEqual((float) $w->max_bujur)
            ->and($w->geometri)->toBeArray()
            ->and($w->geometri)->toHaveKey('type')
            ->and($w->geometri)->toHaveKey('coordinates');
    }
});

test('instansi seeder mengisi 99 instansi dengan relasi wilayah yang valid', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);

    expect(Instansi::count())->toBe(99);

    $instansiDinasKota = Instansi::where('wilayah_id', 1)->get();
    expect($instansiDinasKota)->toHaveCount(25);

    $diskominfo = Instansi::where('singkatan', 'DISKOMINFO')->first();
    expect($diskominfo)->not->toBeNull()
        ->and($diskominfo->wilayah_id)->toBe(1)
        ->and($diskominfo->nama)->toBe('Dinas Komunikasi dan Informatika Kota Depok');

    $semuaInstansi = Instansi::with('wilayah')->get();
    foreach ($semuaInstansi as $inst) {
        expect($inst->wilayah)->not->toBeNull();
    }
});

test('seeder wilayah dan instansi berjalan idempoten tanpa duplikasi', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);

    $countWilayahAwal = Wilayah::count();
    $countInstansiAwal = Instansi::count();

    // Jalankan ulang seeder
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);

    expect(Wilayah::count())->toBe($countWilayahAwal)
        ->and(Instansi::count())->toBe($countInstansiAwal);
});

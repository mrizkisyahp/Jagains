<?php

use App\Models\Instansi;
use App\Models\User;
use Database\Seeders\InstansiSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;

uses(DatabaseTransactions::class);

test('user seeder membuat akun admin, auditor, dan instansi sesuai jumlah instansi', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);
    $this->seed(UserSeeder::class);

    $totalInstansi = Instansi::count();

    expect(User::where('peran', 'admin')->count())->toBe(2)
        ->and(User::where('peran', 'auditor')->count())->toBe(5)
        ->and(User::where('peran', 'instansi')->count())->toBe($totalInstansi);
});

test('semua akun yang dibuat mematuhi aturan integritas database users_peran_kolom_ck', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);
    $this->seed(UserSeeder::class);

    // Admin & Auditor: kelurahan_id, email_hash, dan instansi_id wajib null
    $adminAuditor = User::whereIn('peran', ['admin', 'auditor'])->get();
    foreach ($adminAuditor as $u) {
        expect($u->kelurahan_id)->toBeNull()
            ->and($u->email_hash)->toBeNull()
            ->and($u->instansi_id)->toBeNull();
    }

    // Instansi: instansi_id wajib ada, kelurahan_id dan email_hash wajib null
    $instansiUsers = User::where('peran', 'instansi')->get();
    foreach ($instansiUsers as $u) {
        expect($u->instansi_id)->not->toBeNull()
            ->and($u->kelurahan_id)->toBeNull()
            ->and($u->email_hash)->toBeNull();
    }
});

test('akun seeder dapat diautentikasi dengan kata sandi password123', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);
    $this->seed(UserSeeder::class);

    expect(Auth::attempt(['username' => 'admin1', 'password' => 'password123']))->toBeTrue()
        ->and(Auth::attempt(['username' => 'auditor1', 'password' => 'password123']))->toBeTrue()
        ->and(Auth::attempt(['username' => 'diskominfo', 'password' => 'password123']))->toBeTrue();
});

test('user seeder berjalan idempoten tanpa duplikasi akun', function () {
    $this->seed(WilayahSeeder::class);
    $this->seed(InstansiSeeder::class);
    $this->seed(UserSeeder::class);

    $initialAdmin = User::where('peran', 'admin')->count();
    $initialAuditor = User::where('peran', 'auditor')->count();
    $initialInstansi = User::where('peran', 'instansi')->count();

    // Jalankan ulang UserSeeder
    $this->seed(UserSeeder::class);

    expect(User::where('peran', 'admin')->count())->toBe($initialAdmin)
        ->and(User::where('peran', 'auditor')->count())->toBe($initialAuditor)
        ->and(User::where('peran', 'instansi')->count())->toBe($initialInstansi);
});

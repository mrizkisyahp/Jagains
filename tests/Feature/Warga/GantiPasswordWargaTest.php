<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->kelurahan = Wilayah::factory()->kelurahan()->create(['nama' => 'Kemiri Muka']);
    $uniqueId = uniqid();
    $this->warga = User::factory()->create([
        'username' => 'warga_'.$uniqueId,
        'peran' => 'warga',
        'kelurahan_id' => $this->kelurahan->id,
        'email_hash' => hash('sha256', "warga_{$uniqueId}@gmail.com"),
        'password' => Hash::make('password123'),
    ]);
});

test('warga dapat mengganti kata sandi dengan data yang valid', function () {
    $response = $this->actingAs($this->warga)->put('/warga/password', [
        'current_password' => 'password123',
        'password' => 'PasswordBaru123!',
        'password_confirmation' => 'PasswordBaru123!',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->warga->refresh();
    expect(Hash::check('PasswordBaru123!', $this->warga->password))->toBeTrue();

    // Verifikasi audit log
    $auditLog = AuditLog::where('pelaku_id', $this->warga->id)
        ->where('aksi', 'GANTI_KATA_SANDI')
        ->first();

    expect($auditLog)->not->toBeNull();
    expect($auditLog->objek_id)->toBe($this->warga->id);
});

test('penggantian kata sandi gagal jika kata sandi saat ini salah', function () {
    $response = $this->actingAs($this->warga)->put('/warga/password', [
        'current_password' => 'passwordsalah',
        'password' => 'PasswordBaru123!',
        'password_confirmation' => 'PasswordBaru123!',
    ]);

    $response->assertSessionHasErrors('current_password');

    $this->warga->refresh();
    expect(Hash::check('password123', $this->warga->password))->toBeTrue();
});

test('penggantian kata sandi gagal jika konfirmasi tidak cocok', function () {
    $response = $this->actingAs($this->warga)->put('/warga/password', [
        'current_password' => 'password123',
        'password' => 'PasswordBaru123!',
        'password_confirmation' => 'PasswordTidakCocok!',
    ]);

    $response->assertSessionHasErrors('password');
});

test('penggantian kata sandi gagal jika kata sandi baru kurang dari 8 karakter', function () {
    $response = $this->actingAs($this->warga)->put('/warga/password', [
        'current_password' => 'password123',
        'password' => 'pendek',
        'password_confirmation' => 'pendek',
    ]);

    $response->assertSessionHasErrors('password');
});

test('penggantian kata sandi gagal jika kata sandi baru sama dengan kata sandi lama', function () {
    $response = $this->actingAs($this->warga)->put('/warga/password', [
        'current_password' => 'password123',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertSessionHasErrors('password');
});

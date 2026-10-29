<?php

namespace Database\Factories;

use App\Models\Instansi;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state (default: warga).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username' => strtolower(fake()->unique()->lexify('user??????')),
            'password' => static::$password ??= Hash::make('password123'),
            'email_hash' => hash('sha256', fake()->unique()->safeEmail()),
            'peran' => 'warga',
            'kelurahan_id' => Wilayah::factory()->kelurahan(),
            'kelurahan_diubah_pada' => now(),
            'instansi_id' => null,
            'status_akun' => 'aktif',
            'poin_peringatan' => 0,
            'wajib_ganti_sandi' => false,
            'aktivitas_terakhir_pada' => now(),
        ];
    }

    public function warga(?int $kelurahanId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'peran' => 'warga',
            'kelurahan_id' => $kelurahanId ?? Wilayah::factory()->kelurahan(),
            'email_hash' => $attributes['email_hash'] ?? hash('sha256', fake()->unique()->safeEmail()),
            'instansi_id' => null,
        ]);
    }

    public function instansi(?int $instansiId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'peran' => 'instansi',
            'instansi_id' => $instansiId ?? Instansi::factory(),
            'email_hash' => null,
            'kelurahan_id' => null,
        ]);
    }

    public function auditor(): static
    {
        return $this->state(fn (array $attributes) => [
            'peran' => 'auditor',
            'email_hash' => null,
            'kelurahan_id' => null,
            'instansi_id' => null,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'peran' => 'admin',
            'email_hash' => null,
            'kelurahan_id' => null,
            'instansi_id' => null,
        ]);
    }

    public function wajibGantiSandi(bool $wajib = true): static
    {
        return $this->state(fn (array $attributes) => [
            'wajib_ganti_sandi' => $wajib,
        ]);
    }

    public function dibekukan(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_akun' => 'dibekukan',
        ]);
    }

    public function nonaktif(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_akun' => 'nonaktif',
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Instansi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        // 1. Akun Admin (2 akun)
        $adminUsers = [
            [
                'username' => 'admin1',
                'peran' => 'admin',
                'status_akun' => 'aktif',
                'wajib_ganti_sandi' => false,
                'email_hash' => null,
                'kelurahan_id' => null,
                'instansi_id' => null,
                'password' => $defaultPassword,
                'aktivitas_terakhir_pada' => now(),
            ],
            [
                'username' => 'admin2',
                'peran' => 'admin',
                'status_akun' => 'aktif',
                'wajib_ganti_sandi' => false,
                'email_hash' => null,
                'kelurahan_id' => null,
                'instansi_id' => null,
                'password' => $defaultPassword,
                'aktivitas_terakhir_pada' => now(),
            ],
        ];

        foreach ($adminUsers as $admin) {
            User::updateOrCreate(
                ['username' => $admin['username']],
                $admin
            );
        }

        // 2. Akun Auditor (5 akun)
        for ($i = 1; $i <= 5; $i++) {
            User::updateOrCreate(
                ['username' => "auditor{$i}"],
                [
                    'peran' => 'auditor',
                    'status_akun' => 'aktif',
                    'wajib_ganti_sandi' => false,
                    'email_hash' => null,
                    'kelurahan_id' => null,
                    'instansi_id' => null,
                    'password' => $defaultPassword,
                    'aktivitas_terakhir_pada' => now(),
                ]
            );
        }

        // 3. Akun Instansi (sesuai jumlah instansi di database)
        $daftarInstansi = Instansi::with('wilayah.induk')->orderBy('id')->get();

        foreach ($daftarInstansi as $instansi) {
            $username = $this->buatUsernameInstansi($instansi);

            User::updateOrCreate(
                ['username' => $username],
                [
                    'peran' => 'instansi',
                    'instansi_id' => $instansi->id,
                    'status_akun' => 'aktif',
                    'wajib_ganti_sandi' => false,
                    'email_hash' => null,
                    'kelurahan_id' => null,
                    'password' => $defaultPassword,
                    'aktivitas_terakhir_pada' => now(),
                ]
            );
        }
    }

    /**
     * Membuat username unik, deskriptif, dan <= 30 karakter untuk akun instansi.
     */
    private function buatUsernameInstansi(Instansi $instansi): string
    {
        $singkatan = $instansi->singkatan ?? '';
        $clean = Str::slug($singkatan, '_');

        if ($clean === 'kel_curug') {
            $indukNama = $instansi->wilayah?->induk?->nama ?? '';
            $parentSlug = Str::slug($indukNama, '_');
            $clean = "kel_curug_{$parentSlug}";
        } elseif ($clean === 'kel_pasir_putih') {
            $indukNama = $instansi->wilayah?->induk?->nama ?? '';
            $parentSlug = Str::slug($indukNama, '_');
            $clean = "kel_pasir_putih_{$parentSlug}";
        }

        if (empty($clean)) {
            $clean = 'instansi_'.$instansi->id;
        }

        if (strlen($clean) > 30) {
            $clean = substr($clean, 0, 30);
            $clean = rtrim($clean, '_');
        }

        return strtolower($clean);
    }
}

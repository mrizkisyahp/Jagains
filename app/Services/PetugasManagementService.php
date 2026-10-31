<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PetugasManagementService
{
    /**
     * Membuat akun petugas baru dengan kata sandi acak sekali tampil (FR-ADM-04).
     *
     * @return array{user: User, sandiBaru: string}
     */
    public function buatPetugas(User $admin, array $data): array
    {
        $sandiAcak = Str::random(12);

        $user = DB::transaction(function () use ($admin, $data, $sandiAcak) {
            $isInstansi = $data['peran'] === 'instansi';

            $user = User::create([
                'username' => $data['username'],
                'password' => Hash::make($sandiAcak),
                'peran' => $data['peran'],
                'instansi_id' => $isInstansi ? $data['instansi_id'] : null,
                'kelurahan_id' => null,
                'email_hash' => null,
                'status_akun' => 'aktif',
                'poin_peringatan' => 0,
                'wajib_ganti_sandi' => true,
            ]);

            AuditLogService::catat(
                aksi: 'BUAT_AKUN_PETUGAS',
                objekTipe: 'users',
                objekId: $user->id,
                nilaiLama: null,
                nilaiBaru: [
                    'username' => $user->username,
                    'peran' => $user->peran,
                    'instansi_id' => $user->instansi_id,
                ],
                alasan: 'Pembuatan akun staf operasional oleh admin',
                pelakuId: $admin->id
            );

            return $user;
        });

        return [
            'user' => $user,
            'sandiBaru' => $sandiAcak,
        ];
    }

    /**
     * Mereset kata sandi petugas menjadi kata sandi acak baru.
     */
    public function resetSandi(User $admin, User $target): string
    {
        $sandiAcak = Str::random(12);

        DB::transaction(function () use ($admin, $target, $sandiAcak) {
            $target->update([
                'password' => Hash::make($sandiAcak),
                'wajib_ganti_sandi' => true,
            ]);

            AuditLogService::catat(
                aksi: 'RESET_SANDI_PETUGAS',
                objekTipe: 'users',
                objekId: $target->id,
                nilaiLama: null,
                nilaiBaru: [
                    'wajib_ganti_sandi' => true,
                ],
                alasan: 'Reset kata sandi staf oleh admin',
                pelakuId: $admin->id
            );
        });

        return $sandiAcak;
    }

    /**
     * Mengubah status aktif / nonaktif akun petugas.
     */
    public function toggleStatus(User $admin, User $target): User
    {
        return DB::transaction(function () use ($admin, $target) {
            $statusLama = $target->status_akun;
            $statusBaru = $statusLama === 'aktif' ? 'nonaktif' : 'aktif';

            $target->update([
                'status_akun' => $statusBaru,
            ]);

            AuditLogService::catat(
                aksi: 'UBAH_STATUS_PETUGAS',
                objekTipe: 'users',
                objekId: $target->id,
                nilaiLama: ['status_akun' => $statusLama],
                nilaiBaru: ['status_akun' => $statusBaru],
                alasan: "Pengubahan status akun staf menjadi {$statusBaru}",
                pelakuId: $admin->id
            );

            return $target->fresh();
        });
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GantiSandiPertamaRequest;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class GantiSandiPertamaController extends Controller
{
    /**
     * Menampilkan form ganti sandi wajib login pertama.
     */
    public function tampilkanForm(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user->wajib_ganti_sandi) {
            return $this->redirectSesuaiPeran($user);
        }

        return Inertia::render('auth/first-time-password', [
            'username' => $user->username,
            'peran' => $user->peran,
        ]);
    }

    /**
     * Memproses penggantian sandi awal menjadi sandi baru.
     */
    public function simpanSandiBaru(GantiSandiPertamaRequest $request): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $request) {
            $user->update([
                'password' => Hash::make($request->input('new_password')),
                'wajib_ganti_sandi' => false,
            ]);

            // Catat ke audit log (NFR-INT-01 / FR-AKN-05)
            AuditLog::create([
                'pelaku_id' => $user->id,
                'aksi' => 'GANTI_SANDI_PERTAMA',
                'objek_tipe' => 'User',
                'objek_id' => $user->id,
                'alasan' => 'Penggantian kata sandi acak awal saat login pertama.',
                'waktu' => now(),
            ]);
        });

        return $this->redirectSesuaiPeran($user)->with('success', 'Kata sandi akun Anda berhasil diperbarui. Akses fitur telah dibuka.');
    }

    private function redirectSesuaiPeran($user): RedirectResponse
    {
        return match ($user->peran) {
            'instansi' => redirect()->intended('/instansi/antrean'),
            'auditor' => redirect()->intended('/auditor/antrean'),
            'admin' => redirect()->intended('/admin/antrean-routing'),
            default => redirect()->intended('/'),
        };
    }
}

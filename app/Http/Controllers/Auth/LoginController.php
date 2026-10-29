<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Menampilkan form login.
     */
    public function tampilkanFormLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectSesuaiPeran(Auth::user());
        }

        return Inertia::render('login');
    }

    /**
     * Memproses otentikasi akun pengguna.
     */
    public function masuk(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $username = strtolower(trim($request->input('username')));
        $password = (string) $request->input('password');

        $user = User::whereRaw('lower(username) = ?', [$username])->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            $request->hitRateLimiter();

            throw ValidationException::withMessages([
                'username' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
            ]);
        }

        // Periksa status akun
        if ($user->status_akun === 'dibekukan') {
            $request->hitRateLimiter();

            throw ValidationException::withMessages([
                'username' => 'Akun Anda sedang dibekukan karena pelanggaran ketentuan moderasi.',
            ]);
        }

        if ($user->status_akun === 'nonaktif') {
            $request->hitRateLimiter();

            throw ValidationException::withMessages([
                'username' => 'Akun ini telah dinonaktifkan oleh Administrator.',
            ]);
        }

        // Buat sesi login
        Auth::login($user);
        $request->session()->regenerate();
        $request->clearRateLimiter();

        // Catat aktivitas terakhir untuk perhitungan akun aktif 90 hari
        $user->update([
            'aktivitas_terakhir_pada' => now(),
        ]);

        // Jika petugas baru wajib ganti sandi awal (FR-AKN-05)
        if ($user->wajib_ganti_sandi) {
            return redirect()->route('auth.first-time-password');
        }

        return $this->redirectSesuaiPeran($user);
    }

    /**
     * Mengeluarkan pengguna dan membersihkan sesi.
     */
    public function keluar(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    private function redirectSesuaiPeran(User $user): RedirectResponse
    {
        return match ($user->peran) {
            'instansi' => redirect()->intended('/instansi/antrean'),
            'auditor' => redirect()->intended('/auditor/antrean'),
            'admin' => redirect()->intended('/admin/antrean-routing'),
            default => redirect()->intended('/warga/profil'),
        };
    }
}

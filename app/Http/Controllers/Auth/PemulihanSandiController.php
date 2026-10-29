<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KirimPemulihanSandiRequest;
use App\Http\Requests\Auth\ResetSandiRequest;
use App\Mail\PemulihanKataSandi;
use App\Models\User;
use App\Services\EmailPrivacyService;
use App\Services\TokenSekaliPakaiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class PemulihanSandiController extends Controller
{
    public function __construct(
        private EmailPrivacyService $privacyService,
        private TokenSekaliPakaiService $tokenService
    ) {}

    /**
     * Menampilkan form lupa kata sandi.
     */
    public function tampilkanFormLupaSandi(): Response
    {
        return Inertia::render('auth/forgot-password');
    }

    /**
     * Mengirimkan tautan reset kata sandi ke email warga jika terdaftar.
     * Respon selalu identik untuk mencegah account enumeration (FR-AKN-03).
     */
    public function kirimTautanPemulihan(KirimPemulihanSandiRequest $request): RedirectResponse
    {
        $email = $request->input('email');
        $hash = $this->privacyService->computeHash($email);

        $user = User::where('email_hash', $hash)
            ->where('peran', 'warga')
            ->where('status_akun', 'aktif')
            ->first();

        if ($user) {
            $tokenData = $this->tokenService->createToken('pemulihan', $user->id, 30);

            $resetUrl = URL::temporarySignedRoute(
                'password.reset',
                now()->addMinutes(30),
                ['token' => $tokenData['plain_token']]
            );

            // Alamat email dipakai untuk mengirim lalu langsung dibuang tanpa disimpan (NFR-PRV-01)
            Mail::to($email)->send(new PemulihanKataSandi($resetUrl));
        }

        return back()->with('status', 'Jika alamat email terdaftar dalam sistem, tautan pemulihan kata sandi telah dikirimkan.');
    }

    /**
     * Menampilkan form pengisian kata sandi baru dari tautan token.
     */
    public function tampilkanFormReset(Request $request, string $token): Response|RedirectResponse
    {
        $validToken = $this->tokenService->findValidToken($token, 'pemulihan');

        if (! $validToken) {
            return Inertia::render('auth/forgot-password', [
                'tokenError' => 'Tautan pemulihan kata sandi ini tidak valid, sudah pernah digunakan, atau telah kedaluwarsa. Silakan ajukan permintaan pemulihan baru.',
            ]);
        }

        return Inertia::render('auth/reset-password', [
            'token' => $token,
        ]);
    }

    /**
     * Memproses pengaturan ulang kata sandi dengan token sekali pakai.
     */
    public function simpanSandiBaru(ResetSandiRequest $request): RedirectResponse
    {
        $token = $this->tokenService->verifyAndConsume($request->input('token'), 'pemulihan');

        if (! $token || ! $token->pengguna_id) {
            return back()->withErrors(['token' => 'Tautan pemulihan kata sandi tidak valid, sudah pernah digunakan, atau telah kedaluwarsa.']);
        }

        $user = User::find($token->pengguna_id);

        if (! $user) {
            return redirect()->route('login')->withErrors(['username' => 'Akun pengguna tidak ditemukan.']);
        }

        DB::transaction(function () use ($user, $request) {
            $user->update([
                'password' => Hash::make($request->input('password')),
            ]);
        });

        return redirect()->route('login')->with('success', 'Kata sandi berhasil diatur ulang! Silakan masuk dengan kata sandi baru Anda.');
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KirimVerifikasiEmailRequest;
use App\Http\Requests\Auth\SelesaiPendaftaranWargaRequest;
use App\Mail\VerifikasiEmailPendaftaran;
use App\Models\User;
use App\Services\EmailPrivacyService;
use App\Services\TokenSekaliPakaiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class PendaftaranWargaController extends Controller
{
    public function __construct(
        private EmailPrivacyService $privacyService,
        private TokenSekaliPakaiService $tokenService
    ) {}

    /**
     * Menampilkan form pendaftaran tahap 1 (input email).
     */
    public function tampilkanFormEmail(): Response
    {
        return Inertia::render('auth/register-email');
    }

    /**
     * Mengirimkan tautan verifikasi bertanda tangan ke email calon warga.
     */
    public function kirimVerifikasiEmail(KirimVerifikasiEmailRequest $request): RedirectResponse
    {
        $email = $request->input('email');

        // Buat token sekali pakai dengan masa berlaku 30 menit (P-20)
        $tokenData = $this->tokenService->createToken('daftar', null, 30);
        $encryptedPayload = Crypt::encryptString($email);

        $verificationUrl = URL::temporarySignedRoute(
            'daftar.verifikasi',
            now()->addMinutes(30),
            [
                'token' => $tokenData['plain_token'],
                'data' => $encryptedPayload,
            ]
        );

        // Kirim email (email tidak disimpan di DB atau log, hanya digunakan saat transmisi)
        Mail::to($email)->send(new VerifikasiEmailPendaftaran($verificationUrl));

        return back()->with('status', 'Tautan verifikasi pendaftaran telah dikirim ke email Anda. Silakan buka kotak masuk atau spam (berlaku 30 menit).');
    }

    /**
     * Membuka tautan verifikasi email dan menampilkan form kelengkapan akun warga (Tahap 2).
     */
    public function verifikasiTautan(Request $request, string $token): Response|RedirectResponse
    {
        $payload = $request->query('data');

        if (! $payload) {
            return redirect()->route('daftar.index')->withErrors(['email' => 'Tautan verifikasi tidak lengkap.']);
        }

        // Periksa apakah token ada, belum kedaluwarsa, dan belum dipakai
        $validToken = $this->tokenService->findValidToken($token, 'daftar');

        if (! $validToken) {
            return Inertia::render('auth/register-email', [
                'tokenError' => 'Tautan verifikasi ini tidak valid, sudah pernah digunakan, atau telah kedaluwarsa (lebih dari 30 menit). Silakan masukkan email Anda untuk menerima tautan baru.',
            ]);
        }

        try {
            $decryptedEmail = Crypt::decryptString($payload);
        } catch (\Exception $e) {
            return redirect()->route('daftar.index')->withErrors(['email' => 'Tautan verifikasi rusak atau tidak sah.']);
        }

        return Inertia::render('auth/register-complete', [
            'token' => $token,
            'payload' => $payload,
            'emailMasked' => $this->maskEmail($decryptedEmail),
        ]);
    }

    /**
     * Menyimpan akun warga baru dan mengonsumsi token sekali pakai secara atomik.
     */
    public function selesaiPendaftaran(SelesaiPendaftaranWargaRequest $request): RedirectResponse
    {
        try {
            $email = Crypt::decryptString($request->input('payload'));
        } catch (\Exception $e) {
            return back()->withErrors(['token' => 'Tautan pendaftaran tidak valid atau telah dirusak.']);
        }

        // Konsumsi token sekali pakai secara atomik
        $token = $this->tokenService->verifyAndConsume($request->input('token'), 'daftar');

        if (! $token) {
            return back()->withErrors(['token' => 'Tautan verifikasi tidak valid, sudah pernah digunakan, atau telah kedaluwarsa.']);
        }

        $emailHash = $this->privacyService->computeHash($email);

        // Cek duplikasi hash
        if (User::where('email_hash', $emailHash)->exists()) {
            return redirect()->route('login')->withErrors(['username' => 'Akun dengan email ini sudah terdaftar. Silakan masuk.']);
        }

        DB::transaction(function () use ($request, $emailHash) {
            User::create([
                'username' => strtolower($request->input('username')),
                'password' => Hash::make($request->input('password')),
                'email_hash' => $emailHash,
                'peran' => 'warga',
                'kelurahan_id' => $request->input('kelurahan_id'),
                'kelurahan_diubah_pada' => now(),
                'instansi_id' => null,
                'status_akun' => 'aktif',
                'poin_peringatan' => 0,
                'wajib_ganti_sandi' => false,
                'aktivitas_terakhir_pada' => now(),
            ]);
        });

        return redirect()->route('login')->with('success', 'Pendaftaran akun warga berhasil! Silakan masuk dengan username dan kata sandi Anda.');
    }

    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1] ?? '';

        $len = strlen($name);
        if ($len <= 2) {
            $maskedName = substr($name, 0, 1).'*';
        } else {
            $maskedName = substr($name, 0, 2).str_repeat('*', $len - 3).substr($name, -1);
        }

        return $maskedName.'@'.$domain;
    }
}

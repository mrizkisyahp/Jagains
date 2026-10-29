<?php

namespace Tests\Feature\Auth;

use App\Mail\VerifikasiEmailPendaftaran;
use App\Models\TokenSekaliPakai;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\EmailPrivacyService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PendaftaranWargaTest extends TestCase
{
    use DatabaseTransactions;

    public function test_pendaftaran_menolak_email_go_id()
    {
        $response = $this->post('/daftar/kirim-verifikasi', [
            'email' => 'asn@depok.go.id',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertStringContainsString('go.id', session('errors')->first('email'));
    }

    public function test_pendaftaran_menolak_variasi_titik_dan_plus_gmail_jika_sudah_terdaftar()
    {
        $privacy = app(EmailPrivacyService::class);
        $hash = $privacy->computeHash('wargadepok@gmail.com');

        $kelurahan = Wilayah::factory()->kelurahan()->create();
        User::factory()->create([
            'username' => 'wargapertama',
            'email_hash' => $hash,
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
        ]);

        // Kirim dengan titik dan tag plus
        $response = $this->post('/daftar/kirim-verifikasi', [
            'email' => 'warga.depok+lapor@gmail.com',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertStringContainsString('sudah', session('errors')->first('email'));
    }

    public function test_berhasil_mengirim_tautan_verifikasi_email()
    {
        Mail::fake();

        $response = $this->post('/daftar/kirim-verifikasi', [
            'email' => 'calonwarga@gmail.com',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');

        Mail::assertSent(VerifikasiEmailPendaftaran::class, function ($mail) {
            return $mail->hasTo('calonwarga@gmail.com');
        });

        // Verifikasi token dibuat di tabel token_sekali_pakai
        $tokenRecord = TokenSekaliPakai::where('jenis', 'daftar')->latest('id')->first();
        $this->assertNotNull($tokenRecord);
        $this->assertNull($tokenRecord->pengguna_id);
        $this->assertNull($tokenRecord->dipakai_pada);
    }

    public function test_tautan_verifikasi_hanya_bisa_dipakai_sekali_dan_mencegah_replay_attack()
    {
        Mail::fake();
        $kelurahan = Wilayah::factory()->kelurahan()->create();

        // 1. Kirim email
        $this->post('/daftar/kirim-verifikasi', ['email' => 'wargabaru@gmail.com']);

        $tokenRecord = TokenSekaliPakai::where('jenis', 'daftar')->latest('id')->first();
        $this->assertNotNull($tokenRecord);

        // Simulasi plain token
        $plainToken = 'plain-token-secret-for-test-12345';
        $tokenRecord->update([
            'penanda_hash' => hash('sha256', $plainToken),
        ]);

        $payload = Crypt::encryptString('wargabaru@gmail.com');

        // 2. Aktivasi pertama berhasil
        $res1 = $this->post('/daftar/selesai', [
            'token' => $plainToken,
            'payload' => $payload,
            'username' => 'wargabaru',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'kelurahan_id' => $kelurahan->id,
        ]);

        $res1->assertRedirect('/login');
        $res1->assertSessionHas('success');

        // Cek data user tersimpan
        $user = User::where('username', 'wargabaru')->first();
        $this->assertNotNull($user);
        $this->assertEquals('warga', $user->peran);
        $this->assertEquals($kelurahan->id, $user->kelurahan_id);
        $this->assertEquals('aktif', $user->status_akun);
        $this->assertFalse($user->wajib_ganti_sandi);

        // NFR-PRV-01: Tidak ada email asli di database
        $privacy = app(EmailPrivacyService::class);
        $this->assertEquals($privacy->computeHash('wargabaru@gmail.com'), $user->email_hash);

        // 3. Replay attack: penggunaan token yang sama harus ditolak
        $res2 = $this->post('/daftar/selesai', [
            'token' => $plainToken,
            'payload' => $payload,
            'username' => 'wargakedua',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'kelurahan_id' => $kelurahan->id,
        ]);

        $res2->assertSessionHasErrors('token');
    }
}

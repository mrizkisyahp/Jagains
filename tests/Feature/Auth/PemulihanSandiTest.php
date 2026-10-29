<?php

namespace Tests\Feature\Auth;

use App\Mail\PemulihanKataSandi;
use App\Models\TokenSekaliPakai;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\EmailPrivacyService;
use App\Services\TokenSekaliPakaiService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PemulihanSandiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_permintaan_pemulihan_sandi_selalu_menghasilkan_respon_identik()
    {
        Mail::fake();

        // 1. Email tidak terdaftar
        $res1 = $this->post('/lupa-sandi', ['email' => 'tidakterdaftar@gmail.com']);
        $res1->assertRedirect();
        $res1->assertSessionHas('status', 'Jika alamat email terdaftar dalam sistem, tautan pemulihan kata sandi telah dikirimkan.');
        Mail::assertNothingSent();

        // 2. Email terdaftar
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $privacy = app(EmailPrivacyService::class);
        $user = User::factory()->create([
            'username' => 'wargalupa',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => $privacy->computeHash('wargalupa@gmail.com'),
        ]);

        $res2 = $this->post('/lupa-sandi', ['email' => 'wargalupa@gmail.com']);
        $res2->assertRedirect();
        $res2->assertSessionHas('status', 'Jika alamat email terdaftar dalam sistem, tautan pemulihan kata sandi telah dikirimkan.');
        Mail::assertSent(PemulihanKataSandi::class);

        // Verifikasi token pemulihan tercatat di database
        $token = TokenSekaliPakai::where('jenis', 'pemulihan')
            ->where('pengguna_id', $user->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($token);
        $this->assertNull($token->dipakai_pada);
    }

    public function test_reset_sandi_berhasil_dan_token_tidak_bisa_dipakai_ulang()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $user = User::factory()->create([
            'username' => 'wargareset',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'reset@gmail.com'),
            'password' => bcrypt('OldPassword123'),
        ]);

        $tokenService = app(TokenSekaliPakaiService::class);
        $tokenData = $tokenService->createToken('pemulihan', $user->id, 30);
        $plainToken = $tokenData['plain_token'];

        $response = $this->post('/reset-sandi', [
            'token' => $plainToken,
            'password' => 'NewSecurePass456!',
            'password_confirmation' => 'NewSecurePass456!',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHas('success');

        $user->refresh();
        $this->assertTrue(Hash::check('NewSecurePass456!', $user->password));

        // Coba pakai ulang token yang sama (Replay attack)
        $replayResponse = $this->post('/reset-sandi', [
            'token' => $plainToken,
            'password' => 'AnotherPassword789!',
            'password_confirmation' => 'AnotherPassword789!',
        ]);

        $replayResponse->assertSessionHasErrors('token');
    }
}

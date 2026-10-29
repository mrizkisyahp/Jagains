<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LoginDanSesiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_login_menampilkan_pesan_identik_untuk_username_dan_password_salah()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        User::factory()->create([
            'username' => 'wargaaktif',
            'password' => bcrypt('password123'),
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'warga@gmail.com'),
        ]);

        // Username salah
        $res1 = $this->post('/login', [
            'username' => 'wargatidakterdaftar',
            'password' => 'password123',
        ]);
        $res1->assertSessionHasErrors('username');
        $this->assertEquals('Kredensial yang diberikan tidak cocok dengan data kami.', session('errors')->first('username'));

        // Password salah
        $res2 = $this->post('/login', [
            'username' => 'wargaaktif',
            'password' => 'passwordsalah',
        ]);
        $res2->assertSessionHasErrors('username');
        $this->assertEquals('Kredensial yang diberikan tidak cocok dengan data kami.', session('errors')->first('username'));
    }

    public function test_login_dibatasi_laju_5_kali_per_15_menit()
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'username' => 'spammer',
                'password' => 'wrongpass',
            ]);
        }

        // Percobaan ke-6 harus ditolak karena rate limit
        $response = $this->post('/login', [
            'username' => 'spammer',
            'password' => 'wrongpass',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertStringContainsString('Terlalu banyak percobaan masuk', session('errors')->first('username'));
    }

    public function test_login_menolak_akun_dibekukan()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        User::factory()->create([
            'username' => 'wargabeku',
            'password' => bcrypt('password123'),
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'beku@gmail.com'),
            'status_akun' => 'dibekukan',
        ]);

        $response = $this->post('/login', [
            'username' => 'wargabeku',
            'password' => 'password123',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertStringContainsString('dibekukan', session('errors')->first('username'));
        $this->assertGuest();
    }

    public function test_login_berhasil_dan_redirect_sesuai_peran()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $warga = User::factory()->create([
            'username' => 'wargasukses',
            'password' => bcrypt('password123'),
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'sukses@gmail.com'),
        ]);

        $response = $this->post('/login', [
            'username' => 'wargasukses',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/warga/profil');
        $this->assertAuthenticatedAs($warga);

        $warga->refresh();
        $this->assertNotNull($warga->aktivitas_terakhir_pada);
    }

    public function test_logout_membersihkan_sesi()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $warga = User::factory()->create([
            'username' => 'wargalogout',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'logout@gmail.com'),
        ]);

        $response = $this->actingAs($warga)->post('/logout');
        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_akses_langsung_rute_peran_lain_ditolak_dengan_http_403()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $warga = User::factory()->create([
            'username' => 'wargabiasa',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'biasa@gmail.com'),
        ]);

        // Warga coba buka halaman auditor
        $response = $this->actingAs($warga)->get('/auditor/antrean');
        $response->assertStatus(403);
    }
}

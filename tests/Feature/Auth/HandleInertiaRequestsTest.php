<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_inertia_requests_share_sanitized_user_data_and_flash_messages()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create(['nama' => 'Kemiri Muka']);
        $user = User::factory()->create([
            'username' => 'wargaaktif',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'warga@gmail.com'),
        ]);

        $response = $this->actingAs($user)
            ->withSession(['flash' => ['success' => 'Operasi berhasil!']])
            ->get('/warga/profil');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('auth.user', fn (AssertableInertia $userProp) => $userProp
                ->where('username', 'wargaaktif')
                ->where('peran', 'warga')
                ->where('kelurahan_id', $kelurahan->id)
                ->missing('password')
                ->missing('email_hash')
                ->etc()
            )
        );
    }
}

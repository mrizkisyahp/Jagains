<?php

namespace Tests\Unit\Services;

use App\Services\TokenSekaliPakaiService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class TokenSekaliPakaiServiceTest extends TestCase
{
    use DatabaseTransactions;

    private TokenSekaliPakaiService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TokenSekaliPakaiService::class);
    }

    public function test_it_creates_valid_one_time_token()
    {
        $result = $this->service->createToken('daftar', null, 30);

        $this->assertArrayHasKey('plain_token', $result);
        $this->assertArrayHasKey('penanda_hash', $result);
        $this->assertArrayHasKey('model', $result);

        $this->assertEquals(64, strlen($result['plain_token']));
        $this->assertEquals(hash('sha256', $result['plain_token']), $result['penanda_hash']);
        $this->assertEquals('daftar', $result['model']->jenis);
        $this->assertNull($result['model']->pengguna_id);
        $this->assertNull($result['model']->dipakai_pada);
        $this->assertTrue($result['model']->kedaluwarsa->isFuture());
    }

    public function test_it_verifies_and_consumes_token_atomically()
    {
        $result = $this->service->createToken('daftar', null, 30);
        $plainToken = $result['plain_token'];

        // First consumption succeeds
        $consumed = $this->service->verifyAndConsume($plainToken, 'daftar');
        $this->assertNotNull($consumed);
        $this->assertNotNull($consumed->dipakai_pada);

        // Replay attempt fails
        $replay = $this->service->verifyAndConsume($plainToken, 'daftar');
        $this->assertNull($replay);
    }

    public function test_it_rejects_expired_token()
    {
        $result = $this->service->createToken('daftar', null, -1);
        $plainToken = $result['plain_token'];

        $consumed = $this->service->verifyAndConsume($plainToken, 'daftar');
        $this->assertNull($consumed);
    }
}

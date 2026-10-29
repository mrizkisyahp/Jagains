<?php

namespace Tests\Unit\Services;

use App\Services\EmailPrivacyService;
use Tests\TestCase;

class EmailPrivacyServiceTest extends TestCase
{
    private EmailPrivacyService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EmailPrivacyService('test-secret-key-12345');
    }

    public function test_it_identifies_government_domain()
    {
        $this->assertTrue($this->service->isGovernmentDomain('pejabat@depok.go.id'));
        $this->assertTrue($this->service->isGovernmentDomain('user@jabarprov.go.id'));
        $this->assertFalse($this->service->isGovernmentDomain('warga@gmail.com'));
        $this->assertFalse($this->service->isGovernmentDomain('warga@yahoo.co.id'));
    }

    public function test_it_normalizes_email_correctly()
    {
        // Lowercase
        $this->assertEquals('user@example.com', $this->service->normalizeEmail('USER@EXAMPLE.COM'));

        // Plus tags removed
        $this->assertEquals('user@gmail.com', $this->service->normalizeEmail('user+tag123@gmail.com'));
        $this->assertEquals('warga@yahoo.com', $this->service->normalizeEmail('warga+laporan@yahoo.com'));

        // Dots in Gmail localpart ignored
        $this->assertEquals('johndoe@gmail.com', $this->service->normalizeEmail('john.doe@gmail.com'));
        $this->assertEquals('johndoe@googlemail.com', $this->service->normalizeEmail('j.o.h.n.d.o.e+extra@googlemail.com'));

        // Dots in non-Gmail preserved
        $this->assertEquals('john.doe@yahoo.com', $this->service->normalizeEmail('john.doe@yahoo.com'));
    }

    public function test_it_computes_consistent_hmac_hash()
    {
        $hash1 = $this->service->computeHash('John.Doe+Lapor@gmail.com');
        $hash2 = $this->service->computeHash('johndoe@gmail.com');

        $this->assertEquals($hash1, $hash2);
        $this->assertEquals(64, strlen($hash1));
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $hash1);
    }
}

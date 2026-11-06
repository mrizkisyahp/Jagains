<?php

namespace Tests;

use App\Services\FotoLaporanService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        try {
            DB::statement('RESET jagains.izin_status');
        } catch (\Throwable) {
            // Abaikan jika koneksi database belum dibuka pada unit test murni
        }

        FotoLaporanService::setGdCapabilityChecker(null);

        try {
            parent::tearDown();
        } finally {
            FotoLaporanService::setGdCapabilityChecker(null);

            try {
                DB::statement('RESET jagains.izin_status');
            } catch (\Throwable) {
                // Abaikan jika koneksi database telah ditutup
            }
        }
    }
}

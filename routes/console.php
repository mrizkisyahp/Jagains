<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwal berkas otomasi idempoten kuorum verifikasi 14 hari (FR-VER-05, BR-SLA-07)
Schedule::command('jagains:cek-kuorum-verifikasi')->everyFiveMinutes();

// Jadwal berkas otomasi eskalasi pelanggaran SLA ke Auditor Independen (FR-ESK-01, BR-SLA-02, BR-SLA-05)
Schedule::command('jagains:cek-eskalasi-sla')->everyFiveMinutes();

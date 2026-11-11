<?php

use App\Models\Lampiran;

it('serializes attachment URLs using the configured public storage host', function () {
    config()->set('filesystems.disks.public.url', 'https://photos.example.com');
    $lampiran = new Lampiran(['path' => 'lampiran/2026/11/report.jpg']);

    expect($lampiran->toArray()['url'] ?? null)->toBe('https://photos.example.com/lampiran/2026/11/report.jpg');
});

it('keeps local development attachment URLs working', function () {
    config()->set('filesystems.disks.public.url', 'http://localhost:8000/storage');
    $lampiran = new Lampiran(['path' => 'lampiran/report.jpg']);

    expect($lampiran->url)->toBe('http://localhost:8000/storage/lampiran/report.jpg');
});

it('preserves existing absolute attachment URLs', function () {
    $lampiran = new Lampiran(['path' => 'https://photos.example.com/report.jpg']);

    expect($lampiran->url)->toBe('https://photos.example.com/report.jpg');
});

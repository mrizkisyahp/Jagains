<?php

namespace App\Console\Commands;

use App\Services\VerifikasiWargaService;
use Illuminate\Console\Command;

class CekBatasWaktuVerifikasiCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jagains:cek-kuorum-verifikasi';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memeriksa tiket verifikasi yang melewati 14 hari kalender tanpa kuorum dan mengalihkannya ke Auditor (FR-VER-05, ST-05)';

    /**
     * Execute the console command.
     */
    public function handle(VerifikasiWargaService $service): int
    {
        $this->info('Memeriksa tiket yang melewati batas 14 hari verifikasi warga...');

        $diproses = $service->prosesBatasWaktu14Hari();

        $this->info("Pemeriksaan selesai. Sebanyak {$diproses} tiket dialihkan ke meja Auditor (TANPA_KUORUM).");

        return Command::SUCCESS;
    }
}

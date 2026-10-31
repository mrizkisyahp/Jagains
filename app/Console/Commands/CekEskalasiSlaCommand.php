<?php

namespace App\Console\Commands;

use App\Services\AuditorService;
use Illuminate\Console\Command;

class CekEskalasiSlaCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jagains:cek-eskalasi-sla';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memeriksa tiket yang melewati batas waktu SLA dan membuat eskalasi otomatis ke meja Auditor Independen (FR-ESK-01, BR-SLA-02, BR-SLA-05)';

    /**
     * Execute the console command.
     */
    public function handle(AuditorService $service): int
    {
        $this->info('Memeriksa tiket yang melewati batas waktu SLA...');

        $diproses = $service->prosesEskalasiSlaOtomatis();

        $this->info("Pemeriksaan selesai. Sebanyak {$diproses} tiket dieskalasi ke meja Auditor (SLA).");

        return Command::SUCCESS;
    }
}

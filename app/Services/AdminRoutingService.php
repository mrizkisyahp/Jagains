<?php

namespace App\Services;

use App\Models\HariLibur;
use App\Models\Instansi;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminRoutingService
{
    /**
     * Melakukan disposisi manual tiket dari PERLU_ROUTING ke DITERUSKAN (FR-ADM-05).
     */
    public function disposisiManual(User $admin, Laporan $laporan, int $instansiId, string $catatan): Laporan
    {
        if ($laporan->status !== 'PERLU_ROUTING') {
            throw ValidationException::withMessages([
                'status' => ['Tiket ini tidak berada dalam status PERLU_ROUTING.'],
            ]);
        }

        $instansi = Instansi::findOrFail($instansiId);
        if (! $instansi->aktif) {
            throw ValidationException::withMessages([
                'instansi_id' => ['Instansi tujuan yang dipilih sedang tidak aktif.'],
            ]);
        }

        return DB::transaction(function () use ($admin, $laporan, $instansi, $catatan) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $statusLama = $laporan->status;
            $instansiLama = $laporan->instansi_id;

            // Buat riwayat status T-02
            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-02',
                'status_lama' => $statusLama,
                'status_baru' => 'DITERUSKAN',
                'pelaku_id' => $admin->id,
                'instansi_id' => $instansi->id,
                'catatan' => $catatan,
                'waktu' => now(),
            ]);

            // Hitung jatuh tempo SLA respons (3 hari kerja)
            $jatuhTempo = $this->hitungJatuhTempoHariKerja(now(), 3)->toDateString();

            // Mutasi status laporan
            $laporan->update([
                'status' => 'DITERUSKAN',
                'instansi_id' => $instansi->id,
                'diteruskan_pertama_pada' => $laporan->diteruskan_pertama_pada ?? now(),
                'sla_tahap' => 'RESPONS',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => 3,
                'sla_satuan' => 'hari_kerja',
                'sla_jatuh_tempo' => $jatuhTempo,
            ]);

            // Catat ke Audit Log
            AuditLogService::catat(
                aksi: 'DISPOSISI_ROUTING_MANUAL',
                objekTipe: 'laporan',
                objekId: $laporan->id,
                nilaiLama: [
                    'status' => $statusLama,
                    'instansi_id' => $instansiLama,
                ],
                nilaiBaru: [
                    'status' => 'DITERUSKAN',
                    'instansi_id' => $instansi->id,
                    'instansi_nama' => $instansi->nama,
                ],
                alasan: $catatan,
                laporanId: $laporan->id,
                pelakuId: $admin->id
            );

            return $laporan->fresh(['instansi', 'kelurahan', 'kategori']);
        });
    }

    /**
     * Menghitung tanggal jatuh tempo melompati akhir pekan dan hari libur nasional.
     */
    protected function hitungJatuhTempoHariKerja(CarbonInterface $mulai, int $targetHariKerja): CarbonInterface
    {
        $current = $mulai->copy();
        $hariDitambahkan = 0;

        $daftarHariLibur = HariLibur::pluck('tanggal')
            ->map(fn ($t) => (string) $t)
            ->flip()
            ->all();

        while ($hariDitambahkan < $targetHariKerja) {
            $current = $current->addDay();
            if ($current->isWeekend()) {
                continue;
            }
            if (isset($daftarHariLibur[$current->toDateString()])) {
                continue;
            }
            $hariDitambahkan++;
        }

        return $current;
    }
}

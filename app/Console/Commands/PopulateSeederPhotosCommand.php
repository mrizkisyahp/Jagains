<?php

namespace App\Console\Commands;

use App\Models\Lampiran;
use App\Models\Laporan;
use Database\Seeders\LaporanSiklusHidupDemoSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Signature('app:populate-seeder-photos')]
#[Description('Populasi file foto realistis ke storage/app/public untuk seluruh laporan seeder')]
class PopulateSeederPhotosCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai populasi file foto untuk seluruh laporan seeder...');

        $laporanList = Laporan::with(['lampiran', 'kategori', 'kelurahan'])->get();
        $total = $laporanList->count();
        $this->info("Ditemukan {$total} laporan.");

        $statusPengerjaan = [
            'DIKERJAKAN',
            'MENUNGGU_VERIFIKASI',
            'DISENGKETAKAN',
            'MENUNGGU_KEPUTUSAN_AUDITOR',
            'TERTUTUP_WARGA',
            'TERTUTUP_AUDITOR',
        ];

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $disk = Storage::disk('public');

        foreach ($laporanList as $laporan) {
            $katId = $laporan->kategori_id ?? 1;
            if ($katId < 1 || $katId > 7) {
                $katId = 1;
            }

            $nomorTiket = $laporan->nomor_tiket;
            $dirPath = "laporan/{$nomorTiket}";

            // 0. Perbarui Judul & Keterangan menjadi realistis dan alami
            $kategoriNama = $laporan->kategori?->nama ?? 'Jalan Berlubang';
            $kelurahanNama = $laporan->kelurahan?->nama ?? 'Depok Jaya';
            [$judulRealistis, $keteranganRealistis] = LaporanSiklusHidupDemoSeeder::buatTeksLaporan(
                $kategoriNama,
                $kelurahanNama,
                $nomorTiket
            );

            $laporan->update([
                'judul' => $judulRealistis,
                'keterangan' => $keteranganRealistis,
            ]);

            // 1. Foto Awal (Wajib untuk semua laporan)
            $templateAwal = database_path("seeders/templates/photos/kategori_{$katId}_awal.jpg");
            if (file_exists($templateAwal)) {
                $fileAwalPath = "{$dirPath}/foto-sebelum-01.jpg";
                $disk->put($fileAwalPath, file_get_contents($templateAwal));
                $sizeAwal = filesize($templateAwal);

                $lampiranAwal = $laporan->lampiran->firstWhere('tahap', 'awal');
                if ($lampiranAwal) {
                    $lampiranAwal->update([
                        'path' => $fileAwalPath,
                        'ukuran_byte' => $sizeAwal,
                        'lebar' => 1280,
                        'tinggi' => 960,
                    ]);
                } else {
                    Lampiran::create([
                        'uuid' => (string) Str::uuid(),
                        'laporan_id' => $laporan->id,
                        'pengguna_id' => $laporan->pelapor_id,
                        'tahap' => 'awal',
                        'path' => $fileAwalPath,
                        'ukuran_byte' => $sizeAwal,
                        'lebar' => 1280,
                        'tinggi' => 960,
                        'gps_cocok' => null,
                        'jarak_m' => null,
                        'akurasi_m' => null,
                        'created_at' => $laporan->created_at,
                    ]);
                }
            }

            // 2. Foto Sebelum & Sesudah Pengerjaan (Untuk laporan yang sedang dikerjakan atau sudah selesai)
            $needsSesudah = in_array($laporan->status, $statusPengerjaan, true) ||
                $laporan->lampiran->where('tahap', 'sesudah')->isNotEmpty();

            if ($needsSesudah) {
                // A. Foto Sesudah
                $templateSesudah = database_path("seeders/templates/photos/kategori_{$katId}_sesudah.jpg");
                if (file_exists($templateSesudah)) {
                    $fileSesudahPath = "{$dirPath}/foto-sesudah-01.jpg";
                    $disk->put($fileSesudahPath, file_get_contents($templateSesudah));
                    $sizeSesudah = filesize($templateSesudah);

                    $lampiranSesudah = $laporan->lampiran->firstWhere('tahap', 'sesudah');
                    if ($lampiranSesudah) {
                        $lampiranSesudah->update([
                            'path' => $fileSesudahPath,
                            'ukuran_byte' => $sizeSesudah,
                            'lebar' => 1280,
                            'tinggi' => 960,
                            'gps_cocok' => true,
                            'jarak_m' => 10.0,
                            'akurasi_m' => 7.5,
                        ]);
                    } else {
                        Lampiran::create([
                            'uuid' => (string) Str::uuid(),
                            'laporan_id' => $laporan->id,
                            'pengguna_id' => $laporan->pelapor_id,
                            'tahap' => 'sesudah',
                            'path' => $fileSesudahPath,
                            'ukuran_byte' => $sizeSesudah,
                            'lebar' => 1280,
                            'tinggi' => 960,
                            'gps_cocok' => true,
                            'jarak_m' => 10.0,
                            'akurasi_m' => 7.5,
                            'created_at' => $laporan->created_at->addDays(3),
                        ]);
                    }
                }

                // B. Foto Sebelum Pengerjaan Fisik
                $templateSebelum = database_path("seeders/templates/photos/kategori_{$katId}_sebelum.jpg");
                if (file_exists($templateSebelum)) {
                    $fileSebelumPath = "{$dirPath}/foto-sebelum-pengerjaan.jpg";
                    $disk->put($fileSebelumPath, file_get_contents($templateSebelum));
                    $sizeSebelum = filesize($templateSebelum);

                    $lampiranSebelum = $laporan->lampiran->firstWhere('tahap', 'sebelum');
                    if ($lampiranSebelum) {
                        $lampiranSebelum->update([
                            'path' => $fileSebelumPath,
                            'ukuran_byte' => $sizeSebelum,
                            'lebar' => 1280,
                            'tinggi' => 960,
                            'gps_cocok' => true,
                            'jarak_m' => 12.0,
                            'akurasi_m' => 5.0,
                        ]);
                    } else {
                        Lampiran::create([
                            'uuid' => (string) Str::uuid(),
                            'laporan_id' => $laporan->id,
                            'pengguna_id' => $laporan->pelapor_id,
                            'tahap' => 'sebelum',
                            'path' => $fileSebelumPath,
                            'ukuran_byte' => $sizeSebelum,
                            'lebar' => 1280,
                            'tinggi' => 960,
                            'gps_cocok' => true,
                            'jarak_m' => 12.0,
                            'akurasi_m' => 5.0,
                            'created_at' => $laporan->created_at->addDays(1),
                        ]);
                    }
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Populasi foto seeder berhasil diselesaikan untuk seluruh laporan!');

        return Command::SUCCESS;
    }
}

<?php

namespace Database\Seeders;

use App\Models\Laporan;
use App\Models\Notifikasi;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotifikasiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Notifikasi untuk warga demo (warga_demo_1 dst)
        $wargaDemoList = User::where('peran', 'warga')->whereLike('username', 'warga_%')->get();

        foreach ($wargaDemoList as $warga) {
            // Cari tiket di kelurahan warga yang sedang dalam tahap verifikasi
            $laporanVerif = Laporan::where('kelurahan_id', $warga->kelurahan_id)
                ->where('status', 'MENUNGGU_VERIFIKASI')
                ->latest()
                ->take(3)
                ->get();

            foreach ($laporanVerif as $index => $lap) {
                Notifikasi::firstOrCreate(
                    [
                        'pengguna_id' => $warga->id,
                        'kunci_dedup' => "seed_verif_{$lap->id}_{$warga->id}",
                    ],
                    [
                        'laporan_id' => $lap->id,
                        'tipe' => 'PERMINTAAN_VERIFIKASI',
                        'pesan' => "Pekerjaan perbaikan pada tiket {$lap->nomor_tiket} ({$lap->judul}) telah diajukan instansi. Mohon partisipasi Anda untuk memverifikasi hasil perbaikan di kelurahan Anda.",
                        'dibaca_pada' => $index === 0 ? null : now()->subHours($index * 4),
                        'created_at' => now()->subHours($index * 6),
                    ]
                );
            }

            // Notifikasi tiket pelapor (jika warga pernah melapor)
            $laporanSaya = Laporan::where('pelapor_id', $warga->id)->latest()->take(2)->get();
            foreach ($laporanSaya as $lapSaya) {
                Notifikasi::firstOrCreate(
                    [
                        'pengguna_id' => $warga->id,
                        'kunci_dedup' => "seed_status_{$lapSaya->id}_{$warga->id}",
                    ],
                    [
                        'laporan_id' => $lapSaya->id,
                        'tipe' => 'STATUS_BERUBAH',
                        'pesan' => "Status laporan Anda ({$lapSaya->nomor_tiket}) saat ini: {$lapSaya->status}.",
                        'dibaca_pada' => now()->subDay(),
                        'created_at' => now()->subDays(2),
                    ]
                );
            }
        }

        // 2. Notifikasi untuk akun Instansi
        $petugasInstansiList = User::where('peran', 'instansi')->whereNotNull('instansi_id')->take(10)->get();
        foreach ($petugasInstansiList as $petugas) {
            $laporanInstansi = Laporan::where('instansi_id', $petugas->instansi_id)->latest()->take(3)->get();
            foreach ($laporanInstansi as $index => $lap) {
                Notifikasi::firstOrCreate(
                    [
                        'pengguna_id' => $petugas->id,
                        'kunci_dedup' => "seed_instansi_{$lap->id}_{$petugas->id}",
                    ],
                    [
                        'laporan_id' => $lap->id,
                        'tipe' => $lap->status === 'DISENGKETAKAN' ? 'SENGKETA_DIMULAI' : 'PEMBARUAN_TIKET',
                        'pesan' => "Tiket {$lap->nomor_tiket} ({$lap->judul}) berstatus {$lap->status}. Harap periksa detail penugasan.",
                        'dibaca_pada' => $index === 0 ? null : now()->subHours(8),
                        'created_at' => now()->subHours(12),
                    ]
                );
            }
        }

        // 3. Notifikasi untuk Auditor
        $auditors = User::where('peran', 'auditor')->take(3)->get();
        $laporanSengketa = Laporan::whereIn('status', ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR'])->latest()->take(3)->get();
        foreach ($auditors as $auditor) {
            foreach ($laporanSengketa as $index => $lap) {
                Notifikasi::firstOrCreate(
                    [
                        'pengguna_id' => $auditor->id,
                        'kunci_dedup' => "seed_auditor_{$lap->id}_{$auditor->id}",
                    ],
                    [
                        'laporan_id' => $lap->id,
                        'tipe' => 'PERINTAH_AUDITOR',
                        'pesan' => "Tiket {$lap->nomor_tiket} berada dalam status {$lap->status} dan membutuhkan tinjauan auditor.",
                        'dibaca_pada' => $index === 0 ? null : now()->subHours(5),
                        'created_at' => now()->subHours(10),
                    ]
                );
            }
        }
    }
}

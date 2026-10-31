<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use Illuminate\Database\Seeder;

class PengaturanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parameters = [
            ['key' => 'batas_sla_respons_hk', 'nilai' => '3', 'tipe' => 'int'],
            ['key' => 'batas_sla_survei_hk', 'nilai' => '5', 'tipe' => 'int'],
            ['key' => 'batas_sla_anggaran_hk', 'nilai' => '10', 'tipe' => 'int'],
            ['key' => 'batas_jawab_sengketa_hk', 'nilai' => '7', 'tipe' => 'int'],
            ['key' => 'jendela_verifikasi_hari', 'nilai' => '14', 'tipe' => 'int'],
            ['key' => 'maks_kerjakan_ulang', 'nilai' => '3', 'tipe' => 'int'],
            ['key' => 'maks_pengalihan_tiket', 'nilai' => '2', 'tipe' => 'int'],
            ['key' => 'kuorum_proporsi_k_bp', 'nilai' => '200', 'tipe' => 'int'],
            ['key' => 'kuorum_kmin', 'nilai' => '2.0', 'tipe' => 'decimal'],
            ['key' => 'kuorum_kmax', 'nilai' => '5.0', 'tipe' => 'decimal'],
            ['key' => 'bobot_jalur_a', 'nilai' => '1.0', 'tipe' => 'decimal'],
            ['key' => 'bobot_jalur_b', 'nilai' => '0.5', 'tipe' => 'decimal'],
            ['key' => 'toleransi_jarak_gps_m', 'nilai' => '50', 'tipe' => 'int'],
            ['key' => 'maks_akurasi_gps_jalur_a_m', 'nilai' => '100', 'tipe' => 'int'],
            ['key' => 'jendela_akun_aktif_hari', 'nilai' => '90', 'tipe' => 'int'],
            ['key' => 'jeda_ganti_kelurahan_hari', 'nilai' => '90', 'tipe' => 'int'],
            ['key' => 'maks_tanggal_target_hari', 'nilai' => '180', 'tipe' => 'int'],
            ['key' => 'maks_revisi_tanggal_target', 'nilai' => '2', 'tipe' => 'int'],
            ['key' => 'batas_laporan_per_jam', 'nilai' => '5', 'tipe' => 'int'],
            ['key' => 'batas_login_gagal', 'nilai' => '5', 'tipe' => 'int'],
            ['key' => 'durasi_sesi_inaktif_menit', 'nilai' => '120', 'tipe' => 'int'],
            ['key' => 'masa_berlaku_token_email_menit', 'nilai' => '30', 'tipe' => 'int'],
            ['key' => 'ambang_dashboard_tiket', 'nilai' => '20', 'tipe' => 'int'],
            ['key' => 'maks_unggah_mb', 'nilai' => '2', 'tipe' => 'int'],
            ['key' => 'radius_duplikat_jalan_m', 'nilai' => '15', 'tipe' => 'int'],
            ['key' => 'radius_duplikat_lampu_m', 'nilai' => '20', 'tipe' => 'int'],
            ['key' => 'radius_duplikat_lainnya_m', 'nilai' => '25', 'tipe' => 'int'],
            ['key' => 'min_panjang_keterangan', 'nilai' => '10', 'tipe' => 'int'],
            ['key' => 'ambang_warna_sla_kuning_persen', 'nilai' => '50', 'tipe' => 'int'],
        ];

        foreach ($parameters as $param) {
            Pengaturan::updateOrCreate(
                ['key' => $param['key']],
                [
                    'nilai' => $param['nilai'],
                    'tipe' => $param['tipe'],
                    'versi' => 1,
                    'waktu' => now(),
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\HariLibur;
use Illuminate\Database\Seeder;

class HariLiburSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $libur2026 = [
            ['tanggal' => '2026-01-01', 'keterangan' => 'Tahun Baru 2026 Masehi', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-01-16', 'keterangan' => 'Isra Mi\'raj Nabi Muhammad SAW', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-02-17', 'keterangan' => 'Tahun Baru Imlek 2577 Kongzili', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-02-18', 'keterangan' => 'Cuti Bersama Tahun Baru Imlek', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-03-20', 'keterangan' => 'Hari Suci Nyepi Tahun Baru Saka 1948', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-03-21', 'keterangan' => 'Hari Raya Idul Fitri 1447 H (Hari Pertama)', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-03-22', 'keterangan' => 'Hari Raya Idul Fitri 1447 H (Hari Kedua)', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-03-23', 'keterangan' => 'Cuti Bersama Idul Fitri 1447 H', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-03-24', 'keterangan' => 'Cuti Bersama Idul Fitri 1447 H', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-04-03', 'keterangan' => 'Wafat Yesus Kristus', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-05-01', 'keterangan' => 'Hari Buruh Internasional', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-05-14', 'keterangan' => 'Kenaikan Yesus Kristus', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-05-27', 'keterangan' => 'Hari Raya Idul Adha 1447 H', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-05-31', 'keterangan' => 'Hari Raya Waisak 2570 BE', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-06-01', 'keterangan' => 'Hari Lahir Pancasila', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-06-16', 'keterangan' => 'Tahun Baru Islam 1448 H', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-08-17', 'keterangan' => 'Hari Kemerdekaan Republik Indonesia', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-08-25', 'keterangan' => 'Maulid Nabi Muhammad SAW', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-12-25', 'keterangan' => 'Hari Raya Natal', 'sumber' => 'SKB 3 Menteri 2026'],
            ['tanggal' => '2026-12-26', 'keterangan' => 'Cuti Bersama Hari Raya Natal', 'sumber' => 'SKB 3 Menteri 2026'],
        ];

        foreach ($libur2026 as $libur) {
            HariLibur::updateOrCreate(
                ['tanggal' => $libur['tanggal']],
                $libur
            );
        }
    }
}

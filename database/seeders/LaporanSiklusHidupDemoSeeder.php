<?php

namespace Database\Seeders;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LaporanSiklusHidupDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement("SET jagains.izin_status = 'on'");

        $kelurahan = Wilayah::where('tingkat', 'kelurahan')->first();
        if (! $kelurahan) {
            return;
        }

        $kategoriList = Kategori::all();
        $pupr = Instansi::where('singkatan', 'DPUPR')->first();
        $dishub = Instansi::where('singkatan', 'DISHUB')->first();
        $dlhk = Instansi::where('singkatan', 'DLHK')->first();

        // 1. Pastikan minimal 10 warga demo terdaftar di kelurahan percontohan
        $defaultPassword = Hash::make('password123');
        $wargaList = [];

        for ($i = 1; $i <= 10; $i++) {
            $warga = User::updateOrCreate(
                ['username' => "warga_demo_{$i}"],
                [
                    'peran' => 'warga',
                    'status_akun' => 'aktif',
                    'email_hash' => hash('sha256', "warga_demo_{$i}@depok.go.id"),
                    'kelurahan_id' => $kelurahan->id,
                    'instansi_id' => null,
                    'password' => $defaultPassword,
                    'wajib_ganti_sandi' => false,
                    'poin_peringatan' => 0,
                    'aktivitas_terakhir_pada' => now(),
                ]
            );
            $wargaList[] = $warga;
        }

        // 2. Daftar 12 Status Siklus Hidup Laporan
        $tiketDemo = [
            [
                'nomor_tiket' => 'JAG-2026-DEMO-001',
                'status' => 'PERLU_ROUTING',
                'judul' => 'Jalan Rusak Parah Tanpa Aturan Routing Otomatis',
                'keterangan' => 'Aspal amblas sedalam 15 cm di perbatasan jalan desa dan kota, butuh penetapan dinas terkait.',
                'instansi_id' => null,
                'disembunyikan' => false,
                'keparahan' => 'berat',
                'lintang' => -6.372484,
                'bujur' => 106.829240,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-002',
                'status' => 'DITERUSKAN',
                'judul' => 'Lampu PJU Padam di Tikungan Gelap',
                'keterangan' => 'Sudah 4 hari lampu PJU padam, membahayakan pengendara motor saat malam hari.',
                'instansi_id' => $dishub?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.398123,
                'bujur' => 106.821345,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-003',
                'status' => 'USULAN_TOLAK',
                'judul' => 'Trotoar Digunakan Lapak Liar Komplek Swasta',
                'keterangan' => 'Lapak liar di dalam area komersial tertutup, dinas mengusulkan penolakan karena aset non-APBD.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'ringan',
                'lintang' => -6.365123,
                'bujur' => 106.834567,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-004',
                'status' => 'DITOLAK',
                'judul' => 'Pemasangan Gerbang Perumahan Pribadi',
                'keterangan' => 'Ditolak sah oleh Auditor: Objek merupakan wewenang paguyuban warga klaster privat bukan fasilitas umum Depok.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'ringan',
                'lintang' => -6.361123,
                'bujur' => 106.839567,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-005',
                'status' => 'DITERIMA',
                'judul' => 'Drainase Mampet Meluap ke Badan Jalan',
                'keterangan' => 'Gorong-gorong tersumbat sedimen lumpur dan sampah, air meluap ke aspal saat hujan.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.388234,
                'bujur' => 106.812345,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-006',
                'status' => 'DISURVEI',
                'judul' => 'Rambu Peringatan Rawan Kecelakaan Roboh',
                'keterangan' => 'Petugas telah melakukan survei teknis di lokasi, fondasi tiang rambu patah tertabrak kendaraan.',
                'instansi_id' => $dishub?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.395432,
                'bujur' => 106.815678,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-007',
                'status' => 'TERJADWAL_ANGGARAN',
                'judul' => 'Jembatan Penyeberangan Rusak Berkarat',
                'keterangan' => 'Alokasi anggaran pengerjaan pemeliharaan telah ditetapkan dengan target pengerjaan 14 hari ke depan.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'berat',
                'lintang' => -6.378901,
                'bujur' => 106.824567,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-008',
                'status' => 'DIKERJAKAN',
                'judul' => 'Pengaspalan Lubang Jalan Margonda Raya',
                'keterangan' => 'Regu teknis dinas sedang melakukan penambalan aspal hotmix di jalur lambat.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'berat',
                'lintang' => -6.368901,
                'bujur' => 106.831234,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-009',
                'status' => 'MENUNGGU_VERIFIKASI',
                'judul' => 'Pembersihan Sampah Liar di Pinggir Rel',
                'keterangan' => 'Dinas telah mengajukan selesai perbaikan disertai bukti foto, menunggu voting kuorum warga kelurahan.',
                'instansi_id' => $dlhk?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.381234,
                'bujur' => 106.819876,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-010',
                'status' => 'DISENGKETAKAN',
                'judul' => 'Perbaikan Trotoar Dinilai Asal Jadi',
                'keterangan' => 'Warga menolak verifikasi karena paving block goyang dan tidak ada jalur difabel (guiding block).',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.374567,
                'bujur' => 106.827890,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-011',
                'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'judul' => 'Sengketa Pengerjaan Melampaui Batas Revisi',
                'keterangan' => 'Sudah 3 ronde perbaikan ditolak warga, kasus dieskalasi ke meja Auditor Ombudsman untuk vonis final.',
                'instansi_id' => $pupr?->id,
                'disembunyikan' => false,
                'keparahan' => 'berat',
                'lintang' => -6.371234,
                'bujur' => 106.826789,
            ],
            [
                'nomor_tiket' => 'JAG-2026-DEMO-012',
                'status' => 'TERTUTUP_WARGA',
                'judul' => 'Lampu Penerangan Taman Kota Selesai Diperbaiki',
                'keterangan' => 'Kuorum warga kelurahan telah memverifikasi perbaikan sah. Tiket ditutup dengan sukses.',
                'instansi_id' => $dishub?->id,
                'disembunyikan' => false,
                'keparahan' => 'sedang',
                'lintang' => -6.384567,
                'bujur' => 106.822345,
            ],
        ];

        foreach ($tiketDemo as $idx => $item) {
            $kategori = $kategoriList[$idx % $kategoriList->count()] ?? $kategoriList->first();
            $pelapor = $wargaList[$idx % count($wargaList)];
            $isFinal = in_array($item['status'], ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'], true);
            $isTerjadwal = in_array($item['status'], ['TERJADWAL_ANGGARAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR'], true);

            $laporan = Laporan::updateOrCreate(
                ['nomor_tiket' => $item['nomor_tiket']],
                [
                    'pelapor_id' => $pelapor->id,
                    'kategori_id' => $kategori->id,
                    'instansi_id' => $item['instansi_id'],
                    'kelurahan_id' => $kelurahan->id,
                    'judul' => $item['judul'],
                    'keterangan' => $item['keterangan'],
                    'keparahan' => $item['keparahan'],
                    'lintang' => $item['lintang'],
                    'bujur' => $item['bujur'],
                    'akurasi_gps_m' => 4.5,
                    'lokasi_sumber' => 'gps',
                    'status' => $item['status'],
                    'disembunyikan' => $item['disembunyikan'],
                    'jumlah_pengalihan' => 0,
                    'ditutup_pada' => $isFinal ? now()->subDays(1) : null,
                    'tanggal_target' => $isTerjadwal ? now()->addDays(14) : null,
                    'tanggal_target_awal' => $isTerjadwal ? now()->addDays(14) : null,
                    'jenis_pendanaan' => $isTerjadwal ? 'APBD_KOTA' : null,
                    'created_at' => now()->subDays(15 - $idx),
                    'updated_at' => now()->subDays(15 - $idx),
                ]
            );

            // Buat entri riwayat status awal
            RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-01',
                'status_lama' => null,
                'status_baru' => $item['status'],
                'pelaku_id' => $pelapor->id,
                'instansi_id' => $item['instansi_id'],
                'catatan' => 'Skenario demo siklus hidup Jagains',
                'waktu' => now()->subDays(15 - $idx),
            ]);
        }
    }
}

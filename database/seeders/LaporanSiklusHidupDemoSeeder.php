<?php

namespace Database\Seeders;

use App\Models\BeritaAcara;
use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\KeputusanAuditor;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\Sengketa;
use App\Models\User;
use App\Models\Wilayah;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LaporanSiklusHidupDemoSeeder extends Seeder
{
    private const INSTANSI = ['DPUPR', 'DISHUB', 'DLHK', 'DPKP', 'DISRUMKIM'];

    private const DISTRIBUSI = [
        'DITERUSKAN' => 4, 'USULAN_TOLAK' => 4, 'DITOLAK' => 4, 'DITERIMA' => 4,
        'DISURVEI' => 4, 'TERJADWAL_ANGGARAN' => 4, 'DIKERJAKAN' => 4,
        'MENUNGGU_VERIFIKASI' => 4, 'DISENGKETAKAN' => 4,
        'MENUNGGU_KEPUTUSAN_AUDITOR' => 4, 'TERTUTUP_WARGA' => 5,
        'TERTUTUP_AUDITOR' => 5,
    ];

    public function run(): void
    {
        DB::statement("SET jagains.izin_status = 'on'");

        $this->seedDemoDepok();
        $this->seedDemoJakarta();
        $this->seedDemoBodetabek();
    }

    private function seedDemoDepok(): void
    {
        $laporanDemoSebelumnya = Laporan::query()
            ->whereLike('nomor_tiket', 'JAG-2026-DEP-%')
            ->with('kelurahan')
            ->orderBy('nomor_tiket')
            ->get();

        if ($laporanDemoSebelumnya->isNotEmpty()) {
            if ($laporanDemoSebelumnya->count() !== 255) {
                throw new \RuntimeException('Data demo sebelumnya tidak lengkap. Jalankan php artisan migrate:fresh --seed.');
            }

            return;
        }

        $depokKotaId = Wilayah::where('nama', 'Kota Depok')->value('id') ?? 1;
        $depokKecamatanIds = Wilayah::where('induk_id', $depokKotaId)->pluck('id');
        $kelurahan = Wilayah::query()
            ->where('tingkat', 'kelurahan')
            ->where(function ($q) use ($depokKecamatanIds) {
                $q->where('id', '<=', 75)
                    ->orWhereIn('induk_id', $depokKecamatanIds);
            })
            ->orderBy('id')
            ->get();

        $kategori = Kategori::query()->orderBy('id')->get();
        $warga = $this->wargaDemo($kelurahan->firstOrFail());
        $auditor = User::query()->where('peran', 'auditor')->orderBy('id')->firstOrFail();
        $instansi = Instansi::query()->whereIn('singkatan', self::INSTANSI)->get()->keyBy('singkatan');

        foreach (self::INSTANSI as $singkatan) {
            if (! $instansi->has($singkatan)) {
                throw new \RuntimeException("Instansi demo {$singkatan} tidak ditemukan.");
            }
        }

        DB::transaction(function () use ($kelurahan, $kategori, $warga, $auditor, $instansi): void {
            foreach (range(1, 5) as $nomor) {
                $this->buatPerluRouting($nomor, $kelurahan, $kategori, $warga);
            }

            foreach (self::INSTANSI as $index => $singkatan) {
                $penerima = $instansi[$singkatan];
                $petugas = User::query()->where('instansi_id', $penerima->id)->firstOrFail();
                $nomor = 1;

                foreach (self::DISTRIBUSI as $status => $jumlah) {
                    foreach (range(1, $jumlah) as $_) {
                        $this->buatUntukInstansi($penerima, $petugas, $auditor, $status, $nomor++, $index, $kelurahan, $kategori, $warga);
                    }
                }
            }
        });
    }

    private function seedDemoJakarta(): void
    {
        $dkiCities = Wilayah::query()
            ->where('tingkat', 'kota')
            ->where('nama', '!=', 'Kota Depok')
            ->orderBy('id')
            ->get();

        if ($dkiCities->isEmpty()) {
            return;
        }

        $laporanJakartaSebelumnya = Laporan::query()
            ->whereLike('nomor_tiket', 'JAG-2026-JKT-%')
            ->with('kelurahan')
            ->orderBy('nomor_tiket')
            ->get();

        if ($laporanJakartaSebelumnya->isNotEmpty()) {
            return;
        }

        $singkatanKotaMap = [
            'Kota Administrasi Jakarta Selatan' => 'JAKSEL',
            'Kota Administrasi Jakarta Pusat' => 'JAKPUS',
            'Kota Administrasi Jakarta Timur' => 'JAKTIM',
            'Kota Administrasi Jakarta Barat' => 'JAKBAR',
            'Kota Administrasi Jakarta Utara' => 'JAKUT',
        ];

        $dkiKotaIds = $dkiCities->pluck('id');
        $dkiKecamatanIds = Wilayah::whereIn('induk_id', $dkiKotaIds)->pluck('id');
        $firstKelurahanJakarta = Wilayah::query()
            ->where('tingkat', 'kelurahan')
            ->whereIn('induk_id', $dkiKecamatanIds)
            ->orderBy('id')
            ->first();

        if (! $firstKelurahanJakarta) {
            return;
        }

        $wargaJakarta = $this->wargaDemoJakarta($firstKelurahanJakarta);
        $auditor = User::query()->where('peran', 'auditor')->orderBy('id')->firstOrFail();
        $semuaKategori = Kategori::query()->get()->keyBy('nama');

        $kasusTemplates = [
            [
                'status' => 'DITERUSKAN',
                'kategori' => 'Jalan Berlubang',
                'sudin' => 'BM',
                'judul' => 'Jalan berlubang cukup parah di jalur utama',
                'keterangan' => 'Terdapat lubang berdiameter sekitar 40 cm dan kedalaman 10 cm, membahayakan pengendara roda dua.',
                'keparahan' => 'berat',
            ],
            [
                'status' => 'DITERIMA',
                'kategori' => 'Drainase Tersumbat',
                'sudin' => 'SDA',
                'judul' => 'Saluran drainase mampet akibat sedimen lumpur',
                'keterangan' => 'Saluran air tidak mengalir dan kerap meluap ke badan jalan saat intensitas hujan tinggi.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'DISURVEI',
                'kategori' => 'Lampu Jalan Padam',
                'sudin' => 'DISHUB',
                'judul' => 'Lampu PJU padam di persimpangan jalan',
                'keterangan' => 'Lampu penerangan jalan umum mati total sejak tiga hari lalu, memicu kerawanan di malam hari.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'TERJADWAL_ANGGARAN',
                'kategori' => 'Trotoar Rusak',
                'sudin' => 'BM',
                'judul' => 'Paving block trotoar amblas dan hancur',
                'keterangan' => 'Jalur pedestrian rusak dan ubin pemandu difabel terputus akibat amblas.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'DIKERJAKAN',
                'kategori' => 'Sampah Liar',
                'sudin' => 'DLH',
                'judul' => 'Tumpukan sampah liar di tepi jalan umum',
                'keterangan' => 'Sampah rumah tangga liar menumpuk dan menimbulkan bau tidak sedap ke pemukiman warga.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'MENUNGGU_VERIFIKASI',
                'kategori' => 'Jalan Berlubang',
                'sudin' => 'BM',
                'judul' => 'Aspal jalan bergelombang dan retak buaya',
                'keterangan' => 'Permukaan aspal rusak telah dilakukan pengaspalan ulang dan kini menunggu verifikasi warga.',
                'keparahan' => 'ringan',
            ],
            [
                'status' => 'DISENGKETAKAN',
                'kategori' => 'Drainase Tersumbat',
                'sudin' => 'SDA',
                'judul' => 'Pembersihan saluran air belum tuntas',
                'keterangan' => 'Warga mengajukan sengketa karena endapan lumpur padat masih tersisa di dalam gorong-gorong.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'kategori' => 'Rambu Lalu Lintas Rusak',
                'sudin' => 'DISHUB',
                'judul' => 'Tiang rambu lalu lintas miring tertabrak',
                'keterangan' => 'Ronde verifikasi telah kedaluwarsa, eskalasi otomatis dialihkan ke auditor kota.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'TERTUTUP_WARGA',
                'kategori' => 'Lampu Jalan Padam',
                'sudin' => 'DISHUB',
                'judul' => 'Penggantian bohlam LED PJU selesai',
                'keterangan' => 'Perbaikan fisik lampu jalan telah disetujui melalui verifikasi kuorum warga setempat.',
                'keparahan' => 'ringan',
            ],
            [
                'status' => 'TERTUTUP_AUDITOR',
                'kategori' => 'Sampah Liar',
                'sudin' => 'DLH',
                'judul' => 'Pengangkutan tumpukan sampah liar telah tuntas',
                'keterangan' => 'Auditor menyetujui penutupan tiket setelah memeriksa bukti foto pembersihan dan berita acara.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'USULAN_TOLAK',
                'kategori' => 'Jembatan Rusak',
                'sudin' => 'BM',
                'judul' => 'Usulan perbaikan jembatan penyeberangan orang',
                'keterangan' => 'Instansi mengusulkan penolakan karena aset JPO berada di bawah kewenangan kementerian pusat.',
                'keparahan' => 'berat',
            ],
            [
                'status' => 'DITOLAK',
                'kategori' => 'Jalan Berlubang',
                'sudin' => 'BM',
                'judul' => 'Laporan jalan rusak di perumahan privat',
                'keterangan' => 'Ditolak oleh auditor karena jalan belum diserahterimakan sebagai aset fasos/fasum pemerintah daerah.',
                'keparahan' => 'ringan',
            ],
        ];

        DB::transaction(function () use ($dkiCities, $singkatanKotaMap, $wargaJakarta, $auditor, $semuaKategori, $kasusTemplates): void {
            $nomorGlobal = 1;

            foreach ($dkiCities as $kota) {
                if (! isset($singkatanKotaMap[$kota->nama])) {
                    continue;
                }

                $singkatan = $singkatanKotaMap[$kota->nama];
                $kecamatanIds = Wilayah::where('induk_id', $kota->id)->pluck('id');
                $kelurahans = Wilayah::query()
                    ->where('tingkat', 'kelurahan')
                    ->whereIn('induk_id', $kecamatanIds)
                    ->orderBy('id')
                    ->get();

                if ($kelurahans->isEmpty()) {
                    continue;
                }

                // 1. Buat 1 Laporan PERLU_ROUTING per kota
                $nomorRouting = $nomorGlobal;
                $waktuRouting = CarbonImmutable::now()->subDays(20 - ($nomorRouting % 10));
                $pelaporRouting = $wargaJakarta[$nomorRouting % $wargaJakarta->count()];
                $kelurahanRouting = $kelurahans[$nomorRouting % $kelurahans->count()];
                $kategoriRouting = $semuaKategori->first();
                $nomorTiketRouting = sprintf('JAG-2026-JKT-ROUT-%03d', $nomorRouting);
                [$latRouting, $lngRouting] = $this->koordinatKelurahanAlami($kelurahanRouting, $nomorTiketRouting);

                $laporanRouting = Laporan::create([
                    'nomor_tiket' => $nomorTiketRouting,
                    'pelapor_id' => $pelaporRouting->id,
                    'kategori_id' => $kategoriRouting->id,
                    'instansi_id' => null,
                    'kelurahan_id' => $kelurahanRouting->id,
                    'judul' => "Laporan infrastruktur di {$kelurahanRouting->nama}",
                    'keterangan' => 'Laporan fasilitas umum baru yang membutuhkan penentuan dan disposisi instansi teknis.',
                    'keparahan' => 'sedang',
                    'lintang' => $latRouting,
                    'bujur' => $lngRouting,
                    'akurasi_gps_m' => 8.0,
                    'lokasi_sumber' => 'gps',
                    'status' => 'PERLU_ROUTING',
                    'jenis_pendanaan' => null,
                    'tanggal_target_awal' => null,
                    'tanggal_target' => null,
                    'ronde_sengketa' => 0,
                    'jumlah_pengalihan' => 0,
                    'disembunyikan' => false,
                    'diteruskan_pertama_pada' => null,
                    'ditutup_pada' => null,
                    'created_at' => $waktuRouting,
                    'updated_at' => $waktuRouting,
                ]);
                $this->catat($laporanRouting, 'T-02', null, 'PERLU_ROUTING', $pelaporRouting, null, 'Aturan routing belum menemukan instansi penerima.', $waktuRouting);
                $this->fotoAwal($laporanRouting, $pelaporRouting, $waktuRouting);
                $nomorGlobal++;

                // 2. Buat 12 Laporan siklus hidup untuk kota ini
                foreach ($kasusTemplates as $i => $kasus) {
                    $nomorKasus = $i + 1;
                    $waktuKasus = CarbonImmutable::now()->subDays(50 - ($nomorKasus * 3));
                    $pelaporKasus = $wargaJakarta[$nomorKasus % $wargaJakarta->count()];
                    $kelurahanKasus = $kelurahans[$nomorKasus % $kelurahans->count()];
                    $kategoriKasus = $semuaKategori[$kasus['kategori']] ?? $semuaKategori->first();

                    $instansiKasus = Instansi::where('wilayah_id', $kota->id)
                        ->where('singkatan', "SUDIN {$kasus['sudin']} {$singkatan}")
                        ->first();

                    if (! $instansiKasus) {
                        continue;
                    }

                    $petugasKasus = User::where('instansi_id', $instansiKasus->id)->first()
                        ?: User::where('peran', 'instansi')->firstOrFail();

                    $nomorTiketKasus = sprintf('JAG-2026-JKT-%s-%03d', $singkatan, $nomorKasus);
                    [$latKasus, $lngKasus] = $this->koordinatKelurahanAlami($kelurahanKasus, $nomorTiketKasus);

                    $butuhTarget = in_array($kasus['status'], ['TERJADWAL_ANGGARAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);
                    $ditutup = in_array($kasus['status'], ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);

                    $laporanKasus = Laporan::create([
                        'nomor_tiket' => $nomorTiketKasus,
                        'pelapor_id' => $pelaporKasus->id,
                        'kategori_id' => $kategoriKasus->id,
                        'instansi_id' => $instansiKasus->id,
                        'kelurahan_id' => $kelurahanKasus->id,
                        'judul' => "{$kasus['judul']} di {$kelurahanKasus->nama}",
                        'keterangan' => $kasus['keterangan'],
                        'keparahan' => $kasus['keparahan'],
                        'lintang' => $latKasus,
                        'bujur' => $lngKasus,
                        'akurasi_gps_m' => 6.5,
                        'lokasi_sumber' => 'gps',
                        'status' => $kasus['status'],
                        'jenis_pendanaan' => $butuhTarget ? 'APBD_PROVINSI' : null,
                        'tanggal_target_awal' => $butuhTarget ? $waktuKasus->addDays(21)->toDateString() : null,
                        'tanggal_target' => $butuhTarget ? $waktuKasus->addDays(21)->toDateString() : null,
                        'ronde_sengketa' => in_array($kasus['status'], ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_AUDITOR'], true) ? 1 : 0,
                        'jumlah_pengalihan' => 0,
                        'disembunyikan' => false,
                        'diteruskan_pertama_pada' => $waktuKasus,
                        'ditutup_pada' => $ditutup ? $waktuKasus->addDays(8) : null,
                        'created_at' => $waktuKasus,
                        'updated_at' => $waktuKasus->addDays(8),
                    ]);

                    $this->catat($laporanKasus, 'T-01', null, 'DITERUSKAN', $pelaporKasus, $instansiKasus, 'Laporan diteruskan ke instansi penerima.', $waktuKasus);
                    $this->fotoAwal($laporanKasus, $pelaporKasus, $waktuKasus);
                    $this->linimasa($laporanKasus, $kasus['status'], $petugasKasus, $auditor, $waktuKasus);
                }
            }
        });
    }

    private function seedDemoBodetabek(): void
    {
        $laporanBodetabekSebelumnya = Laporan::query()
            ->whereLike('nomor_tiket', 'JAG-2026-BDT-%')
            ->with('kelurahan')
            ->orderBy('nomor_tiket')
            ->get();

        if ($laporanBodetabekSebelumnya->isNotEmpty()) {
            return;
        }

        $singkatanKotaMap = [
            'Kota Bogor' => 'BGR',
            'Kabupaten Bogor' => 'KAB-BGR',
            'Kota Tangerang' => 'TNG',
            'Kota Tangerang Selatan' => 'TGL',
            'Kabupaten Tangerang' => 'KAB-TNG',
            'Kota Bekasi' => 'BKS',
            'Kabupaten Bekasi' => 'KAB-BKS',
        ];

        $bodetabekCities = Wilayah::query()
            ->where('tingkat', 'kota')
            ->whereIn('nama', array_keys($singkatanKotaMap))
            ->orderBy('id')
            ->get();

        if ($bodetabekCities->isEmpty()) {
            return;
        }

        $bodetabekKotaIds = $bodetabekCities->pluck('id');
        $bodetabekKecamatanIds = Wilayah::whereIn('induk_id', $bodetabekKotaIds)->pluck('id');
        $firstKelurahanBodetabek = Wilayah::query()
            ->where('tingkat', 'kelurahan')
            ->whereIn('induk_id', $bodetabekKecamatanIds)
            ->orderBy('id')
            ->first();

        if (! $firstKelurahanBodetabek) {
            return;
        }

        $wargaBodetabek = $this->wargaDemoBodetabek($firstKelurahanBodetabek);
        $auditor = User::query()->where('peran', 'auditor')->orderBy('id')->firstOrFail();
        $semuaKategori = Kategori::query()->get()->keyBy('nama');

        $kasusTemplates = [
            [
                'status' => 'DITERUSKAN',
                'kategori' => 'Jalan Berlubang',
                'tipe_opd' => 'infra',
                'judul' => 'Jalan berlubang cukup parah di jalur utama',
                'keterangan' => 'Terdapat lubang berdiameter sekitar 40 cm dan kedalaman 10 cm, membahayakan pengendara roda dua.',
                'keparahan' => 'berat',
            ],
            [
                'status' => 'DITERIMA',
                'kategori' => 'Drainase Tersumbat',
                'tipe_opd' => 'infra',
                'judul' => 'Saluran drainase mampet akibat sedimen lumpur',
                'keterangan' => 'Saluran air tidak mengalir dan kerap meluap ke badan jalan saat intensitas hujan tinggi.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'DISURVEI',
                'kategori' => 'Lampu Jalan Padam',
                'tipe_opd' => 'dishub',
                'judul' => 'Lampu PJU padam di persimpangan jalan',
                'keterangan' => 'Lampu penerangan jalan umum mati total sejak tiga hari lalu, memicu kerawanan di malam hari.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'TERJADWAL_ANGGARAN',
                'kategori' => 'Trotoar Rusak',
                'tipe_opd' => 'infra',
                'judul' => 'Paving block trotoar amblas dan hancur',
                'keterangan' => 'Jalur pedestrian rusak dan ubin pemandu difabel terputus akibat amblas.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'DIKERJAKAN',
                'kategori' => 'Sampah Liar',
                'tipe_opd' => 'dlh',
                'judul' => 'Tumpukan sampah liar di tepi jalan umum',
                'keterangan' => 'Sampah rumah tangga liar menumpuk dan menimbulkan bau tidak sedap ke pemukiman warga.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'MENUNGGU_VERIFIKASI',
                'kategori' => 'Jalan Berlubang',
                'tipe_opd' => 'infra',
                'judul' => 'Penambalan aspal jalan telah selesai dikerjakan',
                'keterangan' => 'Pekerjaan penambalan lubang jalan sudah rampung, dinas menunggu konfirmasi verifikasi dari warga pelapor.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'DISENGKETAKAN',
                'kategori' => 'Drainase Tersumbat',
                'tipe_opd' => 'infra',
                'judul' => 'Normalisasi saluran dinilai belum tuntas oleh warga',
                'keterangan' => 'Warga mengajukan sengketa karena endapan lumpur hanya diangkat sebagian dan saluran tetap meluap saat hujan.',
                'keparahan' => 'berat',
            ],
            [
                'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'kategori' => 'Lampu Jalan Padam',
                'tipe_opd' => 'dishub',
                'judul' => 'Perbedaan pandangan perbaikan PJU menunggu telaah auditor',
                'keterangan' => 'Dinas menyatakan lampu menyala normal sedangkan warga melaporkan bohlam redup dan berkedip.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'TERTUTUP_WARGA',
                'kategori' => 'Rambu Lalu Lintas Rusak',
                'tipe_opd' => 'dishub',
                'judul' => 'Rambu petunjuk arah telah dipasang kembali dengan kokoh',
                'keterangan' => 'Warga mengonfirmasi pekerjaan selesai dengan baik dan menutup tiket laporan secara swadaya.',
                'keparahan' => 'ringan',
            ],
            [
                'status' => 'TERTUTUP_AUDITOR',
                'kategori' => 'Sampah Liar',
                'tipe_opd' => 'dlh',
                'judul' => 'Pengangkutan tumpukan sampah liar telah tuntas',
                'keterangan' => 'Auditor menyetujui penutupan tiket setelah memeriksa bukti foto pembersihan dan berita acara.',
                'keparahan' => 'sedang',
            ],
            [
                'status' => 'USULAN_TOLAK',
                'kategori' => 'Jembatan Rusak',
                'tipe_opd' => 'infra',
                'judul' => 'Usulan perbaikan jembatan penyeberangan orang',
                'keterangan' => 'Instansi mengusulkan penolakan karena aset JPO berada di bawah kewenangan kementerian pusat.',
                'keparahan' => 'berat',
            ],
            [
                'status' => 'DITOLAK',
                'kategori' => 'Jalan Berlubang',
                'tipe_opd' => 'infra',
                'judul' => 'Laporan jalan rusak di perumahan privat',
                'keterangan' => 'Ditolak oleh auditor karena jalan belum diserahterimakan sebagai aset fasos/fasum pemerintah daerah.',
                'keparahan' => 'ringan',
            ],
        ];

        DB::transaction(function () use ($bodetabekCities, $singkatanKotaMap, $wargaBodetabek, $auditor, $semuaKategori, $kasusTemplates): void {
            $nomorGlobal = 1;

            foreach ($bodetabekCities as $kota) {
                if (! isset($singkatanKotaMap[$kota->nama])) {
                    continue;
                }

                $singkatan = $singkatanKotaMap[$kota->nama];
                $kecamatanIds = Wilayah::where('induk_id', $kota->id)->pluck('id');
                $kelurahans = Wilayah::query()
                    ->where('tingkat', 'kelurahan')
                    ->whereIn('induk_id', $kecamatanIds)
                    ->orderBy('id')
                    ->get();

                if ($kelurahans->isEmpty()) {
                    continue;
                }

                // 1. Buat 1 Laporan PERLU_ROUTING per kota
                $nomorRouting = $nomorGlobal;
                $waktuRouting = CarbonImmutable::now()->subDays(20 - ($nomorRouting % 10));
                $pelaporRouting = $wargaBodetabek[$nomorRouting % $wargaBodetabek->count()];
                $kelurahanRouting = $kelurahans[$nomorRouting % $kelurahans->count()];
                $kategoriRouting = $semuaKategori->first();
                $nomorTiketRouting = sprintf('JAG-2026-BDT-ROUT-%03d', $nomorRouting);
                [$latRouting, $lngRouting] = $this->koordinatKelurahanAlami($kelurahanRouting, $nomorTiketRouting);

                $laporanRouting = Laporan::create([
                    'nomor_tiket' => $nomorTiketRouting,
                    'pelapor_id' => $pelaporRouting->id,
                    'kategori_id' => $kategoriRouting->id,
                    'instansi_id' => null,
                    'kelurahan_id' => $kelurahanRouting->id,
                    'judul' => "Laporan fasilitas di {$kelurahanRouting->nama}",
                    'keterangan' => 'Laporan fasilitas umum baru yang membutuhkan penentuan dan disposisi instansi teknis.',
                    'keparahan' => 'sedang',
                    'lintang' => $latRouting,
                    'bujur' => $lngRouting,
                    'akurasi_gps_m' => 8.0,
                    'lokasi_sumber' => 'gps',
                    'status' => 'PERLU_ROUTING',
                    'jenis_pendanaan' => null,
                    'tanggal_target_awal' => null,
                    'tanggal_target' => null,
                    'ronde_sengketa' => 0,
                    'jumlah_pengalihan' => 0,
                    'disembunyikan' => false,
                    'diteruskan_pertama_pada' => null,
                    'ditutup_pada' => null,
                    'created_at' => $waktuRouting,
                    'updated_at' => $waktuRouting,
                ]);
                $this->catat($laporanRouting, 'T-02', null, 'PERLU_ROUTING', $pelaporRouting, null, 'Aturan routing belum menemukan instansi penerima.', $waktuRouting);
                $this->fotoAwal($laporanRouting, $pelaporRouting, $waktuRouting);
                $nomorGlobal++;

                // 2. Buat 12 Laporan siklus hidup untuk kota ini
                foreach ($kasusTemplates as $i => $kasus) {
                    $nomorKasus = $i + 1;
                    $waktuKasus = CarbonImmutable::now()->subDays(50 - ($nomorKasus * 3));
                    $pelaporKasus = $wargaBodetabek[$nomorKasus % $wargaBodetabek->count()];
                    $kelurahanKasus = $kelurahans[$nomorKasus % $kelurahans->count()];
                    $kategoriKasus = $semuaKategori[$kasus['kategori']] ?? $semuaKategori->first();

                    $instansiKasus = match ($kasus['tipe_opd']) {
                        'infra' => Instansi::where('wilayah_id', $kota->id)
                            ->where(function ($q) {
                                $q->where('nama', 'like', 'Dinas Pekerjaan Umum%')
                                    ->orWhere('nama', 'like', 'Dinas Bina Marga%')
                                    ->orWhere('nama', 'like', 'Dinas Sumber Daya Air%');
                            })->first(),
                        'dishub' => Instansi::where('wilayah_id', $kota->id)
                            ->where('nama', 'like', 'Dinas Perhubungan%')->first(),
                        'dlh' => Instansi::where('wilayah_id', $kota->id)
                            ->where('nama', 'like', 'Dinas Lingkungan Hidup%')->first(),
                        default => null,
                    };

                    if (! $instansiKasus) {
                        continue;
                    }

                    $petugasKasus = User::where('instansi_id', $instansiKasus->id)->first()
                        ?: User::where('peran', 'instansi')->firstOrFail();

                    $nomorTiketKasus = sprintf('JAG-2026-BDT-%s-%03d', $singkatan, $nomorKasus);
                    [$latKasus, $lngKasus] = $this->koordinatKelurahanAlami($kelurahanKasus, $nomorTiketKasus);

                    $butuhTarget = in_array($kasus['status'], ['TERJADWAL_ANGGARAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);
                    $ditutup = in_array($kasus['status'], ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);

                    $laporanKasus = Laporan::create([
                        'nomor_tiket' => $nomorTiketKasus,
                        'pelapor_id' => $pelaporKasus->id,
                        'kategori_id' => $kategoriKasus->id,
                        'instansi_id' => $instansiKasus->id,
                        'kelurahan_id' => $kelurahanKasus->id,
                        'judul' => "{$kasus['judul']} di {$kelurahanKasus->nama}",
                        'keterangan' => $kasus['keterangan'],
                        'keparahan' => $kasus['keparahan'],
                        'lintang' => $latKasus,
                        'bujur' => $lngKasus,
                        'akurasi_gps_m' => 6.5,
                        'lokasi_sumber' => 'gps',
                        'status' => $kasus['status'],
                        'jenis_pendanaan' => $butuhTarget ? 'APBD_KOTA' : null,
                        'tanggal_target_awal' => $butuhTarget ? $waktuKasus->addDays(21)->toDateString() : null,
                        'tanggal_target' => $butuhTarget ? $waktuKasus->addDays(21)->toDateString() : null,
                        'ronde_sengketa' => in_array($kasus['status'], ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_AUDITOR'], true) ? 1 : 0,
                        'jumlah_pengalihan' => 0,
                        'disembunyikan' => false,
                        'diteruskan_pertama_pada' => $waktuKasus,
                        'ditutup_pada' => $ditutup ? $waktuKasus->addDays(8) : null,
                        'created_at' => $waktuKasus,
                        'updated_at' => $waktuKasus->addDays(8),
                    ]);

                    $this->catat($laporanKasus, 'T-01', null, 'DITERUSKAN', $pelaporKasus, $instansiKasus, 'Laporan diteruskan ke instansi penerima.', $waktuKasus);
                    $this->fotoAwal($laporanKasus, $pelaporKasus, $waktuKasus);
                    $this->linimasa($laporanKasus, $kasus['status'], $petugasKasus, $auditor, $waktuKasus);
                }
            }
        });
    }

    private function wargaDemo(Wilayah $kelurahan): Collection
    {
        $password = Hash::make('password123');
        foreach (range(1, 10) as $nomor) {
            User::updateOrCreate(['username' => "warga_demo_{$nomor}"], [
                'peran' => 'warga', 'status_akun' => 'aktif',
                'email_hash' => hash('sha256', "warga_demo_{$nomor}@example.test"),
                'kelurahan_id' => $kelurahan->id, 'instansi_id' => null, 'password' => $password,
                'wajib_ganti_sandi' => false, 'poin_peringatan' => 0, 'aktivitas_terakhir_pada' => now(),
            ]);
        }

        return User::query()->whereLike('username', 'warga_demo_%')->orderBy('id')->get();
    }

    private function wargaDemoJakarta(Wilayah $kelurahan): Collection
    {
        $password = Hash::make('password123');
        foreach (range(1, 5) as $nomor) {
            User::updateOrCreate(['username' => "warga_jkt_{$nomor}"], [
                'peran' => 'warga', 'status_akun' => 'aktif',
                'email_hash' => hash('sha256', "warga_jkt_{$nomor}@example.test"),
                'kelurahan_id' => $kelurahan->id, 'instansi_id' => null, 'password' => $password,
                'wajib_ganti_sandi' => false, 'poin_peringatan' => 0, 'aktivitas_terakhir_pada' => now(),
            ]);
        }

        return User::query()->whereLike('username', 'warga_jkt_%')->orderBy('id')->get();
    }

    private function wargaDemoBodetabek(Wilayah $kelurahan): Collection
    {
        $password = Hash::make('password123');
        foreach (range(1, 7) as $nomor) {
            User::updateOrCreate(['username' => "warga_bdt_{$nomor}"], [
                'peran' => 'warga', 'status_akun' => 'aktif',
                'email_hash' => hash('sha256', "warga_bdt_{$nomor}@example.test"),
                'kelurahan_id' => $kelurahan->id, 'instansi_id' => null, 'password' => $password,
                'wajib_ganti_sandi' => false, 'poin_peringatan' => 0, 'aktivitas_terakhir_pada' => now(),
            ]);
        }

        return User::query()->whereLike('username', 'warga_bdt_%')->orderBy('id')->get();
    }

    private function buatPerluRouting(int $nomor, $kelurahan, $kategori, $warga): void
    {
        $waktu = CarbonImmutable::now()->subDays(25 - $nomor);
        $pelapor = $warga[$nomor % $warga->count()];
        $kel = $kelurahan[$nomor % $kelurahan->count()];
        $kat = $kategori[$nomor % $kategori->count()];
        $nomorTiket = sprintf('JAG-2026-DEP-ROUT-%03d', $nomor);

        $laporan = Laporan::create($this->atributLaporan(
            $nomorTiket, null, $pelapor, $kel, $kat, 'PERLU_ROUTING', $waktu, 250 + $nomor,
        ));
        $this->catat($laporan, 'T-02', null, 'PERLU_ROUTING', $pelapor, null, 'Aturan routing belum menemukan instansi penerima.', $waktu);
        $this->fotoAwal($laporan, $pelapor, $waktu);
    }

    private function buatUntukInstansi(Instansi $instansi, User $petugas, User $auditor, string $status, int $nomor, int $index, $kelurahan, $kategori, $warga): void
    {
        $waktu = CarbonImmutable::now()->subDays(90 - (($index * 50) + $nomor));
        $pelapor = $warga[$nomor % $warga->count()];
        $kodeInstansi = $instansi->singkatan === 'DISRUMKIM'
            ? 'RUMKIM'
            : Str::upper(Str::replace(' ', '', $instansi->singkatan));
        $nomorTiket = sprintf('JAG-2026-DEP-%s-%03d', $kodeInstansi, $nomor);
        $kel = $kelurahan[($nomor + $index) % $kelurahan->count()];
        $kat = $kategori[($nomor + $index) % $kategori->count()];

        $laporan = Laporan::create($this->atributLaporan(
            $nomorTiket,
            $instansi, $pelapor, $kel, $kat, $status, $waktu, ($index * 50) + $nomor,
        ));
        $this->catat($laporan, 'T-01', null, 'DITERUSKAN', $pelapor, $instansi, 'Laporan diteruskan ke instansi penerima.', $waktu);
        $this->fotoAwal($laporan, $pelapor, $waktu);
        $this->linimasa($laporan, $status, $petugas, $auditor, $waktu);
    }

    private function atributLaporan(string $nomorTiket, ?Instansi $instansi, User $pelapor, Wilayah $kelurahan, Kategori $kategori, string $status, CarbonImmutable $waktu, int $penyebarKoordinat): array
    {
        $butuhTarget = in_array($status, ['TERJADWAL_ANGGARAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);
        $ditutup = in_array($status, ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);

        [$lintang, $bujur] = $this->koordinatKelurahanAlami($kelurahan, $nomorTiket);

        return [
            'nomor_tiket' => $nomorTiket, 'pelapor_id' => $pelapor->id, 'kategori_id' => $kategori->id,
            'instansi_id' => $instansi?->id, 'kelurahan_id' => $kelurahan->id,
            'judul' => "Data contoh {$nomorTiket}",
            'keterangan' => 'Laporan contoh untuk menampilkan beban kerja dan seluruh tahap penanganan.',
            'keparahan' => 'sedang', 'lintang' => $lintang, 'bujur' => $bujur,
            'akurasi_gps_m' => 7.5, 'lokasi_sumber' => 'gps', 'status' => $status,
            'jenis_pendanaan' => $butuhTarget ? 'APBD_KOTA' : null,
            'tanggal_target_awal' => $butuhTarget ? $waktu->addDays(21)->toDateString() : null,
            'tanggal_target' => $butuhTarget ? $waktu->addDays(21)->toDateString() : null,
            'ronde_sengketa' => in_array($status, ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_AUDITOR'], true) ? 1 : 0,
            'jumlah_pengalihan' => 0, 'disembunyikan' => false,
            'diteruskan_pertama_pada' => $instansi ? $waktu : null,
            'ditutup_pada' => $ditutup ? $waktu->addDays(8) : null,
            'created_at' => $waktu, 'updated_at' => $waktu->addDays(8),
        ];
    }

    /**
     * Menghasilkan titik koordinat acak alami di dalam batas bounding box kelurahan.
     * Menggunakan hash deterministik dari nomor tiket agar konsisten dan tidak berulang kaku.
     *
     * @return array{0: float, 1: float}
     */
    private function koordinatKelurahanAlami(Wilayah $kelurahan, string $nomorTiket): array
    {
        $minLat = (float) $kelurahan->min_lintang;
        $maxLat = (float) $kelurahan->max_lintang;
        $minLng = (float) $kelurahan->min_bujur;
        $maxLng = (float) $kelurahan->max_bujur;

        // Fallback jika kelurahan tidak memiliki koordinat bounding box
        if ($minLat == 0.0 && $maxLat == 0.0) {
            return [-6.402484, 106.794240];
        }

        // Hash deterministik dari nomor tiket
        $hashLat = hexdec(substr(md5($nomorTiket.'_lat'), 0, 8));
        $hashLng = hexdec(substr(md5($nomorTiket.'_lng'), 0, 8));

        // Rentang aman 15% s.d. 85% dari batas kotak kelurahan
        $faktorLat = 0.15 + (0.70 * (($hashLat % 100000) / 100000.0));
        $faktorLng = 0.15 + (0.70 * (($hashLng % 100000) / 100000.0));

        $lintang = round($minLat + (($maxLat - $minLat) * $faktorLat), 6);
        $bujur = round($minLng + (($maxLng - $minLng) * $faktorLng), 6);

        return [$lintang, $bujur];
    }

    /** @return array{0: float, 1: float} */
    private function koordinatDepok(int $penyebar): array
    {
        $hashLat = hexdec(substr(md5('depok_lat_'.$penyebar), 0, 8));
        $hashLng = hexdec(substr(md5('depok_lng_'.$penyebar), 0, 8));

        $minLat = -6.440000;
        $maxLat = -6.340000;
        $minLng = 106.750000;
        $maxLng = 106.870000;

        $faktorLat = 0.10 + (0.80 * (($hashLat % 100000) / 100000.0));
        $faktorLng = 0.10 + (0.80 * (($hashLng % 100000) / 100000.0));

        return [
            round($minLat + (($maxLat - $minLat) * $faktorLat), 6),
            round($minLng + (($maxLng - $minLng) * $faktorLng), 6),
        ];
    }

    private function linimasa(Laporan $laporan, string $status, User $petugas, User $auditor, CarbonImmutable $waktu): void
    {
        if ($status === 'DITERUSKAN') {
            return;
        }
        if (in_array($status, ['USULAN_TOLAK', 'DITOLAK'], true)) {
            $this->catat($laporan, 'T-07', 'DITERUSKAN', 'USULAN_TOLAK', $petugas, $laporan->instansi, 'Instansi mengusulkan penolakan laporan contoh.', $waktu->addDay());
            if ($status === 'DITOLAK') {
                $this->catat($laporan, 'T-08', 'USULAN_TOLAK', 'DITOLAK', $auditor, $laporan->instansi, 'Auditor menyetujui penolakan.', $waktu->addDays(2));
            }

            return;
        }
        $this->catat($laporan, 'T-04', 'DITERUSKAN', 'DITERIMA', $petugas, $laporan->instansi, 'Instansi menerima laporan.', $waktu->addDay());
        if ($status === 'DITERIMA') {
            return;
        }
        $this->catat($laporan, 'T-10', 'DITERIMA', 'DISURVEI', $petugas, $laporan->instansi, 'Survei lapangan selesai.', $waktu->addDays(2));
        if ($status === 'DISURVEI') {
            return;
        }
        $this->catat($laporan, 'T-11', 'DISURVEI', 'TERJADWAL_ANGGARAN', $petugas, $laporan->instansi, 'Anggaran dan target telah ditetapkan.', $waktu->addDays(3));
        if ($status === 'TERJADWAL_ANGGARAN') {
            return;
        }
        $this->catat($laporan, 'T-12', 'TERJADWAL_ANGGARAN', 'DIKERJAKAN', $petugas, $laporan->instansi, 'Pekerjaan penanganan dimulai.', $waktu->addDays(4));
        BeritaAcara::create(['laporan_id' => $laporan->id, 'instansi_id' => $laporan->instansi_id, 'penulis_id' => $petugas->id, 'versi' => 1, 'kegiatan' => 'Pekerjaan penanganan dilakukan sesuai rencana.', 'hasil' => 'Perbaikan fisik siap diajukan kepada warga.', 'created_at' => $waktu->addDays(5)]);
        if ($status === 'DIKERJAKAN') {
            return;
        }
        $foto = $this->fotoSesudah($laporan, $petugas, $waktu->addDays(6));
        $this->catat($laporan, 'T-13', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', $petugas, $laporan->instansi, 'Perbaikan diajukan untuk verifikasi warga.', $waktu->addDays(6));
        $ronde = $this->ronde($laporan, $foto, $status, $waktu->addDays(6));
        if ($status === 'MENUNGGU_VERIFIKASI') {
            return;
        }
        if ($status === 'TERTUTUP_WARGA') {
            $this->catat($laporan, 'T-14', 'MENUNGGU_VERIFIKASI', 'TERTUTUP_WARGA', null, $laporan->instansi, 'Kuorum warga menyetujui hasil perbaikan.', $waktu->addDays(7));

            return;
        }
        if ($status === 'DISENGKETAKAN') {
            $this->catat($laporan, 'T-15', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', null, $laporan->instansi, 'Kuorum warga belum menyetujui perbaikan.', $waktu->addDays(7));
            Sengketa::create(['ronde_id' => $ronde->id, 'tenggat' => $waktu->addDays(14)->toDateString(), 'created_at' => $waktu->addDays(7)]);

            return;
        }
        $this->catat($laporan, 'T-16', 'MENUNGGU_VERIFIKASI', 'MENUNGGU_KEPUTUSAN_AUDITOR', null, $laporan->instansi, 'Ronde verifikasi berakhir tanpa keputusan warga.', $waktu->addDays(7));
        $eskalasi = Eskalasi::create(['laporan_id' => $laporan->id, 'pemicu' => 'TANPA_KUORUM', 'ronde_id' => $ronde->id, 'created_at' => $waktu->addDays(7), 'selesai_pada' => $status === 'TERTUTUP_AUDITOR' ? $waktu->addDays(8) : null, 'selesai_alasan' => $status === 'TERTUTUP_AUDITOR' ? 'diputuskan' : null]);
        if ($status === 'TERTUTUP_AUDITOR') {
            $this->catat($laporan, 'T-19', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_AUDITOR', $auditor, $laporan->instansi, 'Auditor menyatakan perbaikan telah sah.', $waktu->addDays(8));
            KeputusanAuditor::create(['eskalasi_id' => $eskalasi->id, 'auditor_id' => $auditor->id, 'jenis' => 'PERBAIKAN_SAH', 'alasan' => 'Bukti perbaikan dan hasil verifikasi memadai.', 'waktu' => $waktu->addDays(8)]);
        }
    }

    private function fotoAwal(Laporan $laporan, User $pengguna, CarbonImmutable $waktu): Lampiran
    {
        return $this->lampiran($laporan, $pengguna, 'awal', 'foto-sebelum-01.jpg', $waktu);
    }

    private function fotoSesudah(Laporan $laporan, User $pengguna, CarbonImmutable $waktu): Lampiran
    {
        return $this->lampiran($laporan, $pengguna, 'sesudah', 'foto-sesudah-01.jpg', $waktu);
    }

    private function lampiran(Laporan $laporan, User $pengguna, string $tahap, string $nama, CarbonImmutable $waktu): Lampiran
    {
        return Lampiran::create(['uuid' => (string) Str::uuid(), 'laporan_id' => $laporan->id, 'pengguna_id' => $pengguna->id, 'tahap' => $tahap, 'path' => "laporan/{$laporan->nomor_tiket}/{$nama}", 'ukuran_byte' => 0, 'lebar' => 1280, 'tinggi' => 960, 'gps_cocok' => $tahap === 'awal' ? null : true, 'jarak_m' => $tahap === 'awal' ? null : 10.0, 'akurasi_m' => $tahap === 'awal' ? null : 7.5, 'created_at' => $waktu]);
    }

    private function ronde(Laporan $laporan, Lampiran $foto, string $status, CarbonImmutable $waktu): RondeVerifikasi
    {
        $hasil = match ($status) {
            'TERTUTUP_WARGA' => 'setuju', 'DISENGKETAKAN' => 'tolak', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_AUDITOR' => 'kedaluwarsa', default => null
        };

        return RondeVerifikasi::create(['laporan_id' => $laporan->id, 'nomor' => 1, 'k' => 3.0, 'k_param' => ['sumber' => 'data_contoh', 'kmin' => 3], 'lampiran_sesudah_id' => $foto->id, 'mulai' => $waktu, 'batas_waktu' => $waktu->addDays(14), 'hasil' => $hasil, 'selesai_pada' => $hasil ? $waktu->addDay() : null, 'created_at' => $waktu]);
    }

    private function catat(Laporan $laporan, string $kode, ?string $lama, string $baru, ?User $pelaku, ?Instansi $instansi, string $catatan, CarbonImmutable $waktu): void
    {
        RiwayatStatus::create(['laporan_id' => $laporan->id, 'kode_transisi' => $kode, 'status_lama' => $lama, 'status_baru' => $baru, 'pelaku_id' => $pelaku?->id, 'instansi_id' => $instansi?->id, 'catatan' => $catatan, 'waktu' => $waktu]);
    }
}

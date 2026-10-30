<?php

namespace App\Services;

use App\Models\HariLibur;
use App\Models\Kategori;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LaporanService
{
    public function __construct(
        protected BatasLaporanService $batasService,
        protected WilayahService $wilayahService,
        protected FotoLaporanService $fotoService,
        protected RoutingTiketService $routingService,
    ) {}

    /**
     * Membuat laporan aduan baru dalam transaksi database atomik (FR-LAP-01).
     *
     * @param  array{
     *     kategori_id: int,
     *     keparahan: string,
     *     keterangan: string,
     *     lintang: float,
     *     bujur: float,
     *     akurasi_gps_m: ?float,
     *     lokasi_sumber: string,
     *     foto: string
     * }  $data
     *
     * @throws ValidationException
     */
    public function buatLaporan(User $warga, array $data): Laporan
    {
        // 1. Verifikasi Batas Kuota (FR-LAP-04 & P-17)
        $kuota = $this->batasService->periksaKuota($warga);
        if (! $kuota['diizinkan']) {
            throw ValidationException::withMessages([
                'kuota' => [$kuota['pesan'] ?? 'Batas pelaporan per jam telah tercapai.'],
            ]);
        }

        // 2. Deteksi Kelurahan dari Titik Koordinat (FR-WIL-01)
        $kelurahan = $this->wilayahService->kelurahanDariTitik($data['lintang'], $data['bujur']);
        if (! $kelurahan) {
            throw ValidationException::withMessages([
                'lintang' => ['Titik koordinat berada di luar wilayah jangkauan layanan (Kota Depok & DKI Jakarta).'],
            ]);
        }

        // 3. Ambil Kategori Kerusakan
        $kategori = Kategori::findOrFail($data['kategori_id']);

        // 4. Proses Foto Kamera & Pembersihan EXIF (FR-LAP-02 & ST-16)
        try {
            $fotoInfo = $this->fotoService->prosesFotoKamera($data['foto']);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'foto' => [$e->getMessage()],
            ]);
        }

        // 5. Tentukan Disposisi Dinas & Status Awal (FR-TIK-01 & BR-STS-05)
        $routing = $this->routingService->tentukanRouting($kategori->id, $kelurahan);
        $isDiteruskan = $routing['status'] === 'DITERUSKAN';

        // 6. Susun Judul Otomatis (SRS AS-06)
        $judul = "{$kategori->nama} di Kelurahan {$kelurahan->nama}";

        // 7. Eksekusi Transaksi Database Atomik
        return DB::transaction(function () use ($warga, $kategori, $kelurahan, $judul, $data, $routing, $isDiteruskan, $fotoInfo) {
            // Aktifkan izin sesi PostgreSQL trigger (jagains_jaga_status)
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            // Ambil nomor urut sequence
            $seqRow = DB::selectOne("SELECT nextval('laporan_nomor_seq') AS val");
            $seq = $seqRow->val ?? rand(1000, 99999);
            $tahun = (int) date('Y');
            $nomorTiket = sprintf('JAG-%04d-%06d', $tahun, $seq);

            // Buat laporan awal dengan SLA null agar patuh pada laporan_sla_ck (0 non-null)
            $laporan = Laporan::create([
                'nomor_tiket' => $nomorTiket,
                'pelapor_id' => $warga->id,
                'kategori_id' => $kategori->id,
                'instansi_id' => $routing['instansi_id'],
                'kelurahan_id' => $kelurahan->id,
                'judul' => $judul,
                'keterangan' => $data['keterangan'],
                'keparahan' => $data['keparahan'] ?? 'sedang',
                'lintang' => $data['lintang'],
                'bujur' => $data['bujur'],
                'akurasi_gps_m' => $data['akurasi_gps_m'] ?? null,
                'lokasi_sumber' => $data['lokasi_sumber'],
                'status' => $routing['status'],
                'diteruskan_pertama_pada' => $isDiteruskan ? now() : null,
            ]);

            // Catat riwayat status pertama T-01 (Append-Only)
            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-01',
                'status_lama' => null,
                'status_baru' => $laporan->status,
                'pelaku_id' => $warga->id,
                'instansi_id' => $laporan->instansi_id,
                'catatan' => 'Laporan aduan dikirim oleh warga',
                'waktu' => now(),
            ]);

            // Jika berstatus DITERUSKAN, isi 6 kolom jangkar SLA secara bersamaan (6 non-null)
            if ($isDiteruskan) {
                $jatuhTempo = $this->hitungJatuhTempoHariKerja(now(), 3)->toDateString();
                DB::table('laporan')->where('id', $laporan->id)->update([
                    'sla_tahap' => 'RESPONS',
                    'sla_riwayat_id' => $riwayat->id,
                    'sla_mulai_pada' => now(),
                    'sla_batas' => 3,
                    'sla_satuan' => 'hari_kerja',
                    'sla_jatuh_tempo' => $jatuhTempo,
                ]);
            }

            // Simpan lampiran bukti foto kamera (Tahap Awal)
            Lampiran::create([
                'uuid' => $fotoInfo['uuid'],
                'laporan_id' => $laporan->id,
                'pengguna_id' => $warga->id,
                'tahap' => 'awal',
                'path' => $fotoInfo['path'],
                'ukuran_byte' => $fotoInfo['ukuran_byte'],
                'lebar' => $fotoInfo['lebar'],
                'tinggi' => $fotoInfo['tinggi'],
                'gps_cocok' => true,
                'akurasi_m' => $data['akurasi_gps_m'] ?? null,
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Menghitung tanggal jatuh tempo dengan melompati akhir pekan dan hari libur nasional (BR-SLA-01).
     */
    public function hitungJatuhTempoHariKerja(CarbonInterface $mulai, int $targetHariKerja): CarbonInterface
    {
        $current = $mulai->copy();
        $hariDitambahkan = 0;

        while ($hariDitambahkan < $targetHariKerja) {
            $current = $current->addDay();
            // Lewati Sabtu dan Minggu
            if ($current->isWeekend()) {
                continue;
            }
            // Lewati hari libur nasional jika terdaftar di database
            if (HariLibur::where('tanggal', $current->toDateString())->exists()) {
                continue;
            }
            $hariDitambahkan++;
        }

        return $current;
    }
}

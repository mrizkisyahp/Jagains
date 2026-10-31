<?php

namespace App\Services;

use App\Models\BeritaAcara;
use App\Models\HariLibur;
use App\Models\Instansi;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\ParameterKuorum;
use App\Models\Pengalihan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InstansiTiketService
{
    public function __construct(
        protected FotoLaporanService $fotoService,
        protected NotifikasiService $notifikasiService,
    ) {}

    /**
     * Mengambil daftar antrean tiket khusus untuk instansi petugas yang login (FR-TIK-02).
     *
     * @param  array{
     *     status?: string,
     *     q?: string,
     *     kategori_id?: int,
     *     per_page?: int
     * }  $filters
     */
    public function ambilAntreanInstansi(User $petugas, array $filters = []): LengthAwarePaginator
    {
        if (! $petugas->instansi_id) {
            throw new \InvalidArgumentException('Pengguna tidak memiliki tautan ke instansi mana pun.');
        }

        $query = Laporan::query()
            ->where('instansi_id', $petugas->instansi_id)
            ->with([
                'kategori:id,nama',
                'kelurahan.induk.induk',
                'lampiran' => fn ($q) => $q->where('tahap', 'awal')->latest('id'),
                'beritaAcara' => fn ($q) => $q->latest('versi'),
                'pengalihan' => fn ($q) => $q->with('instansiAsal:id,nama', 'instansiTujuan:id,nama'),
            ]);

        // Filter berdasarkan status alur kerja
        if (! empty($filters['status'])) {
            $status = strtoupper($filters['status']);
            if ($status === 'PERLU_RESPONS') {
                $query->where('status', 'DITERUSKAN');
            } elseif ($status === 'SURVEI_ANGGARAN') {
                $query->whereIn('status', ['DITERIMA', 'DISURVEI']);
            } elseif ($status === 'PENGERJAAN') {
                $query->whereIn('status', ['TERJADWAL_ANGGARAN', 'DIKERJAKAN']);
            } elseif ($status === 'SELESAI_VERIFIKASI') {
                $query->whereIn('status', ['MENUNGGU_VERIFIKASI', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR']);
            } elseif ($status === 'SENGKETA') {
                $query->whereIn('status', ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR']);
            } else {
                $query->where('status', $status);
            }
        }

        // Filter pencarian teks nomor tiket atau judul
        if (! empty($filters['q'])) {
            $keyword = trim($filters['q']);
            $query->where(function ($q) use ($keyword) {
                $q->where('nomor_tiket', 'ilike', "%{$keyword}%")
                    ->orWhere('judul', 'ilike', "%{$keyword}%");
            });
        }

        if (! empty($filters['kategori_id'])) {
            $query->where('kategori_id', $filters['kategori_id']);
        }

        // Urutan default: Urgensi SLA tercepat (paling mendesak) lebih dahulu, lalu tanggal tiket
        $query->orderByRaw('sla_jatuh_tempo ASC NULLS LAST')
            ->orderBy('created_at', 'ASC');

        $perPage = ! empty($filters['per_page']) ? (int) $filters['per_page'] : 15;

        return $query->paginate($perPage);
    }

    /**
     * Menerima tiket aduan baru oleh instansi terkait (FR-TIK-03 & T-02).
     */
    public function terimaTiket(Laporan $laporan, User $petugas, ?string $catatan = null): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DITERUSKAN') {
            throw ValidationException::withMessages([
                'status' => ["Tiket berstatus {$laporan->status} tidak dapat diterima ulang."],
            ]);
        }

        return DB::transaction(function () use ($laporan, $petugas, $catatan) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-02',
                'status_lama' => 'DITERUSKAN',
                'status_baru' => 'DITERIMA',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => $catatan ?: 'Laporan diterima oleh instansi teknis untuk disurvei.',
                'waktu' => now(),
            ]);

            // SLA survei 5 hari kerja (Parameter P-02)
            $jatuhTempo = $this->hitungJatuhTempoHariKerja(now(), 5)->toDateString();

            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'DITERIMA',
                'sla_tahap' => 'SURVEI',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => 5,
                'sla_satuan' => 'hari_kerja',
                'sla_jatuh_tempo' => $jatuhTempo,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Mengalihkan tiket ke instansi teknis lain maksimal 2 kali (FR-TIK-03, P-07, ST-02).
     */
    public function alihkanTiket(Laporan $laporan, int $instansiTujuanId, string $alasan, User $petugas): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DITERUSKAN') {
            throw ValidationException::withMessages([
                'status' => ['Pengalihan hanya dapat dilakukan pada tiket berstatus DITERUSKAN.'],
            ]);
        }

        if ($laporan->jumlah_pengalihan >= 2) {
            throw ValidationException::withMessages([
                'pengalihan' => ['Tiket telah mencapai batas maksimal 2 kali pengalihan (Parameter P-07). Silakan tangani atau kembalikan ke Admin.'],
            ]);
        }

        if ($instansiTujuanId === (int) $laporan->instansi_id) {
            throw ValidationException::withMessages([
                'instansi_tujuan_id' => ['Instansi tujuan tidak boleh sama dengan instansi penanggung jawab saat ini.'],
            ]);
        }

        $instansiTujuan = Instansi::findOrFail($instansiTujuanId);

        return DB::transaction(function () use ($laporan, $instansiTujuan, $alasan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            // Catat riwayat pengalihan detail
            Pengalihan::create([
                'laporan_id' => $laporan->id,
                'instansi_asal_id' => $laporan->instansi_id,
                'instansi_tujuan_id' => $instansiTujuan->id,
                'alasan' => $alasan,
                'pelaku_id' => $petugas->id,
                'waktu' => now(),
            ]);

            // Catat riwayat status transisi T-03
            RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-03',
                'status_lama' => 'DITERUSKAN',
                'status_baru' => 'DITERUSKAN',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $instansiTujuan->id,
                'catatan' => "Dialihkan ke {$instansiTujuan->nama}: {$alasan}",
                'waktu' => now(),
            ]);

            // Update laporan dengan instansi baru dan kenaikan counter pengalihan
            // Jam kumulatif SLA respons tidak diulang (ST-02)
            DB::table('laporan')->where('id', $laporan->id)->update([
                'instansi_id' => $instansiTujuan->id,
                'jumlah_pengalihan' => $laporan->jumlah_pengalihan + 1,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Mengembalikan tiket ke meja Admin untuk disposisi manual (FR-TIK-03 & T-04).
     */
    public function kembalikanKeAdmin(Laporan $laporan, string $alasan, User $petugas): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DITERUSKAN') {
            throw ValidationException::withMessages([
                'status' => ['Hanya tiket berstatus DITERUSKAN yang dapat dikembalikan ke Admin.'],
            ]);
        }

        return DB::transaction(function () use ($laporan, $alasan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-04',
                'status_lama' => 'DITERUSKAN',
                'status_baru' => 'PERLU_ROUTING',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => "Dikembalikan ke Admin: {$alasan}",
                'waktu' => now(),
            ]);

            // Status menjadi PERLU_ROUTING, hilangkan kolom SLA (semua 6 kolom null)
            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'PERLU_ROUTING',
                'instansi_id' => null,
                'sla_tahap' => null,
                'sla_riwayat_id' => null,
                'sla_mulai_pada' => null,
                'sla_batas' => null,
                'sla_satuan' => null,
                'sla_jatuh_tempo' => null,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan']);
        });
    }

    /**
     * Menandai survei lapangan telah selesai (FR-TIK-04 & T-05).
     */
    public function selesaikanSurvei(Laporan $laporan, ?string $catatan, User $petugas): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DITERIMA') {
            throw ValidationException::withMessages([
                'status' => ["Survei hanya dapat diselesaikan saat tiket berstatus DITERIMA (status saat ini: {$laporan->status})."],
            ]);
        }

        return DB::transaction(function () use ($laporan, $catatan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-05',
                'status_lama' => 'DITERIMA',
                'status_baru' => 'DISURVEI',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => $catatan ?: 'Survei lapangan telah rampung dilaksanakan.',
                'waktu' => now(),
            ]);

            // SLA tahap anggaran 10 hari kerja (Parameter P-03)
            $jatuhTempo = $this->hitungJatuhTempoHariKerja(now(), 10)->toDateString();

            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'DISURVEI',
                'sla_tahap' => 'ANGGARAN',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => 10,
                'sla_satuan' => 'hari_kerja',
                'sla_jatuh_tempo' => $jatuhTempo,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Menjadwalkan jenis anggaran dan komitmen janji tanggal target publik (FR-TIK-05 & T-06).
     */
    public function jadwalkanAnggaran(
        Laporan $laporan,
        string $jenisPendanaan,
        string $tanggalTarget,
        User $petugas,
        ?string $catatan = null
    ): Laporan {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DISURVEI') {
            throw ValidationException::withMessages([
                'status' => ["Penjadwalan anggaran hanya dapat dilakukan saat tiket berstatus DISURVEI (status saat ini: {$laporan->status})."],
            ]);
        }

        $targetDate = Carbon::parse($tanggalTarget)->startOfDay();
        if ($targetDate->isPast()) {
            throw ValidationException::withMessages([
                'tanggal_target' => ['Tanggal target penyelesaian tidak boleh berada di masa lalu.'],
            ]);
        }

        if ($targetDate->diffInDays(now()->startOfDay()) > 180) {
            throw ValidationException::withMessages([
                'tanggal_target' => ['Tanggal target maksimal 180 hari dari hari ini (Parameter P-15).'],
            ]);
        }

        return DB::transaction(function () use ($laporan, $jenisPendanaan, $targetDate, $catatan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-06',
                'status_lama' => 'DISURVEI',
                'status_baru' => 'TERJADWAL_ANGGARAN',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => $catatan ?: "Penetapan pendanaan {$jenisPendanaan} dengan komitmen target perbaikan {$targetDate->toDateString()}.",
                'waktu' => now(),
            ]);

            $totalHariKalender = max(1, (int) now()->diffInDays($targetDate));

            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'TERJADWAL_ANGGARAN',
                'jenis_pendanaan' => $jenisPendanaan,
                'tanggal_target' => $targetDate->toDateString(),
                'tanggal_target_awal' => $targetDate->toDateString(),
                'sla_tahap' => 'PELAKSANAAN',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => $totalHariKalender,
                'sla_satuan' => 'hari_kalender',
                'sla_jatuh_tempo' => $targetDate->toDateString(),
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Memulai pelaksanaan pengerjaan fisik di lapangan (FR-TIK-06 & T-07).
     */
    public function mulaiPengerjaan(Laporan $laporan, User $petugas, ?string $catatan = null): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'TERJADWAL_ANGGARAN') {
            throw ValidationException::withMessages([
                'status' => ["Pengerjaan fisik hanya dapat dimulai dari status TERJADWAL_ANGGARAN (status saat ini: {$laporan->status})."],
            ]);
        }

        return DB::transaction(function () use ($laporan, $catatan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-07',
                'status_lama' => 'TERJADWAL_ANGGARAN',
                'status_baru' => 'DIKERJAKAN',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => $catatan ?: 'Pelaksanaan fisik pengerjaan di lapangan resmi dimulai.',
                'waktu' => now(),
            ]);

            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'DIKERJAKAN',
                'sla_riwayat_id' => $riwayat->id,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Menyimpan Berita Acara pelaksanaan pengerjaan fisik multi-versi append-only (FR-TIK-07).
     *
     * @param  array{
     *     kegiatan: string,
     *     hasil: string,
     *     hambatan?: ?string
     * }  $data
     */
    public function simpanBeritaAcara(Laporan $laporan, array $data, User $petugas): BeritaAcara
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        $maxVersi = BeritaAcara::where('laporan_id', $laporan->id)->max('versi') ?? 0;
        $versiBaru = $maxVersi + 1;

        return BeritaAcara::create([
            'laporan_id' => $laporan->id,
            'instansi_id' => $petugas->instansi_id,
            'penulis_id' => $petugas->id,
            'versi' => $versiBaru,
            'kegiatan' => $data['kegiatan'],
            'hasil' => $data['hasil'],
            'hambatan' => $data['hambatan'] ?? null,
            'created_at' => now(),
        ]);
    }

    /**
     * Mengajukan penyelesaian fisik wajib foto kamera langsung dan validasi geofence GPS 50m (FR-TIK-08 & ST-03).
     */
    public function ajukanSelesai(
        Laporan $laporan,
        string $fotoBase64,
        float $lat,
        float $lng,
        ?float $akurasi,
        User $petugas,
        ?string $catatan = null
    ): Laporan {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if (! in_array($laporan->status, ['DIKERJAKAN', 'DISENGKETAKAN'], true)) {
            throw ValidationException::withMessages([
                'status' => ["Pengajuan selesai hanya dapat diajukan saat tiket DIKERJAKAN atau DISENGKETAKAN (status saat ini: {$laporan->status})."],
            ]);
        }

        // Prasyarat: Harus ada minimal 1 Berita Acara yang diterbitkan
        if (! BeritaAcara::where('laporan_id', $laporan->id)->exists()) {
            throw ValidationException::withMessages([
                'berita_acara' => ['Harap terbitkan minimal satu Berita Acara pengerjaan sebelum mengajukan penyelesaian fisik.'],
            ]);
        }

        // Validasi Geofence GPS (P-12: Toleransi maks 50 meter)
        $jarakM = $this->hitungJarakMeter(
            (float) $laporan->lintang,
            (float) $laporan->bujur,
            $lat,
            $lng
        );

        if ($jarakM > 50.0) {
            throw ValidationException::withMessages([
                'lokasi' => [
                    sprintf(
                        'Posisi koordinat Anda berjarak %.1f meter dari lokasi kerusakan. Pengajuan selesai wajib dilakukan di lokasi fisik (radius maksimal 50 meter sesuai Parameter P-12).',
                        $jarakM
                    ),
                ],
            ]);
        }

        // Proses kompresi dan pembersihan EXIF foto bukti sesudah (ST-16)
        try {
            $fotoInfo = $this->fotoService->prosesFotoKamera($fotoBase64);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'foto' => [$e->getMessage()],
            ]);
        }

        $hasilLaporan = DB::transaction(function () use ($laporan, $fotoInfo, $jarakM, $akurasi, $catatan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            // 1. Simpan lampiran foto sesudah
            $lampiran = Lampiran::create([
                'uuid' => $fotoInfo['uuid'],
                'laporan_id' => $laporan->id,
                'pengguna_id' => $petugas->id,
                'tahap' => 'sesudah',
                'path' => $fotoInfo['path'],
                'ukuran_byte' => $fotoInfo['ukuran_byte'],
                'lebar' => $fotoInfo['lebar'],
                'tinggi' => $fotoInfo['tinggi'],
                'gps_cocok' => true,
                'jarak_m' => $jarakM,
                'akurasi_m' => $akurasi,
                'created_at' => now(),
            ]);

            // 2. Catat riwayat status T-08
            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-08',
                'status_lama' => $laporan->status,
                'status_baru' => 'MENUNGGU_VERIFIKASI',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => $catatan ?: 'Pekerjaan fisik dinyatakan selesai oleh instansi. Menunggu verifikasi kuorum warga.',
                'waktu' => now(),
            ]);

            // 3. Update status laporan ke MENUNGGU_VERIFIKASI (Jendela 14 hari dikelola oleh ronde_verifikasi)
            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'MENUNGGU_VERIFIKASI',
                'sla_tahap' => null,
                'sla_riwayat_id' => null,
                'sla_mulai_pada' => null,
                'sla_batas' => null,
                'sla_satuan' => null,
                'sla_jatuh_tempo' => null,
                'updated_at' => now(),
            ]);

            // 4. Hitung kuorum K dan buka Ronde Verifikasi ke-1 (atau ronde berikutnya jika sengketa)
            $nomorRonde = (RondeVerifikasi::where('laporan_id', $laporan->id)->max('nomor') ?? 0) + 1;
            $kuorumK = $this->hitungKuorumK($laporan);

            RondeVerifikasi::create([
                'laporan_id' => $laporan->id,
                'nomor' => $nomorRonde,
                'k' => $kuorumK,
                'k_param' => [
                    'k_bp' => 2,
                    'kmin' => 2.0,
                    'kmax' => 5.0,
                ],
                'lampiran_sesudah_id' => $lampiran->id,
                'mulai' => now(),
                'batas_waktu' => now()->addDays(14),
                'created_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi', 'rondeVerifikasi']);
        });

        // Kirim siaran notifikasi ke seluruh warga kelurahan tiket (BR-NTF-01b)
        $this->notifikasiService->kirimBroadcastKelurahan(
            (int) $laporan->kelurahan_id,
            $hasilLaporan,
            "Pekerjaan fisik pada tiket {$laporan->nomor_tiket} telah diajukan selesai oleh instansi. Berikan suara verifikasi kedaulatan Anda dalam 14 hari.",
            (int) $hasilLaporan->rondeVerifikasi()->max('nomor')
        );

        return $hasilLaporan;
    }

    /**
     * Memberikan tanggapan resmi publik oleh instansi pada linimasa tiket (FR-TIK-09).
     */
    public function tanggapanResmi(Laporan $laporan, string $tanggapan, User $petugas): RiwayatStatus
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        return RiwayatStatus::create([
            'laporan_id' => $laporan->id,
            'kode_transisi' => 'T-09',
            'status_lama' => $laporan->status,
            'status_baru' => $laporan->status,
            'pelaku_id' => $petugas->id,
            'instansi_id' => $petugas->instansi_id,
            'catatan' => "Tanggapan Resmi Instansi: {$tanggapan}",
            'waktu' => now(),
        ]);
    }

    /**
     * Mengusulkan penolakan laporan dengan alasan baku untuk dinilai Auditor (FR-TIK-13).
     */
    public function usulkanTolak(Laporan $laporan, string $alasanBaku, string $keterangan, User $petugas): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if ($laporan->status !== 'DITERUSKAN') {
            throw ValidationException::withMessages([
                'status' => ['Usulan penolakan hanya dapat diajukan saat tiket berstatus DITERUSKAN.'],
            ]);
        }

        return DB::transaction(function () use ($laporan, $alasanBaku, $keterangan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $catatanLengkap = sprintf('[Alasan: %s] %s', strtoupper($alasanBaku), $keterangan);

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-09',
                'status_lama' => 'DITERUSKAN',
                'status_baru' => 'USULAN_TOLAK',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => "Usulan penolakan diajukan ke Auditor: {$catatanLengkap}",
                'waktu' => now(),
            ]);

            // SLA instansi terjeda (semua 6 kolom SLA dinullkan)
            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'USULAN_TOLAK',
                'sla_tahap' => null,
                'sla_riwayat_id' => null,
                'sla_mulai_pada' => null,
                'sla_batas' => null,
                'sla_satuan' => null,
                'sla_jatuh_tempo' => null,
                'updated_at' => now(),
            ]);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Merevisi janji target penyelesaian maksimal 2 kali per tiket (FR-TIK-14 & P-16).
     */
    public function revisiTanggalTarget(Laporan $laporan, string $tanggalBaru, string $alasan, User $petugas): Laporan
    {
        $this->pastikanKewenanganTiket($laporan, $petugas);

        if (! in_array($laporan->status, ['TERJADWAL_ANGGARAN', 'DIKERJAKAN'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Revisi tanggal target hanya dapat dilakukan pada tiket TERJADWAL_ANGGARAN atau DIKERJAKAN.'],
            ]);
        }

        // Cek riwayat revisi target sebelumnya (maksimal 2x)
        $jumlahRevisi = RiwayatStatus::where('laporan_id', $laporan->id)
            ->where('kode_transisi', 'T-14')
            ->count();

        if ($jumlahRevisi >= 2) {
            throw ValidationException::withMessages([
                'revisi' => ['Tanggal target penyelesaian hanya dapat direvisi maksimal 2 kali per tiket (Parameter P-16).'],
            ]);
        }

        $targetBaru = Carbon::parse($tanggalBaru)->startOfDay();
        if ($targetBaru->isPast()) {
            throw ValidationException::withMessages([
                'tanggal_target_baru' => ['Tanggal target baru tidak boleh berada di masa lalu.'],
            ]);
        }

        return DB::transaction(function () use ($laporan, $targetBaru, $alasan, $petugas) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $tanggalLamaStr = $laporan->tanggal_target ? $laporan->tanggal_target->toDateString() : 'Belum ditetapkan';

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-14',
                'status_lama' => $laporan->status,
                'status_baru' => $laporan->status,
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => "Revisi tanggal target dari {$tanggalLamaStr} menjadi {$targetBaru->toDateString()}. Alasan: {$alasan}",
                'waktu' => now(),
            ]);

            $updatePayload = [
                'tanggal_target' => $targetBaru->toDateString(),
                'updated_at' => now(),
            ];

            if ($laporan->sla_tahap !== null) {
                $updatePayload['sla_jatuh_tempo'] = $targetBaru->toDateString();
            }

            DB::table('laporan')->where('id', $laporan->id)->update($updatePayload);

            return $laporan->fresh(['kategori', 'kelurahan', 'instansi']);
        });
    }

    /**
     * Memastikan tiket adalah kewenangan instansi petugas yang sedang login (ST-09).
     */
    protected function pastikanKewenanganTiket(Laporan $laporan, User $petugas): void
    {
        if ((int) $laporan->instansi_id !== (int) $petugas->instansi_id) {
            throw ValidationException::withMessages([
                'otorisasi' => ['Anda tidak memiliki wewenang untuk menindaklanjuti tiket milik instansi lain.'],
            ]);
        }
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
            if ($current->isWeekend()) {
                continue;
            }
            if (HariLibur::where('tanggal', $current->toDateString())->exists()) {
                continue;
            }
            $hariDitambahkan++;
        }

        return $current;
    }

    /**
     * Menghitung jarak dua titik koordinat dalam meter menggunakan formula Haversine (P-12).
     */
    public function hitungJarakMeter(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 1);
    }

    /**
     * Menghitung kuorum K untuk ronde verifikasi warga (P-08 s/d P-10).
     */
    protected function hitungKuorumK(Laporan $laporan): float
    {
        $param = ParameterKuorum::where('wilayah_id', $laporan->kelurahan_id)->first();
        $kmin = $param ? (float) $param->kmin : 2.0;
        $kmax = $param ? (float) $param->kmax : 5.0;
        $kbp = $param ? (int) $param->k_bp : 2; // 2%

        // Ambil jumlah akun warga aktif di kelurahan terkait (P-13: 90 hari)
        $wargaAktif = User::where('peran', 'warga')
            ->where('kelurahan_id', $laporan->kelurahan_id)
            ->where('status_akun', 'aktif')
            ->count();

        $kalkulasi = round(($wargaAktif * $kbp) / 100, 1);

        return (float) max($kmin, min($kmax, $kalkulasi));
    }
}

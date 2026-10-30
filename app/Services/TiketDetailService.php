<?php

namespace App\Services;

use App\Models\Dukungan;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\LaporanPelanggaran;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TiketDetailService
{
    public function __construct(
        public PetaLaporanService $petaLaporanService
    ) {}

    /**
     * Mengambil seluruh data detail tiket laporan dengan sanitasi Zero-Knowledge Privacy (BR-AKN-01).
     * Meniadakan nama/email pelapor, pendukung, maupun pemberi suara kuorum dari payload respons.
     *
     * @return array<string, mixed>|null
     */
    public function ambilDetailTiket(string $nomorTiket, ?User $user = null): ?array
    {
        $laporan = Laporan::query()
            ->with([
                'kategori:id,nama',
                'instansi:id,nama',
                'kelurahan:id,nama,induk_id',
                'kelurahan.induk:id,nama',
                'lampiran' => fn ($q) => $q->orderBy('id', 'asc'),
                'beritaAcara' => fn ($q) => $q->with('instansi:id,nama')->orderBy('versi', 'asc'),
                'riwayatStatus' => fn ($q) => $q->with(['instansi:id,nama', 'pelaku:id,peran'])->orderBy('waktu', 'asc'),
                'pengalihan' => fn ($q) => $q->with(['instansiAsal:id,nama', 'instansiTujuan:id,nama'])->orderBy('waktu', 'asc'),
                'rondeVerifikasi' => fn ($q) => $q->with('verifikasiWarga')->orderBy('nomor', 'asc'),
                'eskalasi.keputusanAuditor' => fn ($q) => $q->orderBy('waktu', 'asc'),
            ])
            ->withCount('dukungan')
            ->where('nomor_tiket', $nomorTiket)
            ->first();

        if (! $laporan) {
            return null;
        }

        $evaluasiSla = $this->petaLaporanService->tentukanKondisiSla($laporan);

        // Jika tiket disembunyikan oleh moderasi (FR-ADM-06 & FR-TKT-01d)
        if ($laporan->disembunyikan) {
            return [
                'id' => $laporan->id,
                'nomor_tiket' => $laporan->nomor_tiket,
                'judul' => '[Konten Disembunyikan oleh Tim Moderasi Jagains]',
                'keterangan' => '',
                'keparahan' => $laporan->keparahan,
                'status' => $laporan->status,
                'disembunyikan' => true,
                'kategori_nama' => $laporan->kategori?->nama ?? 'Umum',
                'instansi_nama' => $laporan->instansi?->nama,
                'kelurahan_nama' => $laporan->kelurahan?->nama ?? '',
                'kecamatan_nama' => $laporan->kelurahan?->induk?->nama ?? 'Kota Depok',
                'lintang' => (float) $laporan->lintang,
                'bujur' => (float) $laporan->bujur,
                'kondisi_sla' => $evaluasiSla['kondisi'],
                'label_sla' => $evaluasiSla['label'],
                'warna_sla' => $evaluasiSla['warna'],
                'ikon_sla' => $evaluasiSla['ikon'],
                'sisa_hari_sla' => $evaluasiSla['sisa_hari'],
                'sisa_sla_teks' => $evaluasiSla['sisa_teks'],
                'foto_awal' => null,
                'foto_sesudah' => null,
                'foto_verifikasi' => [],
                'berita_acara' => [],
                'riwayat_status' => [],
                'pengalihan' => [],
                'kuorum_verifikasi' => null,
                'catatan_auditor' => [],
                'total_dukungan' => (int) $laporan->dukungan_count,
                'sudah_didukung' => false,
                'created_at' => $laporan->created_at?->toIso8601String(),
            ];
        }

        // Cek status dukungan oleh user yang sedang login
        $sudahDidukung = false;
        if ($user) {
            $sudahDidukung = Dukungan::where('laporan_id', $laporan->id)
                ->where('pengguna_id', $user->id)
                ->exists();
        }

        // Format lampiran foto (Awal, Sesudah, Verifikasi)
        $lampiranAwal = $laporan->lampiran->firstWhere('tahap', 'awal');
        $lampiranSesudah = $laporan->lampiran->where('tahap', 'sesudah')->sortByDesc('created_at')->first();
        $lampiranVerifikasi = $laporan->lampiran->where('tahap', 'verifikasi')->map(fn (Lampiran $l) => $this->formatLampiran($l))->values()->all();

        // Format berita acara (Append-Only)
        $beritaAcaraList = $laporan->beritaAcara->map(function ($ba) use ($laporan) {
            return [
                'id' => $ba->id,
                'versi' => (int) $ba->versi,
                'kegiatan' => $ba->kegiatan,
                'hasil' => $ba->hasil,
                'hambatan' => $ba->hambatan,
                'instansi_nama' => $ba->instansi?->nama ?? $laporan->instansi?->nama ?? 'Instansi Penanggung Jawab',
                'created_at' => $ba->created_at?->toIso8601String(),
            ];
        })->values()->all();

        // Format riwayat status (T-01 s/d T-20)
        $riwayatStatusList = $laporan->riwayatStatus->map(function ($rs) {
            return [
                'id' => $rs->id,
                'kode_transisi' => $rs->kode_transisi,
                'status_lama' => $rs->status_lama,
                'status_baru' => $rs->status_baru,
                'catatan' => $rs->catatan,
                'waktu' => $rs->waktu?->toIso8601String(),
                'instansi_nama' => $rs->instansi?->nama,
                'peran_pelaku' => $rs->pelaku?->peran ?? 'sistem',
            ];
        })->values()->all();

        // Format pengalihan dinas
        $pengalihanList = $laporan->pengalihan->map(function ($p) {
            return [
                'id' => $p->id,
                'instansi_asal' => $p->instansiAsal?->nama ?? 'Instansi Asal',
                'instansi_tujuan' => $p->instansiTujuan?->nama ?? 'Instansi Tujuan',
                'alasan' => $p->alasan,
                'waktu' => $p->waktu?->toIso8601String(),
            ];
        })->values()->all();

        // Format ronde & kuorum verifikasi
        $kuorumData = null;
        $rondeTerakhir = $laporan->rondeVerifikasi->sortByDesc('nomor')->first();
        if ($rondeTerakhir) {
            $suaraSetuju = (float) $rondeTerakhir->verifikasiWarga->where('setuju', true)->sum('bobot');
            $suaraTolak = (float) $rondeTerakhir->verifikasiWarga->where('setuju', false)->sum('bobot');
            $targetK = (float) $rondeTerakhir->k;
            $persentaseSetuju = $targetK > 0 ? min(100.0, round(($suaraSetuju / $targetK) * 100, 1)) : 0.0;

            $alasanPenolakan = $rondeTerakhir->verifikasiWarga
                ->where('setuju', false)
                ->whereNotNull('alasan')
                ->map(fn ($vw) => [
                    'alasan' => $vw->alasan,
                    'jalur' => $vw->jalur,
                    'waktu' => $vw->waktu?->toIso8601String(),
                ])
                ->values()
                ->all();

            $kuorumData = [
                'nomor_ronde' => (int) $rondeTerakhir->nomor,
                'target_k' => $targetK,
                'suara_setuju_bobot' => $suaraSetuju,
                'suara_tolak_bobot' => $suaraTolak,
                'total_pemilih' => $rondeTerakhir->verifikasiWarga->count(),
                'persentase_setuju' => $persentaseSetuju,
                'mulai' => $rondeTerakhir->mulai?->toIso8601String(),
                'batas_waktu' => $rondeTerakhir->batas_waktu?->toIso8601String(),
                'hasil' => $rondeTerakhir->hasil,
                'selesai_pada' => $rondeTerakhir->selesai_pada?->toIso8601String(),
                'alasan_penolakan' => $alasanPenolakan,
            ];
        }

        // Format catatan keputusan auditor
        $catatanAuditorList = [];
        foreach ($laporan->eskalasi as $esk) {
            foreach ($esk->keputusanAuditor as $ka) {
                $catatanAuditorList[] = [
                    'id' => $ka->id,
                    'jenis' => $ka->jenis,
                    'alasan' => $ka->alasan,
                    'perintah' => $ka->perintah,
                    'tenggat' => $ka->tenggat?->toDateString(),
                    'waktu' => $ka->waktu?->toIso8601String(),
                ];
            }
        }

        return [
            'id' => $laporan->id,
            'nomor_tiket' => $laporan->nomor_tiket,
            'judul' => $laporan->judul,
            'keterangan' => $laporan->keterangan ?? '',
            'keparahan' => $laporan->keparahan,
            'status' => $laporan->status,
            'disembunyikan' => false,
            'kategori_nama' => $laporan->kategori?->nama ?? 'Umum',
            'instansi_nama' => $laporan->instansi?->nama,
            'kelurahan_nama' => $laporan->kelurahan?->nama ?? '',
            'kecamatan_nama' => $laporan->kelurahan?->induk?->nama ?? 'Kota Depok',
            'lintang' => (float) $laporan->lintang,
            'bujur' => (float) $laporan->bujur,
            'akurasi_gps_m' => $laporan->akurasi_gps_m ? (float) $laporan->akurasi_gps_m : null,
            'lokasi_sumber' => $laporan->lokasi_sumber,
            'kondisi_sla' => $evaluasiSla['kondisi'],
            'label_sla' => $evaluasiSla['label'],
            'warna_sla' => $evaluasiSla['warna'],
            'ikon_sla' => $evaluasiSla['ikon'],
            'sisa_hari_sla' => $evaluasiSla['sisa_hari'],
            'sisa_sla_teks' => $evaluasiSla['sisa_teks'],
            'foto_awal' => $this->formatLampiran($lampiranAwal),
            'foto_sesudah' => $this->formatLampiran($lampiranSesudah),
            'foto_verifikasi' => $lampiranVerifikasi,
            'berita_acara' => $beritaAcaraList,
            'riwayat_status' => $riwayatStatusList,
            'pengalihan' => $pengalihanList,
            'kuorum_verifikasi' => $kuorumData,
            'catatan_auditor' => $catatanAuditorList,
            'total_dukungan' => (int) $laporan->dukungan_count,
            'sudah_didukung' => $sudahDidukung,
            'created_at' => $laporan->created_at?->toIso8601String(),
        ];
    }

    /**
     * Memberikan atau membatalkan dukungan warga pada tiket laporan (FR-INT-01).
     *
     * @return array{
     *     sukses: bool,
     *     pesan: string,
     *     sudah_didukung?: bool,
     *     total_dukungan?: int,
     *     status_code: int
     * }
     */
    public function toggleDukungan(string $nomorTiket, User $user): array
    {
        // Validasi Akun Aktif & Tidak Dibekukan
        if ($user->status_akun === 'dibekukan' || (int) $user->poin_peringatan >= 5) {
            return [
                'sukses' => false,
                'pesan' => 'Akun Anda sedang dibekukan sehingga tidak dapat memberikan dukungan.',
                'status_code' => 403,
            ];
        }

        if ($user->peran !== 'warga') {
            return [
                'sukses' => false,
                'pesan' => 'Hanya warga terdaftar yang dapat memberikan dukungan terhadap laporan.',
                'status_code' => 403,
            ];
        }

        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->first();
        if (! $laporan) {
            return [
                'sukses' => false,
                'pesan' => 'Tiket laporan tidak ditemukan.',
                'status_code' => 404,
            ];
        }

        // Validasi Status Tiket Bukan Final
        if (in_array($laporan->status, ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'], true)) {
            return [
                'sukses' => false,
                'pesan' => 'Laporan ini telah berstatus final dan tidak menerima dukungan baru.',
                'status_code' => 422,
            ];
        }

        return DB::transaction(function () use ($laporan, $user) {
            $dukungan = Dukungan::where('laporan_id', $laporan->id)
                ->where('pengguna_id', $user->id)
                ->first();

            if ($dukungan) {
                $dukungan->delete();
                $sudahDidukung = false;
                $pesan = 'Dukungan untuk laporan ini telah dibatalkan.';
            } else {
                Dukungan::create([
                    'laporan_id' => $laporan->id,
                    'pengguna_id' => $user->id,
                    'created_at' => now(),
                ]);
                $sudahDidukung = true;
                $pesan = 'Terima kasih, dukungan Anda berhasil dicatat.';
            }

            // Perbarui aktivitas terakhir warga
            $user->update(['aktivitas_terakhir_pada' => now()]);

            $totalDukungan = Dukungan::where('laporan_id', $laporan->id)->count();

            return [
                'sukses' => true,
                'pesan' => $pesan,
                'sudah_didukung' => $sudahDidukung,
                'total_dukungan' => $totalDukungan,
                'status_code' => 200,
            ];
        });
    }

    /**
     * Merekam pelaporan pelanggaran konten oleh warga ke antrean moderasi admin (FR-INT-03).
     *
     * @return array{
     *     sukses: bool,
     *     pesan: string,
     *     id?: int,
     *     status_code: int
     * }
     */
    public function laporkanKonten(string $nomorTiket, User $user, string $alasan, ?string $catatan = null): array
    {
        if ($user->status_akun === 'dibekukan' || (int) $user->poin_peringatan >= 5) {
            return [
                'sukses' => false,
                'pesan' => 'Akun Anda sedang dibekukan sehingga tidak dapat melaporkan konten.',
                'status_code' => 403,
            ];
        }

        $laporan = Laporan::where('nomor_tiket', $nomorTiket)->first();
        if (! $laporan) {
            return [
                'sukses' => false,
                'pesan' => 'Tiket laporan tidak ditemukan.',
                'status_code' => 404,
            ];
        }

        // Cek laporan pelanggaran yang masih berstatus menunggu dari pelapor yang sama
        $laporanAktif = LaporanPelanggaran::where('laporan_id', $laporan->id)
            ->where('pelapor_id', $user->id)
            ->where('status', 'menunggu')
            ->exists();

        if ($laporanAktif) {
            return [
                'sukses' => false,
                'pesan' => 'Anda telah memiliki laporan pelanggaran yang sedang menunggu peninjauan pada tiket ini.',
                'status_code' => 422,
            ];
        }

        $pelanggaran = LaporanPelanggaran::create([
            'laporan_id' => $laporan->id,
            'pelapor_id' => $user->id,
            'alasan' => $alasan,
            'catatan' => $catatan ? trim($catatan) : null,
            'status' => 'menunggu',
        ]);

        $user->update(['aktivitas_terakhir_pada' => now()]);

        return [
            'sukses' => true,
            'pesan' => 'Laporan pelanggaran konten telah diterima dan masuk dalam antrean moderasi.',
            'id' => $pelanggaran->id,
            'status_code' => 201,
        ];
    }

    /**
     * Helper untuk memformat objek lampiran foto.
     *
     * @return array<string, mixed>|null
     */
    private function formatLampiran(?Lampiran $lampiran): ?array
    {
        if (! $lampiran) {
            return null;
        }

        $url = str_starts_with($lampiran->path, 'http')
            ? $lampiran->path
            : asset('storage/'.ltrim($lampiran->path, '/'));

        return [
            'uuid' => $lampiran->uuid,
            'url' => $url,
            'tahap' => $lampiran->tahap,
            'lebar' => (int) $lampiran->lebar,
            'tinggi' => (int) $lampiran->tinggi,
            'gps_cocok' => $lampiran->gps_cocok,
            'jarak_m' => $lampiran->jarak_m ? (float) $lampiran->jarak_m : null,
            'akurasi_m' => $lampiran->akurasi_m ? (float) $lampiran->akurasi_m : null,
            'created_at' => $lampiran->created_at?->toIso8601String(),
        ];
    }
}

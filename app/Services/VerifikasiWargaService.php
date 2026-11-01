<?php

namespace App\Services;

use App\Models\Eskalasi;
use App\Models\HariLibur;
use App\Models\Lampiran;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\RondeVerifikasi;
use App\Models\Sengketa;
use App\Models\User;
use App\Models\VerifikasiWarga;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VerifikasiWargaService
{
    public function __construct(
        protected FotoLaporanService $fotoService,
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * Mengambil antrean tiket MENUNGGU_VERIFIKASI pada kelurahan akun warga login (FR-VER-01).
     */
    public function ambilAntreanVerifikasi(User $user, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        if ($user->peran !== 'warga') {
            abort(403, 'Akses antrean verifikasi hanya untuk warga.');
        }

        $query = Laporan::query()
            ->with([
                'kategori:id,nama',
                'kelurahan:id,nama,tingkat',
                'instansi:id,nama,singkatan',
                'rondeVerifikasi' => function ($q) {
                    $q->whereNull('hasil')->latest('nomor');
                },
                'rondeVerifikasi.lampiranSesudah',
                'beritaAcara' => function ($q) {
                    $q->latest('versi')->limit(1);
                },
                'lampiran' => function ($q) {
                    $q->where('tahap', 'awal')->limit(1);
                },
            ])
            ->where('status', 'MENUNGGU_VERIFIKASI')
            ->where('kelurahan_id', $user->kelurahan_id);

        // Filter tab: 'perlu_suara' (default) vs 'semua'
        $tab = $filters['tab'] ?? 'perlu_suara';
        if ($tab === 'perlu_suara') {
            $query->whereDoesntHave('rondeVerifikasi.verifikasiWarga', function ($q) use ($user) {
                $q->where('pengguna_id', $user->id);
            });
        }

        if (! empty($filters['q'])) {
            $keyword = '%'.strtolower(trim($filters['q'])).'%';
            $query->where(function ($q) use ($keyword) {
                $q->whereRaw('LOWER(nomor_tiket) LIKE ?', [$keyword])
                    ->orWhereRaw('LOWER(judul) LIKE ?', [$keyword])
                    ->orWhereRaw('LOWER(deskripsi) LIKE ?', [$keyword]);
            });
        }

        if (! empty($filters['kategori_id'])) {
            $query->where('kategori_id', $filters['kategori_id']);
        }

        // Urutkan berdasarkan batas waktu ronde verifikasi yang paling mendesak
        $paginator = $query->orderBy('updated_at', 'desc')->paginate($perPage)->withQueryString();

        // Tambahkan metadata komputasi kuorum & status hak suara warga untuk setiap tiket
        $paginator->getCollection()->transform(function (Laporan $laporan) use ($user) {
            $rondeAktif = $laporan->rondeVerifikasi->first();

            $sudahSuara = false;
            $suaraUser = null;
            $totalSetuju = 0.0;
            $totalTolak = 0.0;
            $adaJalurASetuju = false;
            $adaJalurATolak = false;
            $targetK = 3.0;
            $sisaHari = 14;

            if ($rondeAktif) {
                $targetK = (float) $rondeAktif->k;

                $suaraList = VerifikasiWarga::where('ronde_id', $rondeAktif->id)->get();
                $suaraUser = $suaraList->firstWhere('pengguna_id', $user->id);
                $sudahSuara = $suaraUser !== null;

                $totalSetuju = (float) $suaraList->where('setuju', true)->sum('bobot');
                $totalTolak = (float) $suaraList->where('setuju', false)->sum('bobot');

                $adaJalurASetuju = $suaraList->where('setuju', true)->where('jalur', 'A')->isNotEmpty();
                $adaJalurATolak = $suaraList->where('setuju', false)->where('jalur', 'A')->isNotEmpty();

                $batasWaktu = Carbon::parse($rondeAktif->batas_waktu);
                $sisaHari = max(0, (int) ceil(now()->floatDiffInDays($batasWaktu, false)));
            }

            $laporan->kuorum_info = [
                'ronde_id' => $rondeAktif?->id,
                'nomor_ronde' => $rondeAktif?->nomor ?? 1,
                'target_k' => $targetK,
                'suara_setuju_bobot' => $totalSetuju,
                'suara_tolak_bobot' => $totalTolak,
                'persentase_setuju' => $targetK > 0 ? min(100, round(($totalSetuju / $targetK) * 100)) : 0,
                'ada_jalur_a_setuju' => $adaJalurASetuju,
                'ada_jalur_a_tolak' => $adaJalurATolak,
                'sisa_hari' => $sisaHari,
                'sudah_memberi_suara' => $sudahSuara,
                'suara_user' => $suaraUser ? [
                    'setuju' => $suaraUser->setuju,
                    'jalur' => $suaraUser->jalur,
                    'bobot' => (float) $suaraUser->bobot,
                    'alasan' => $suaraUser->alasan,
                    'waktu' => $suaraUser->waktu?->toISOString(),
                ] : null,
                'bisa_memberi_suara' => ! $sudahSuara && $user->status_akun === 'aktif' && $rondeAktif !== null,
            ];

            return $laporan;
        });

        return $paginator;
    }

    /**
     * Mengambil detail satu tiket beserta informasi ronde verifikasi untuk halaman detail tiket / dialog verifikasi.
     */
    public function ambilDetailVerifikasi(User $user, string $nomorTiket): array
    {
        $laporan = Laporan::query()
            ->with([
                'kategori:id,nama',
                'kelurahan:id,nama,tingkat',
                'instansi:id,nama,singkatan',
                'lampiran' => fn ($q) => $q->orderBy('created_at'),
                'beritaAcara' => fn ($q) => $q->orderByDesc('versi'),
                'rondeVerifikasi' => fn ($q) => $q->orderByDesc('nomor'),
                'rondeVerifikasi.lampiranSesudah',
            ])
            ->where('nomor_tiket', $nomorTiket)
            ->firstOrFail();

        $rondeAktif = $laporan->rondeVerifikasi->firstWhere('hasil', null);

        $sudahSuara = false;
        $suaraUser = null;
        $totalSetuju = 0.0;
        $totalTolak = 0.0;
        $adaJalurASetuju = false;
        $adaJalurATolak = false;
        $targetK = 3.0;
        $sisaHari = 0;
        $daftarSuaraPublik = [];

        if ($rondeAktif) {
            $targetK = (float) $rondeAktif->k;

            $suaraList = VerifikasiWarga::where('ronde_id', $rondeAktif->id)
                ->with(['lampiran:id,path,ukuran_byte,lebar,tinggi'])
                ->orderBy('waktu')
                ->get();

            $suaraUser = $suaraList->firstWhere('pengguna_id', $user->id);
            $sudahSuara = $suaraUser !== null;

            $totalSetuju = (float) $suaraList->where('setuju', true)->sum('bobot');
            $totalTolak = (float) $suaraList->where('setuju', false)->sum('bobot');

            $adaJalurASetuju = $suaraList->where('setuju', true)->where('jalur', 'A')->isNotEmpty();
            $adaJalurATolak = $suaraList->where('setuju', false)->where('jalur', 'A')->isNotEmpty();

            $batasWaktu = Carbon::parse($rondeAktif->batas_waktu);
            $sisaHari = max(0, (int) ceil(now()->floatDiffInDays($batasWaktu, false)));

            // Suara publik tanpa identitas pengguna (ST-08, BR-VER-10)
            $daftarSuaraPublik = $suaraList->map(function ($s) {
                return [
                    'id' => $s->id,
                    'setuju' => $s->setuju,
                    'jalur' => $s->jalur,
                    'bobot' => (float) $s->bobot,
                    'alasan' => $s->alasan,
                    'lampiran_foto' => $s->lampiran ? asset('storage/'.$s->lampiran->path) : null,
                    'waktu' => $s->waktu?->toISOString(),
                ];
            });
        }

        // Cek kelayakan hak suara
        $kelurahanCocok = (int) $user->kelurahan_id === (int) $laporan->kelurahan_id;
        $isWarga = $user->peran === 'warga';
        $isAktif = $user->status_akun === 'aktif';
        $isMenungguVerif = $laporan->status === 'MENUNGGU_VERIFIKASI';

        $bisaMemberiSuara = $isWarga && $isAktif && $kelurahanCocok && $isMenungguVerif && ! $sudahSuara && ($rondeAktif !== null);

        $alasanTidakBisa = null;
        if (! $isWarga) {
            $alasanTidakBisa = 'Hak verifikasi kuorum hanya dimiliki oleh akun warga.';
        } elseif (! $isAktif) {
            $alasanTidakBisa = 'Akun Anda tidak aktif atau sedang dibekukan.';
        } elseif (! $kelurahanCocok) {
            $alasanTidakBisa = "Hak verifikasi hanya dimiliki oleh warga berdomisili di Kelurahan {$laporan->kelurahan?->nama}.";
        } elseif (! $isMenungguVerif) {
            $alasanTidakBisa = 'Tiket ini sedang tidak berada dalam tahap verifikasi warga.';
        } elseif ($sudahSuara) {
            $alasanTidakBisa = 'Anda sudah memberikan suara konfirmasi pada ronde verifikasi ini.';
        } elseif ($rondeAktif === null) {
            $alasanTidakBisa = 'Sesi ronde verifikasi belum dibuka atau telah berakhir.';
        }

        return [
            'laporan' => $laporan,
            'ronde_aktif' => $rondeAktif,
            'target_k' => $targetK,
            'suara_setuju_bobot' => $totalSetuju,
            'suara_tolak_bobot' => $totalTolak,
            'ada_jalur_a_setuju' => $adaJalurASetuju,
            'ada_jalur_a_tolak' => $adaJalurATolak,
            'sisa_hari' => $sisaHari,
            'sudah_memberi_suara' => $sudahSuara,
            'bisa_memberi_suara' => $bisaMemberiSuara,
            'alasan_tidak_bisa' => $alasanTidakBisa,
            'suara_user' => $suaraUser,
            'daftar_suara_publik' => $daftarSuaraPublik,
        ];
    }

    /**
     * Memproses pengiriman suara verifikasi warga dengan validasi geofence dan bobot (FR-VER-02, FR-VER-03, FR-VER-07).
     *
     * @param  array{
     *     setuju: bool,
     *     jalur: string,
     *     foto_base64?: ?string,
     *     latitude?: ?float,
     *     longitude?: ?float,
     *     akurasi_m?: ?float,
     *     alasan?: ?string
     * }  $data
     * @return array{
     *     status_laporan: string,
     *     keputusan: string,
     *     pesan: string,
     *     suara_id: int
     * }
     *
     * @throws ValidationException
     */
    public function kirimSuara(User $user, Laporan $laporan, array $data): array
    {
        // 1. Validasi Otorisasi Hak Akses (FR-VER-07, ST-09)
        if ($user->peran !== 'warga') {
            abort(403, 'Akses ditolak: Hanya pengguna dengan peran warga yang dapat memberikan suara verifikasi.');
        }

        if ($user->status_akun !== 'aktif') {
            throw ValidationException::withMessages([
                'akun' => ['Akun Anda tidak aktif atau sedang dibekukan sehingga tidak dapat memberikan suara.'],
            ]);
        }

        if ((int) $user->kelurahan_id !== (int) $laporan->kelurahan_id) {
            abort(403, "Hak verifikasi hanya dimiliki oleh warga yang berdomisili di Kelurahan {$laporan->kelurahan?->nama}.");
        }

        if ($laporan->status !== 'MENUNGGU_VERIFIKASI') {
            throw ValidationException::withMessages([
                'status' => ["Tiket saat ini berstatus {$laporan->status}. Suara hanya dapat diberikan saat tiket MENUNGGU_VERIFIKASI."],
            ]);
        }

        $setuju = (bool) $data['setuju'];
        $jalur = strtoupper(trim($data['jalur'] ?? 'B'));
        $alasan = isset($data['alasan']) ? trim($data['alasan']) : null;

        // 2. Validasi Alasan jika menolak (FR-VER-03, AS-05)
        if (! $setuju && (empty($alasan) || mb_strlen($alasan) < 10)) {
            throw ValidationException::withMessages([
                'alasan' => ['Alasan penolakan wajib diisi secara rinci minimal 10 karakter.'],
            ]);
        }

        // 3. Validasi Jalur A (Kamera Langsung + Geofence GPS <= 50 meter) (FR-VER-02, ST-03, ST-16)
        $lampiranId = null;
        $jarakM = null;
        $akurasiM = null;

        if ($jalur === 'A') {
            if (empty($data['foto_base64'])) {
                throw ValidationException::withMessages([
                    'foto' => ['Foto kamera langsung di lokasi wajib diambil untuk verifikasi Jalur A.'],
                ]);
            }

            if (! isset($data['latitude'], $data['longitude'])) {
                throw ValidationException::withMessages([
                    'lokasi' => ['Koordinat GPS perangkat wajib disertakan saat memotret verifikasi Jalur A.'],
                ]);
            }

            $latWarga = (float) $data['latitude'];
            $lngWarga = (float) $data['longitude'];
            $akurasiM = isset($data['akurasi_m']) && $data['akurasi_m'] !== null ? (float) $data['akurasi_m'] : 10.0;

            // Hitung jarak Haversine ke titik lokasi kerusakan awal laporan
            $jarakM = $this->hitungJarakMeter(
                (float) $laporan->lintang,
                (float) $laporan->bujur,
                $latWarga,
                $lngWarga
            );

            // Toleransi jarak maksimal 50 meter (P-12, ST-03)
            if ($jarakM > 50.0) {
                throw ValidationException::withMessages([
                    'lokasi' => [
                        sprintf(
                            'Posisi koordinat Anda berjarak %.1f meter dari titik kerusakan. Verifikasi Jalur A wajib dilakukan di lokasi (radius maksimal 50 meter). Silakan gunakan Jalur B jika Anda tidak berada di lokasi.',
                            $jarakM
                        ),
                    ],
                ]);
            }

            // Toleransi akurasi sinyal GPS maksimal 500 meter (diperluas untuk mengakomodasi penentuan posisi berbasis peramban laptop/Wi-Fi dan pengujian indoor)
            if ($akurasiM > 500.0) {
                throw ValidationException::withMessages([
                    'lokasi' => ["Akurasi GPS perangkat Anda terlalu rendah ({$akurasiM} meter). Harap tunggu sinyal GPS lebih stabil atau gunakan Jalur B."],
                ]);
            }

            // Proses kompresi dan pembersihan EXIF foto
            try {
                $fotoInfo = $this->fotoService->prosesFotoKamera($data['foto_base64']);
            } catch (\InvalidArgumentException $e) {
                throw ValidationException::withMessages([
                    'foto' => [$e->getMessage()],
                ]);
            }
        }

        $bobot = ($jalur === 'A') ? 1.0 : 0.5;

        // 4. Eksekusi Database Transaction Atomik dengan Row-Level Locking (FR-VER-04, BR-VER-05)
        return DB::transaction(function () use (
            $user,
            $laporan,
            $setuju,
            $jalur,
            $bobot,
            $alasan,
            $jarakM,
            $akurasiM,
            $data
        ) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            // Kunci baris laporan & ronde verifikasi untuk mencegah race condition
            $laporanTerkunci = Laporan::where('id', $laporan->id)->lockForUpdate()->firstOrFail();

            if ($laporanTerkunci->status !== 'MENUNGGU_VERIFIKASI') {
                throw ValidationException::withMessages([
                    'status' => ['Tiket telah selesai diverifikasi oleh suara warga lain.'],
                ]);
            }

            $ronde = RondeVerifikasi::where('laporan_id', $laporanTerkunci->id)
                ->whereNull('hasil')
                ->latest('nomor')
                ->lockForUpdate()
                ->first();

            if (! $ronde) {
                throw ValidationException::withMessages([
                    'ronde' => ['Sesi ronde verifikasi untuk tiket ini tidak ditemukan atau telah ditutup.'],
                ]);
            }

            if (now()->greaterThan($ronde->batas_waktu)) {
                throw ValidationException::withMessages([
                    'batas_waktu' => ['Batas waktu 14 hari verifikasi untuk tiket ini telah berakhir.'],
                ]);
            }

            // Cegah suara ganda per akun per ronde (BR-VER-07)
            $sudahSuara = VerifikasiWarga::where('ronde_id', $ronde->id)
                ->where('pengguna_id', $user->id)
                ->exists();

            if ($sudahSuara) {
                throw ValidationException::withMessages([
                    'suara' => ['Anda sudah pernah memberikan suara pada ronde verifikasi ini.'],
                ]);
            }

            // Simpan lampiran foto warga jika Jalur A
            $lampiranId = null;
            if ($jalur === 'A' && ! empty($data['foto_base64'])) {
                $fotoInfo = $this->fotoService->prosesFotoKamera($data['foto_base64']);
                $lampiran = Lampiran::create([
                    'uuid' => $fotoInfo['uuid'],
                    'laporan_id' => $laporanTerkunci->id,
                    'pengguna_id' => $user->id,
                    'tahap' => 'verifikasi',
                    'path' => $fotoInfo['path'],
                    'ukuran_byte' => $fotoInfo['ukuran_byte'],
                    'lebar' => $fotoInfo['lebar'],
                    'tinggi' => $fotoInfo['tinggi'],
                    'gps_cocok' => true,
                    'jarak_m' => $jarakM,
                    'akurasi_m' => $akurasiM,
                    'created_at' => now(),
                ]);
                $lampiranId = $lampiran->id;
            }

            // Simpan suara verifikasi warga (Append-Only)
            $suara = VerifikasiWarga::create([
                'ronde_id' => $ronde->id,
                'pengguna_id' => $user->id,
                'setuju' => $setuju,
                'jalur' => $jalur,
                'bobot' => $bobot,
                'lampiran_id' => $lampiranId,
                'alasan' => $setuju ? null : $alasan,
                'waktu' => now(),
            ]);

            // Evaluasi Kuorum K (FR-VER-04, BR-VER-03, BR-VER-04)
            $hasilEvaluasi = $this->evaluasiKuorum($laporanTerkunci, $ronde);

            return [
                'suara_id' => $suara->id,
                'status_laporan' => $laporanTerkunci->fresh()->status,
                'keputusan' => $hasilEvaluasi['keputusan'],
                'pesan' => $hasilEvaluasi['pesan'],
            ];
        });
    }

    /**
     * Mengevaluasi kuorum akumulasi suara setuju vs tolak terhadap K (FR-VER-04, BR-VER-03, BR-VER-04).
     *
     * @return array{keputusan: string, pesan: string}
     */
    public function evaluasiKuorum(Laporan $laporan, RondeVerifikasi $ronde): array
    {
        $targetK = (float) $ronde->k;

        $suaraSetuju = (float) VerifikasiWarga::where('ronde_id', $ronde->id)
            ->where('setuju', true)
            ->sum('bobot');

        $suaraTolak = (float) VerifikasiWarga::where('ronde_id', $ronde->id)
            ->where('setuju', false)
            ->sum('bobot');

        $adaJalurASetuju = VerifikasiWarga::where('ronde_id', $ronde->id)
            ->where('setuju', true)
            ->where('jalur', 'A')
            ->exists();

        $adaJalurATolak = VerifikasiWarga::where('ronde_id', $ronde->id)
            ->where('setuju', false)
            ->where('jalur', 'A')
            ->exists();

        // 1. KASUS 1: KUORUM SETUJU LOLOS (BR-VER-03)
        // Syarat: Bobot setuju mencapai K DAN minimal ada 1 suara setuju Jalur A
        if ($suaraSetuju >= $targetK && $adaJalurASetuju) {
            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'TERTUTUP_WARGA',
                'ditutup_pada' => now(),
                'sla_tahap' => null,
                'sla_riwayat_id' => null,
                'sla_mulai_pada' => null,
                'sla_batas' => null,
                'sla_satuan' => null,
                'sla_jatuh_tempo' => null,
                'updated_at' => now(),
            ]);

            $ronde->update([
                'hasil' => 'setuju',
                'selesai_pada' => now(),
            ]);

            RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-14',
                'status_lama' => 'MENUNGGU_VERIFIKASI',
                'status_baru' => 'TERTUTUP_WARGA',
                'pelaku_id' => null,
                'instansi_id' => $laporan->instansi_id,
                'catatan' => sprintf(
                    'Perbaikan disetujui kuorum warga (Bobot Setuju: %.1f / Target K: %.1f dengan bukti Jalur A). Tiket ditutup sah oleh warga.',
                    $suaraSetuju,
                    $targetK
                ),
                'waktu' => now(),
            ]);

            // Kirim notifikasi hasil verifikasi lolos ke pelapor dan pendukung (BR-NTF-01c)
            $this->notifikasiService->kirimKePelaporDanPendukung(
                laporan: $laporan,
                tipe: 'TIKET_TERTUTUP_WARGA',
                pesan: "Kabar baik! Laporan {$laporan->nomor_tiket} telah resmi disetujui oleh kuorum warga setempat dan berstatus TERTUTUP_WARGA.",
                suffixDedup: 'tertutup_warga'
            );

            return [
                'keputusan' => 'TERTUTUP_WARGA',
                'pesan' => 'Suara berhasil dicatat. Kuorum warga terpenuhi dan tiket resmi ditutup sah (TERTUTUP_WARGA).',
            ];
        }

        // 2. KASUS 2: KUORUM TOLAK LOLOS / SENGKETA WARGA (BR-VER-04)
        // Syarat: Bobot tolak mencapai K DAN minimal ada 1 suara tolak Jalur A
        if ($suaraTolak >= $targetK && $adaJalurATolak) {
            $tenggatHariKerja = $this->hitungTenggatHariKerja(now(), 7);

            // Tambahkan ronde sengketa pada laporan
            $rondeSengketaKe = (int) $laporan->ronde_sengketa + 1;

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporan->id,
                'kode_transisi' => 'T-15',
                'status_lama' => 'MENUNGGU_VERIFIKASI',
                'status_baru' => 'DISENGKETAKAN',
                'pelaku_id' => null,
                'instansi_id' => $laporan->instansi_id,
                'catatan' => sprintf(
                    'Hasil perbaikan disengketakan oleh kuorum warga (Bobot Tolak: %.1f / Target K: %.1f dengan bukti Jalur A). Instansi wajib menjawab dalam 7 hari kerja.',
                    $suaraTolak,
                    $targetK
                ),
                'waktu' => now(),
            ]);

            // Set SLA tahap JAWAB_SENGKETA selama 7 hari kerja
            DB::table('laporan')->where('id', $laporan->id)->update([
                'status' => 'DISENGKETAKAN',
                'ronde_sengketa' => $rondeSengketaKe,
                'sla_tahap' => 'JAWAB_SENGKETA',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => 7,
                'sla_satuan' => 'hari_kerja',
                'sla_jatuh_tempo' => $tenggatHariKerja,
                'updated_at' => now(),
            ]);

            $ronde->update([
                'hasil' => 'tolak',
                'selesai_pada' => now(),
            ]);

            // Buka berkas sengketa baru (7 hari kerja hak jawab instansi)
            Sengketa::create([
                'ronde_id' => $ronde->id,
                'tenggat' => $tenggatHariKerja,
                'jawaban' => null,
                'waktu_jawab' => null,
                'alasan_sanggah' => null,
                'pelaku_id' => null,
                'created_at' => now(),
            ]);

            // Notifikasi ke dinas/instansi terkait (BR-NTF-01d)
            $this->notifikasiService->kirimKeInstansi(
                laporan: $laporan,
                tipe: 'TIKET_DISENGKETAKAN',
                pesan: "PENTING: Pekerjaan fisik pada tiket {$laporan->nomor_tiket} disengketakan warga. Harap berikan jawaban (kerjakan ulang atau sanggah) sebelum {$tenggatHariKerja}.",
                suffixDedup: "sengketa_r{$ronde->nomor}"
            );

            // Notifikasi ke pelapor dan pendukung (BR-NTF-01c)
            $this->notifikasiService->kirimKePelaporDanPendukung(
                laporan: $laporan,
                tipe: 'TIKET_DISENGKETAKAN',
                pesan: "Laporan {$laporan->nomor_tiket} ditolak oleh kuorum warga dan masuk ke tahap mediasi sengketa dengan instansi.",
                suffixDedup: "sengketa_r{$ronde->nomor}"
            );

            return [
                'keputusan' => 'DISENGKETAKAN',
                'pesan' => 'Suara berhasil dicatat. Kuorum penolakan terpenuhi sehingga tiket dialihkan ke tahap DISENGKETAKAN.',
            ];
        }

        // 3. KASUS 3: TARGET TERCAPAI MURNI OLEH JALUR B (ST-06)
        if (($suaraSetuju >= $targetK && ! $adaJalurASetuju) || ($suaraTolak >= $targetK && ! $adaJalurATolak)) {
            return [
                'keputusan' => 'MENUNGGU_JALUR_A',
                'pesan' => 'Suara berhasil dicatat. Ambang kuorum terpenuhi dari verifikasi jarak jauh, namun tiket tetap menunggu minimal 1 suara verifikasi langsung di lokasi (Jalur A) sebelum diputuskan.',
            ];
        }

        // 4. KASUS 4: VOTING MASIH BERJALAN
        return [
            'keputusan' => 'BERJALAN',
            'pesan' => 'Suara verifikasi Anda berhasil tercatat. Terima kasih atas partisipasi kedaulatan Anda!',
        ];
    }

    /**
     * Memproses tiket MENUNGGU_VERIFIKASI yang telah melewati 14 hari kalender tanpa kuorum (FR-VER-05, ST-05).
     * Dijalankan secara berkala dan idempoten oleh Scheduled Command.
     */
    public function prosesBatasWaktu14Hari(): int
    {
        $tiketKadaluarsa = Laporan::query()
            ->where('status', 'MENUNGGU_VERIFIKASI')
            ->whereHas('rondeVerifikasi', function ($q) {
                $q->whereNull('hasil')->where('batas_waktu', '<', now());
            })
            ->get();

        $diproses = 0;
        foreach ($tiketKadaluarsa as $laporan) {
            DB::transaction(function () use ($laporan, &$diproses) {
                DB::statement("SET LOCAL jagains.izin_status = 'on'");

                $laporanTerkunci = Laporan::where('id', $laporan->id)->lockForUpdate()->first();
                if (! $laporanTerkunci || $laporanTerkunci->status !== 'MENUNGGU_VERIFIKASI') {
                    return;
                }

                $ronde = RondeVerifikasi::where('laporan_id', $laporanTerkunci->id)
                    ->whereNull('hasil')
                    ->where('batas_waktu', '<', now())
                    ->lockForUpdate()
                    ->first();

                if (! $ronde) {
                    return;
                }

                // Mutasi status laporan ke MENUNGGU_KEPUTUSAN_AUDITOR (T-16)
                DB::table('laporan')->where('id', $laporanTerkunci->id)->update([
                    'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                    'sla_tahap' => null,
                    'sla_riwayat_id' => null,
                    'sla_mulai_pada' => null,
                    'sla_batas' => null,
                    'sla_satuan' => null,
                    'sla_jatuh_tempo' => null,
                    'updated_at' => now(),
                ]);

                // Update hasil ronde menjadi 'kedaluwarsa'
                $ronde->update([
                    'hasil' => 'kedaluwarsa',
                    'selesai_pada' => now(),
                ]);

                // Buat berkas eskalasi ke meja Auditor (pemicu = 'TANPA_KUORUM')
                Eskalasi::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'pemicu' => 'TANPA_KUORUM',
                    'tahap' => null,
                    'riwayat_masuk_id' => null,
                    'ronde_id' => $ronde->id,
                    'created_at' => now(),
                ]);

                // Catat log riwayat status T-16
                RiwayatStatus::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'kode_transisi' => 'T-16',
                    'status_lama' => 'MENUNGGU_VERIFIKASI',
                    'status_baru' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                    'pelaku_id' => null,
                    'instansi_id' => $laporanTerkunci->instansi_id,
                    'catatan' => 'Batas waktu verifikasi 14 hari kalender telah berakhir tanpa tercapainya kuorum warga. Berkas dialihkan ke Auditor Independen (TANPA_KUORUM).',
                    'waktu' => now(),
                ]);

                // Notifikasi ke pelapor dan pendukung
                $this->notifikasiService->kirimKePelaporDanPendukung(
                    laporan: $laporanTerkunci,
                    tipe: 'ESKALASI_AUDITOR_TANPA_KUORUM',
                    pesan: "Masa verifikasi 14 hari pada tiket {$laporanTerkunci->nomor_tiket} telah berakhir tanpa kuorum penentu. Tiket dialihkan ke meja evaluasi Auditor Independen.",
                    suffixDedup: "tanpa_kuorum_r{$ronde->nomor}"
                );

                $diproses++;
            });
        }

        return $diproses;
    }

    /**
     * Memproses jawaban sengketa dari instansi dalam jendela 7 hari kerja (FR-VER-06, BR-INS-05).
     *
     * @throws ValidationException
     */
    public function responsSengketaInstansi(
        User $petugas,
        Laporan $laporan,
        string $pilihan,
        ?string $alasan = null
    ): array {
        if ($petugas->peran !== 'instansi' || (int) $petugas->instansi_id !== (int) $laporan->instansi_id) {
            abort(403, 'Hanya petugas instansi penanggung jawab tiket yang dapat memberikan jawaban sengketa.');
        }

        if ($laporan->status !== 'DISENGKETAKAN') {
            throw ValidationException::withMessages([
                'status' => ["Jawaban sengketa hanya dapat diajukan saat tiket DISENGKETAKAN (status saat ini: {$laporan->status})."],
            ]);
        }

        $pilihan = strtolower(trim($pilihan));
        if (! in_array($pilihan, ['kerjakan_ulang', 'sanggah'], true)) {
            throw ValidationException::withMessages([
                'pilihan' => ['Pilihan jawaban sengketa harus "kerjakan_ulang" atau "sanggah".'],
            ]);
        }

        if ($pilihan === 'sanggah' && (empty($alasan) || mb_strlen(trim($alasan)) < 10)) {
            throw ValidationException::withMessages([
                'alasan_sanggah' => ['Alasan sanggahan teknis instansi wajib diisi minimal 10 karakter.'],
            ]);
        }

        return DB::transaction(function () use ($petugas, $laporan, $pilihan, $alasan) {
            DB::statement("SET LOCAL jagains.izin_status = 'on'");

            $laporanTerkunci = Laporan::where('id', $laporan->id)->lockForUpdate()->firstOrFail();

            // Ambil berkas sengketa aktif yang belum dijawab
            $sengketa = Sengketa::whereHas('ronde', function ($q) use ($laporanTerkunci) {
                $q->where('laporan_id', $laporanTerkunci->id);
            })->whereNull('jawaban')->latest('created_at')->lockForUpdate()->first();

            if (! $sengketa) {
                throw ValidationException::withMessages([
                    'sengketa' => ['Berkas sengketa aktif yang menunggu jawaban tidak ditemukan.'],
                ]);
            }

            // Batas maksimal 3 kali pengerjaan ulang (P-06, AS-02)
            // Sengketa ke-4 langsung dialihkan ke meja Auditor dengan pemicu 'RONDE'
            if ($pilihan === 'kerjakan_ulang' && $laporanTerkunci->ronde_sengketa >= 3) {
                // Alihkan langsung ke Auditor pemicu RONDE
                $sengketa->update([
                    'jawaban' => 'sanggah',
                    'alasan_sanggah' => 'Batas maksimal 3 kali pengerjaan ulang telah tercapai. Dialihkan secara otomatis ke Auditor Independen.',
                    'waktu_jawab' => now(),
                    'pelaku_id' => $petugas->id,
                ]);

                DB::table('laporan')->where('id', $laporanTerkunci->id)->update([
                    'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                    'sla_tahap' => null,
                    'sla_riwayat_id' => null,
                    'sla_mulai_pada' => null,
                    'sla_batas' => null,
                    'sla_satuan' => null,
                    'sla_jatuh_tempo' => null,
                    'updated_at' => now(),
                ]);

                Eskalasi::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'pemicu' => 'RONDE',
                    'tahap' => null,
                    'riwayat_masuk_id' => null,
                    'ronde_id' => $sengketa->ronde_id,
                    'created_at' => now(),
                ]);

                RiwayatStatus::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'kode_transisi' => 'T-18',
                    'status_lama' => 'DISENGKETAKAN',
                    'status_baru' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                    'pelaku_id' => $petugas->id,
                    'instansi_id' => $petugas->instansi_id,
                    'catatan' => 'Batas 3 kali pengerjaan ulang tercapai. Tiket dialihkan ke Auditor Independen untuk verifikasi faktual (RONDE).',
                    'waktu' => now(),
                ]);

                return [
                    'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                    'pesan' => 'Batas maksimal 3 kali pengerjaan ulang telah tercapai. Berkas sengketa dialihkan langsung ke meja Auditor.',
                ];
            }

            if ($pilihan === 'kerjakan_ulang') {
                // Instansi menyetujui pengerjaan ulang (T-17)
                $sengketa->update([
                    'jawaban' => 'kerjakan_ulang',
                    'alasan_sanggah' => null,
                    'waktu_jawab' => now(),
                    'pelaku_id' => $petugas->id,
                ]);

                $riwayat = RiwayatStatus::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'kode_transisi' => 'T-17',
                    'status_lama' => 'DISENGKETAKAN',
                    'status_baru' => 'DIKERJAKAN',
                    'pelaku_id' => $petugas->id,
                    'instansi_id' => $petugas->instansi_id,
                    'catatan' => 'Instansi berkomitmen melaksanakan pengerjaan ulang perbaikan fisik.',
                    'waktu' => now(),
                ]);

                // Hitung jatuh tempo jika ada tanggal target
                $jatuhTempo = $laporanTerkunci->tanggal_target ?: now()->addDays(30)->toDateString();

                DB::table('laporan')->where('id', $laporanTerkunci->id)->update([
                    'status' => 'DIKERJAKAN',
                    'sla_tahap' => 'PELAKSANAAN',
                    'sla_riwayat_id' => $riwayat->id,
                    'sla_mulai_pada' => now(),
                    'sla_batas' => 30,
                    'sla_satuan' => 'hari_kalender',
                    'sla_jatuh_tempo' => $jatuhTempo,
                    'updated_at' => now(),
                ]);

                $this->notifikasiService->kirimKePelaporDanPendukung(
                    laporan: $laporanTerkunci,
                    tipe: 'INSTANSI_KERJAKAN_ULANG',
                    pesan: "Instansi berkomitmen melakukan pengerjaan ulang pada tiket {$laporanTerkunci->nomor_tiket}. Status kembali DIKERJAKAN.",
                    suffixDedup: "kerjakan_ulang_r{$sengketa->ronde_id}"
                );

                return [
                    'status' => 'DIKERJAKAN',
                    'pesan' => 'Komitmen pengerjaan ulang berhasil dicatat. Status tiket kembali ke DIKERJAKAN.',
                ];
            }

            // Pilihan 'sanggah' (T-18)
            $sengketa->update([
                'jawaban' => 'sanggah',
                'alasan_sanggah' => $alasan,
                'waktu_jawab' => now(),
                'pelaku_id' => $petugas->id,
            ]);

            DB::table('laporan')->where('id', $laporanTerkunci->id)->update([
                'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'sla_tahap' => null,
                'sla_riwayat_id' => null,
                'sla_mulai_pada' => null,
                'sla_batas' => null,
                'sla_satuan' => null,
                'sla_jatuh_tempo' => null,
                'updated_at' => now(),
            ]);

            Eskalasi::create([
                'laporan_id' => $laporanTerkunci->id,
                'pemicu' => 'SANGGAHAN',
                'tahap' => null,
                'riwayat_masuk_id' => null,
                'ronde_id' => $sengketa->ronde_id,
                'created_at' => now(),
            ]);

            RiwayatStatus::create([
                'laporan_id' => $laporanTerkunci->id,
                'kode_transisi' => 'T-18',
                'status_lama' => 'DISENGKETAKAN',
                'status_baru' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'pelaku_id' => $petugas->id,
                'instansi_id' => $petugas->instansi_id,
                'catatan' => "Instansi menyanggah sengketa warga dengan alasan: {$alasan}. Berkas dialihkan ke Auditor Independen.",
                'waktu' => now(),
            ]);

            $this->notifikasiService->kirimKePelaporDanPendukung(
                laporan: $laporanTerkunci,
                tipe: 'INSTANSI_SANGGAH',
                pesan: "Instansi menyampaikan sanggahan resmi atas penolakan warga pada tiket {$laporanTerkunci->nomor_tiket}. Berkas diteruskan ke Auditor Independen.",
                suffixDedup: "sanggah_r{$sengketa->ronde_id}"
            );

            return [
                'status' => 'MENUNGGU_KEPUTUSAN_AUDITOR',
                'pesan' => 'Sanggahan resmi instansi berhasil dicatat. Berkas dialihkan ke meja evaluasi Auditor.',
            ];
        });
    }

    /**
     * Menghitung tanggal tenggat hari kerja berikutnya dengan melompati akhir pekan dan libur nasional.
     */
    public function hitungTenggatHariKerja(CarbonInterface|\DateTimeInterface $mulai, int $jumlahHariKerja): string
    {
        $cursor = Carbon::parse($mulai);
        $hariDitambahkan = 0;

        $daftarLibur = HariLibur::query()
            ->where('tanggal', '>=', $mulai->format('Y-m-d'))
            ->pluck('tanggal')
            ->map(fn ($d) => is_string($d) ? $d : $d->format('Y-m-d'))
            ->flip()
            ->all();

        while ($hariDitambahkan < $jumlahHariKerja) {
            $cursor = $cursor->addDay();
            // Lewati Sabtu (6) dan Minggu (0)
            if ($cursor->isWeekend()) {
                continue;
            }
            // Lewati hari libur nasional
            if (isset($daftarLibur[$cursor->toDateString()])) {
                continue;
            }
            $hariDitambahkan++;
        }

        return $cursor->toDateString();
    }

    /**
     * Menghitung jarak spasial dalam satuan meter menggunakan formula Haversine.
     */
    public function hitungJarakMeter(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000.0;
        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return round($angle * $earthRadius, 1);
    }
}

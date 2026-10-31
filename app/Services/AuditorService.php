<?php

namespace App\Services;

use App\Models\Eskalasi;
use App\Models\Instansi;
use App\Models\KeputusanAuditor;
use App\Models\Laporan;
use App\Models\Pengalihan;
use App\Models\RiwayatStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuditorService
{
    public function __construct(
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * Mengambil daftar antrean perkara eskalasi untuk panel Auditor Independen (FR-AUD-01).
     */
    public function ambilAntreanEskalasi(User $auditor, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        if ($auditor->peran !== 'auditor') {
            abort(403, 'Akses antrean eskalasi hanya untuk Auditor Independen.');
        }

        $query = Eskalasi::query()
            ->with([
                'laporan:id,nomor_tiket,judul,keterangan,kategori_id,instansi_id,kelurahan_id,status,keparahan,lintang,bujur,sla_tahap,sla_jatuh_tempo,created_at',
                'laporan.kategori:id,nama',
                'laporan.instansi:id,nama,singkatan',
                'laporan.kelurahan:id,nama,tingkat',
                'riwayatMasuk:id,laporan_id,kode_transisi,status_lama,status_baru,waktu',
                'ronde:id,laporan_id,nomor,k,batas_waktu,hasil',
                'keputusanAuditor' => fn ($q) => $q->latest('waktu'),
            ])
            ->whereNull('selesai_pada')
            ->latest('created_at');

        // Filter Tab Pemicu: sla, sanggahan, ronde, tanpa_kuorum
        $tab = strtolower(trim((string) ($filters['tab'] ?? 'semua')));
        if ($tab === 'sla') {
            $query->where('pemicu', 'SLA');
        } elseif ($tab === 'sanggahan') {
            $query->where('pemicu', 'SANGGAHAN');
        } elseif ($tab === 'ronde') {
            $query->where('pemicu', 'RONDE');
        } elseif ($tab === 'tanpa_kuorum') {
            $query->where('pemicu', 'TANPA_KUORUM');
        }

        // Filter Instansi
        if (! empty($filters['instansi_id'])) {
            $query->whereHas('laporan', function ($q) use ($filters) {
                $q->where('instansi_id', $filters['instansi_id']);
            });
        }

        // Filter Kategori
        if (! empty($filters['kategori_id'])) {
            $query->whereHas('laporan', function ($q) use ($filters) {
                $q->where('kategori_id', $filters['kategori_id']);
            });
        }

        // Filter Pencarian Teks (Nomor Tiket atau Judul)
        if (! empty($filters['q'])) {
            $keyword = trim((string) $filters['q']);
            $query->whereHas('laporan', function ($q) use ($keyword) {
                $q->where('nomor_tiket', 'ilike', "%{$keyword}%")
                    ->orWhere('judul', 'ilike', "%{$keyword}%");
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        // Tambahkan metadata komputasi sisa SLA / keterlambatan
        $paginator->getCollection()->transform(function (Eskalasi $eskalasi) {
            $laporan = $eskalasi->laporan;
            $hariTerlambat = 0;

            if ($eskalasi->pemicu === 'SLA' && $laporan && $laporan->sla_jatuh_tempo) {
                $jatuhTempo = Carbon::parse($laporan->sla_jatuh_tempo);
                if (now()->isAfter($jatuhTempo)) {
                    $hariTerlambat = max(1, (int) ceil($jatuhTempo->floatDiffInDays(now(), false)));
                }
            }

            $eskalasi->setAttribute('hari_terlambat', $hariTerlambat);

            return $eskalasi;
        });

        return $paginator;
    }

    /**
     * Mengambil detail lengkap berkas perkara eskalasi untuk telaah sidang Auditor (FR-AUD-01).
     */
    public function ambilDetailEskalasi(User $auditor, int $eskalasiId): array
    {
        if ($auditor->peran !== 'auditor') {
            abort(403, 'Akses telaah perkara hanya untuk Auditor Independen.');
        }

        $eskalasi = Eskalasi::query()
            ->with([
                'laporan' => function ($q) {
                    $q->with([
                        'kategori:id,nama',
                        'instansi:id,nama,singkatan',
                        'kelurahan:id,nama,tingkat',
                        'lampiran' => fn ($l) => $l->orderBy('created_at'),
                        'beritaAcara' => fn ($b) => $b->orderByDesc('versi'),
                        'riwayatStatus' => fn ($r) => $r->orderByDesc('waktu'),
                        'pengalihan' => fn ($p) => $p->with(['instansiAsal:id,nama,singkatan', 'instansiTujuan:id,nama,singkatan'])->orderBy('waktu'),
                    ]);
                },
                'riwayatMasuk',
                'ronde' => function ($q) {
                    $q->with([
                        'lampiranSesudah',
                        'verifikasiWarga' => fn ($v) => $v->with('lampiran')->orderBy('waktu'),
                        'sengketa' => fn ($s) => $s->with('pelaku:id,username'),
                    ]);
                },
                'keputusanAuditor' => fn ($q) => $q->with('auditor:id,username')->orderByDesc('waktu'),
            ])
            ->findOrFail($eskalasiId);

        $laporan = $eskalasi->laporan;
        $ronde = $eskalasi->ronde;

        // Ambil suara verifikasi warga teranomimisasi (ST-08, BR-VER-10)
        $daftarSuaraWarga = [];
        if ($ronde && $ronde->verifikasiWarga) {
            $daftarSuaraWarga = $ronde->verifikasiWarga->map(function ($s) {
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

        // Hitung umur keterlambatan
        $hariTerlambat = 0;
        if ($eskalasi->pemicu === 'SLA' && $laporan->sla_jatuh_tempo) {
            $jatuhTempo = Carbon::parse($laporan->sla_jatuh_tempo);
            if (now()->isAfter($jatuhTempo)) {
                $hariTerlambat = max(1, (int) ceil($jatuhTempo->floatDiffInDays(now(), false)));
            }
        }

        return [
            'eskalasi' => [
                'id' => $eskalasi->id,
                'pemicu' => $eskalasi->pemicu,
                'tahap' => $eskalasi->tahap,
                'created_at' => $eskalasi->created_at?->toISOString(),
                'selesai_pada' => $eskalasi->selesai_pada?->toISOString(),
                'selesai_alasan' => $eskalasi->selesai_alasan,
                'hari_terlambat' => $hariTerlambat,
            ],
            'laporan' => [
                'id' => $laporan->id,
                'nomor_tiket' => $laporan->nomor_tiket,
                'judul' => $laporan->judul,
                'keterangan' => $laporan->keterangan,
                'status' => $laporan->status,
                'keparahan' => $laporan->keparahan,
                'kategori' => $laporan->kategori ? ['id' => $laporan->kategori->id, 'nama' => $laporan->kategori->nama] : null,
                'instansi' => $laporan->instansi ? ['id' => $laporan->instansi->id, 'nama' => $laporan->instansi->nama, 'singkatan' => $laporan->instansi->singkatan] : null,
                'kelurahan' => $laporan->kelurahan ? ['id' => $laporan->kelurahan->id, 'nama' => $laporan->kelurahan->nama] : null,
                'lintang' => (float) $laporan->lintang,
                'bujur' => (float) $laporan->bujur,
                'sla_tahap' => $laporan->sla_tahap,
                'sla_jatuh_tempo' => $laporan->sla_jatuh_tempo,
                'tanggal_target' => $laporan->tanggal_target,
                'ronde_sengketa' => $laporan->ronde_sengketa,
                'jumlah_pengalihan' => $laporan->jumlah_pengalihan,
                'created_at' => $laporan->created_at?->toISOString(),
            ],
            'foto_awal' => $laporan->lampiran->where('tahap', 'awal')->map(fn ($f) => asset('storage/'.$f->path))->first(),
            'foto_sesudah' => $ronde?->lampiranSesudah ? asset('storage/'.$ronde->lampiranSesudah->path) : null,
            'berita_acara' => $laporan->beritaAcara->first() ? [
                'versi' => $laporan->beritaAcara->first()->versi,
                'kegiatan' => $laporan->beritaAcara->first()->kegiatan,
                'hasil' => $laporan->beritaAcara->first()->hasil,
                'hambatan' => $laporan->beritaAcara->first()->hambatan,
                'created_at' => $laporan->beritaAcara->first()->created_at?->toISOString(),
            ] : null,
            'sengketa' => $ronde?->sengketa ? [
                'id' => $ronde->sengketa->id,
                'tenggat' => $ronde->sengketa->tenggat,
                'jawaban' => $ronde->sengketa->jawaban,
                'alasan_sanggah' => $ronde->sengketa->alasan_sanggah,
                'waktu_jawab' => $ronde->sengketa->waktu_jawab?->toISOString(),
                'petugas' => $ronde->sengketa->pelaku?->username,
            ] : null,
            'ronde_info' => $ronde ? [
                'nomor' => $ronde->nomor,
                'k' => (float) $ronde->k,
                'batas_waktu' => $ronde->batas_waktu?->toISOString(),
                'hasil' => $ronde->hasil,
            ] : null,
            'suara_warga' => $daftarSuaraWarga,
            'riwayat_keputusan' => $eskalasi->keputusanAuditor->map(function ($k) {
                return [
                    'id' => $k->id,
                    'jenis' => $k->jenis,
                    'alasan' => $k->alasan,
                    'perintah' => $k->perintah,
                    'tenggat' => $k->tenggat?->toDateString(),
                    'waktu' => $k->waktu?->toISOString(),
                    'auditor' => $k->auditor?->username,
                ];
            }),
        ];
    }

    /**
     * Memproses sidang penetapan keputusan Auditor Independen (FR-AUD-02).
     *
     * @param array{
     *     jenis: 'PERINTAH'|'PERBAIKAN_SAH'|'KERJAKAN_ULANG',
     *     perintah?: ?string,
     *     alasan?: ?string,
     *     tenggat?: ?string
     * } $data
     * @return array{
     *     sukses: bool,
     *     pesan: string,
     *     status_laporan: string
     * }
     */
    public function putuskanEskalasi(User $auditor, Eskalasi $eskalasi, array $data): array
    {
        if ($auditor->peran !== 'auditor') {
            abort(403, 'Akses ditolak: Hanya Auditor Independen yang memiliki hak memutuskan eskalasi.');
        }

        return DB::transaction(function () use ($auditor, $eskalasi, $data) {
            // Lock baris eskalasi dan laporan
            $eskalasiTerkunci = Eskalasi::where('id', $eskalasi->id)->lockForUpdate()->firstOrFail();
            $laporanTerkunci = Laporan::where('id', $eskalasiTerkunci->laporan_id)->lockForUpdate()->firstOrFail();

            if ($eskalasiTerkunci->selesai_pada !== null) {
                throw ValidationException::withMessages([
                    'eskalasi' => ['Perkara eskalasi ini sudah diselesaikan dan diputuskan sebelumnya.'],
                ]);
            }

            $pemicu = $eskalasiTerkunci->pemicu;
            $jenis = strtoupper(trim($data['jenis']));

            if ($pemicu === 'SLA') {
                // Pemicu SLA: Auditor hanya dapat memberi PERINTAH tertulis dan tenggat (FR-AUD-02, BR-AUD-05)
                if ($jenis !== 'PERINTAH') {
                    throw ValidationException::withMessages([
                        'jenis' => ['Untuk perkara pemicu keterlambatan SLA, keputusan yang sah adalah PERINTAH tindak lanjut tertulis.'],
                    ]);
                }

                $perintah = trim((string) ($data['perintah'] ?? ''));
                if (strlen($perintah) < 10) {
                    throw ValidationException::withMessages([
                        'perintah' => ['Perintah tindak lanjut tertulis wajib diisi minimal 10 karakter.'],
                    ]);
                }

                $tenggat = $data['tenggat'] ?? null;
                if (! $tenggat || Carbon::parse($tenggat)->isPast()) {
                    throw ValidationException::withMessages([
                        'tenggat' => ['Tenggat waktu perintah Auditor wajib diisi dan tidak boleh tanggal lampau.'],
                    ]);
                }

                // Catat keputusan auditor
                $keputusan = KeputusanAuditor::create([
                    'eskalasi_id' => $eskalasiTerkunci->id,
                    'auditor_id' => $auditor->id,
                    'jenis' => 'PERINTAH',
                    'perintah' => $perintah,
                    'tenggat' => $tenggat,
                    'alasan' => null,
                    'waktu' => now(),
                ]);

                // Audit log
                AuditLogService::catat(
                    aksi: 'AUDITOR_PERINTAH_SLA',
                    objekTipe: 'eskalasi',
                    objekId: $eskalasiTerkunci->id,
                    nilaiLama: null,
                    nilaiBaru: [
                        'jenis' => 'PERINTAH',
                        'perintah' => $perintah,
                        'tenggat' => $tenggat,
                    ],
                    alasan: "Auditor menetapkan perintah percepatan untuk tahap {$eskalasiTerkunci->tahap}",
                    laporanId: $laporanTerkunci->id,
                    pelakuId: $auditor->id
                );

                // Notifikasi ke instansi pemilik tiket (BR-AUD-02, BR-AUD-05)
                if ($laporanTerkunci->instansi_id) {
                    $this->notifikasiService->kirimKeInstansi(
                        laporan: $laporanTerkunci,
                        tipe: 'PERINTAH_AUDITOR',
                        pesan: "Auditor Independen menerbitkan Perintah Tindak Lanjut pada tiket {$laporanTerkunci->nomor_tiket} dengan tenggat {$tenggat}: \"{$perintah}\"",
                        suffixDedup: "perintah_auditor_esk{$eskalasiTerkunci->id}"
                    );
                }

                return [
                    'sukses' => true,
                    'pesan' => "Perintah tindak lanjut resmi berhasil diterbitkan untuk instansi penanggung jawab tiket {$laporanTerkunci->nomor_tiket}.",
                    'status_laporan' => $laporanTerkunci->status,
                ];
            }

            // Pemicu Non-SLA: SANGGAHAN, RONDE, TANPA_KUORUM
            if (! in_array($jenis, ['PERBAIKAN_SAH', 'KERJAKAN_ULANG'], true)) {
                throw ValidationException::withMessages([
                    'jenis' => ['Keputusan untuk sengketa/eskalasi non-SLA harus berupa "PERBAIKAN_SAH" atau "KERJAKAN_ULANG".'],
                ]);
            }

            $alasan = trim((string) ($data['alasan'] ?? ''));
            if (strlen($alasan) < 10) {
                throw ValidationException::withMessages([
                    'alasan' => ['Alasan yuridis/teknis keputusan auditor wajib diisi minimal 10 karakter.'],
                ]);
            }

            if ($jenis === 'PERBAIKAN_SAH') {
                // T-19: MENUNGGU_KEPUTUSAN_AUDITOR -> TERTUTUP_AUDITOR (BR-TUP-03)
                $statusLama = $laporanTerkunci->status;

                $riwayat = RiwayatStatus::create([
                    'laporan_id' => $laporanTerkunci->id,
                    'kode_transisi' => 'T-19',
                    'status_lama' => $statusLama,
                    'status_baru' => 'TERTUTUP_AUDITOR',
                    'pelaku_id' => $auditor->id,
                    'instansi_id' => $laporanTerkunci->instansi_id,
                    'catatan' => "Auditor menetapkan perbaikan fisik sah: {$alasan}",
                    'waktu' => now(),
                ]);

                // Update Laporan (SLA direset NULL, ditutup_pada diisi untuk laporan_final_ck)
                DB::table('laporan')->where('id', $laporanTerkunci->id)->update([
                    'status' => 'TERTUTUP_AUDITOR',
                    'ditutup_pada' => now(),
                    'sla_tahap' => null,
                    'sla_riwayat_id' => null,
                    'sla_mulai_pada' => null,
                    'sla_batas' => null,
                    'sla_satuan' => null,
                    'sla_jatuh_tempo' => null,
                    'updated_at' => now(),
                ]);

                // Tutup eskalasi
                $eskalasiTerkunci->update([
                    'selesai_pada' => now(),
                    'selesai_alasan' => 'diputuskan',
                ]);

                // Simpan keputusan auditor
                KeputusanAuditor::create([
                    'eskalasi_id' => $eskalasiTerkunci->id,
                    'auditor_id' => $auditor->id,
                    'jenis' => 'PERBAIKAN_SAH',
                    'alasan' => $alasan,
                    'perintah' => null,
                    'tenggat' => null,
                    'waktu' => now(),
                ]);

                // Audit log
                AuditLogService::catat(
                    aksi: 'AUDITOR_PERBAIKAN_SAH',
                    objekTipe: 'laporan',
                    objekId: $laporanTerkunci->id,
                    nilaiLama: ['status' => $statusLama],
                    nilaiBaru: ['status' => 'TERTUTUP_AUDITOR'],
                    alasan: $alasan,
                    laporanId: $laporanTerkunci->id,
                    pelakuId: $auditor->id
                );

                // Broadcast notifikasi penutupan
                if ($laporanTerkunci->kelurahan_id) {
                    $this->notifikasiService->kirimBroadcastKelurahan(
                        kelurahanId: $laporanTerkunci->kelurahan_id,
                        laporan: $laporanTerkunci,
                        pesan: "Tiket {$laporanTerkunci->nomor_tiket} telah resmi dinyatakan TERTUTUP oleh Auditor Independen (Perbaikan Sah).",
                        nomorRonde: $laporanTerkunci->ronde_sengketa ?: 1
                    );
                }

                $this->notifikasiService->kirimKePelaporDanPendukung(
                    laporan: $laporanTerkunci,
                    tipe: 'TIKET_TERTUTUP_AUDITOR',
                    pesan: "Laporan {$laporanTerkunci->nomor_tiket} telah dinyatakan selesai dan sah oleh Auditor Independen. Alasan: {$alasan}",
                    suffixDedup: "pelapor_tertutup_auditor_{$laporanTerkunci->id}"
                );

                return [
                    'sukses' => true,
                    'pesan' => "Tiket {$laporanTerkunci->nomor_tiket} resmi dinyatakan sah dan ditutup (TERTUTUP_AUDITOR).",
                    'status_laporan' => 'TERTUTUP_AUDITOR',
                ];
            }

            // Opsi KERJAKAN_ULANG (T-20: MENUNGGU_KEPUTUSAN_AUDITOR -> DIKERJAKAN)
            $tenggat = $data['tenggat'] ?? null;
            if (! $tenggat || Carbon::parse($tenggat)->isPast()) {
                throw ValidationException::withMessages([
                    'tenggat' => ['Tenggat waktu penyelesaian pengerjaan ulang wajib ditentukan di masa depan.'],
                ]);
            }

            $tenggatDate = Carbon::parse($tenggat);
            $perintah = trim((string) ($data['perintah'] ?? $alasan));
            $statusLama = $laporanTerkunci->status;

            $riwayat = RiwayatStatus::create([
                'laporan_id' => $laporanTerkunci->id,
                'kode_transisi' => 'T-20',
                'status_lama' => $statusLama,
                'status_baru' => 'DIKERJAKAN',
                'pelaku_id' => $auditor->id,
                'instansi_id' => $laporanTerkunci->instansi_id,
                'catatan' => "Auditor memerintahkan pengerjaan ulang dengan tenggat {$tenggat}: {$alasan}",
                'waktu' => now(),
            ]);

            // Hitung hari kalender batas SLA pelaksanaan ulang
            $batasHariUlang = max(1, (int) ceil(now()->floatDiffInDays($tenggatDate, false)));

            $updatePayload = [
                'status' => 'DIKERJAKAN',
                'ronde_sengketa' => ($laporanTerkunci->ronde_sengketa ?? 0) + 1,
                'ditutup_pada' => null,
                'sla_tahap' => 'PELAKSANAAN',
                'sla_riwayat_id' => $riwayat->id,
                'sla_mulai_pada' => now(),
                'sla_batas' => $batasHariUlang,
                'sla_satuan' => 'hari_kalender',
                'sla_jatuh_tempo' => $tenggatDate->toDateString(),
                'tanggal_target' => $tenggatDate->toDateString(),
                'tanggal_target_awal' => $laporanTerkunci->tanggal_target_awal ?: $tenggatDate->toDateString(),
                'jenis_pendanaan' => $laporanTerkunci->jenis_pendanaan ?: 'APBD_KOTA',
                'updated_at' => now(),
            ];

            DB::table('laporan')->where('id', $laporanTerkunci->id)->update($updatePayload);

            // Tutup eskalasi
            $eskalasiTerkunci->update([
                'selesai_pada' => now(),
                'selesai_alasan' => 'diputuskan',
            ]);

            // Simpan keputusan auditor
            KeputusanAuditor::create([
                'eskalasi_id' => $eskalasiTerkunci->id,
                'auditor_id' => $auditor->id,
                'jenis' => 'KERJAKAN_ULANG',
                'alasan' => $alasan,
                'perintah' => $perintah,
                'tenggat' => $tenggatDate->toDateString(),
                'waktu' => now(),
            ]);

            // Audit log
            AuditLogService::catat(
                aksi: 'AUDITOR_KERJAKAN_ULANG',
                objekTipe: 'laporan',
                objekId: $laporanTerkunci->id,
                nilaiLama: ['status' => $statusLama],
                nilaiBaru: ['status' => 'DIKERJAKAN', 'tenggat' => $tenggat],
                alasan: $alasan,
                laporanId: $laporanTerkunci->id,
                pelakuId: $auditor->id
            );

            // Notifikasi ke instansi
            if ($laporanTerkunci->instansi_id) {
                $this->notifikasiService->kirimKeInstansi(
                    laporan: $laporanTerkunci,
                    tipe: 'AUDITOR_KERJAKAN_ULANG',
                    pesan: "Auditor Independen memutuskan tiket {$laporanTerkunci->nomor_tiket} wajib DIKERJAKAN ULANG dengan tenggat {$tenggat}. Alasan: {$alasan}",
                    suffixDedup: "kerjakan_ulang_auditor_{$eskalasiTerkunci->id}"
                );
            }

            return [
                'sukses' => true,
                'pesan' => "Keputusan kerjakan ulang berhasil diterbitkan. Tiket kembali berstatus DIKERJAKAN dengan tenggat {$tenggat}.",
                'status_laporan' => 'DIKERJAKAN',
            ];
        });
    }

    /**
     * Memindai dan membuat eskalasi otomatis untuk tiket yang melewati batas SLA (FR-ESK-01, BR-SLA-02, BR-SLA-05).
     *
     * Berjalan idempoten via console scheduler setiap beberapa menit.
     */
    public function prosesEskalasiSlaOtomatis(): int
    {
        $today = now()->toDateString();

        // Cari tiket berstatus SLA aktif yang sla_jatuh_tempo telah lewat
        $daftarTiketTerlambat = Laporan::query()
            ->whereNotNull('sla_tahap')
            ->whereNotNull('sla_jatuh_tempo')
            ->whereNotNull('sla_riwayat_id')
            ->where('sla_jatuh_tempo', '<', $today)
            ->whereNotIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->get();

        $jumlahDieskalasi = 0;

        foreach ($daftarTiketTerlambat as $laporan) {
            // Hindari duplikasi: cek partial index eskalasi_sla_uq (laporan_id, tahap, riwayat_masuk_id)
            $sudahAda = Eskalasi::query()
                ->where('laporan_id', $laporan->id)
                ->where('pemicu', 'SLA')
                ->where('tahap', $laporan->sla_tahap)
                ->where('riwayat_masuk_id', $laporan->sla_riwayat_id)
                ->exists();

            if ($sudahAda) {
                continue;
            }

            try {
                $eskalasi = Eskalasi::create([
                    'laporan_id' => $laporan->id,
                    'pemicu' => 'SLA',
                    'tahap' => $laporan->sla_tahap,
                    'riwayat_masuk_id' => $laporan->sla_riwayat_id,
                    'ronde_id' => null,
                    'created_at' => now(),
                    'selesai_pada' => null,
                    'selesai_alasan' => null,
                ]);

                // Notifikasi ke seluruh Auditor
                $auditorList = User::where('peran', 'auditor')->where('status_akun', 'aktif')->get();
                foreach ($auditorList as $auditor) {
                    $this->notifikasiService->kirim(
                        penggunaId: $auditor->id,
                        laporanId: $laporan->id,
                        tipe: 'ESKALASI_SLA',
                        pesan: "Tiket {$laporan->nomor_tiket} otomatis dieskalasi ke meja Auditor akibat keterlambatan batas SLA tahap {$laporan->sla_tahap}.",
                        kunciDedup: "esk_sla_{$eskalasi->id}_aud_{$auditor->id}"
                    );
                }

                // Notifikasi peringatan ke instansi
                if ($laporan->instansi_id) {
                    $this->notifikasiService->kirimKeInstansi(
                        laporan: $laporan,
                        tipe: 'PERINGATAN_SLA_LEWAT',
                        pesan: "Peringatan: Tiket {$laporan->nomor_tiket} telah melewati batas jatuh tempo SLA tahap {$laporan->sla_tahap} dan masuk pengawasan Auditor Independen.",
                        suffixDedup: "warn_sla_lewat_{$eskalasi->id}"
                    );
                }

                $jumlahDieskalasi++;
            } catch (\Throwable $e) {
                // Abaikan jika terjadi race-condition DB constraint violation
                continue;
            }
        }

        return $jumlahDieskalasi;
    }

    /**
     * Menutup eskalasi SLA yang sedang terbuka saat tiket berpindah ke tahap berikutnya (BR-AUD-02d).
     */
    public function tutupEskalasiSlaSaatTahapBerpindah(Laporan $laporan, string $tahapLama): int
    {
        return Eskalasi::query()
            ->where('laporan_id', $laporan->id)
            ->where('pemicu', 'SLA')
            ->where('tahap', $tahapLama)
            ->whereNull('selesai_pada')
            ->update([
                'selesai_pada' => now(),
                'selesai_alasan' => 'tahap_berpindah',
            ]);
    }

    /**
     * Mengambil data analitik komprehensif pola pengawasan auditor (FR-AUD-03).
     */
    public function ambilPolaPengawasan(array $filters = []): array
    {
        // 1. Matriks Pengalihan Antar-Instansi (Inter-agency bounce)
        $pengalihanData = Pengalihan::query()
            ->with([
                'instansiAsal:id,nama,singkatan',
                'instansiTujuan:id,nama,singkatan',
            ])
            ->select('instansi_asal_id', 'instansi_tujuan_id', DB::raw('count(*) as total'))
            ->groupBy('instansi_asal_id', 'instansi_tujuan_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($p) => [
                'asal' => $p->instansiAsal ? $p->instansiAsal->singkatan : 'Tidak Diketahui',
                'tujuan' => $p->instansiTujuan ? $p->instansiTujuan->singkatan : 'Tidak Diketahui',
                'total' => (int) $p->total,
            ]);

        // 2. Rasio Sengketa & Penolakan Warga per Instansi
        $semuaInstansi = Instansi::query()
            ->where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'singkatan']);

        $analitikInstansi = $semuaInstansi->map(function ($instansi) {
            $totalTiket = Laporan::where('instansi_id', $instansi->id)->count();
            $tiketSelesai = Laporan::where('instansi_id', $instansi->id)
                ->whereIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'])
                ->count();
            $tiketDisengketakan = Laporan::where('instansi_id', $instansi->id)
                ->where(function ($q) {
                    $q->where('ronde_sengketa', '>', 0)
                        ->orWhere('status', 'DISENGKETAKAN');
                })
                ->count();
            $tiketEskalasiSla = Eskalasi::whereHas('laporan', fn ($q) => $q->where('instansi_id', $instansi->id))
                ->where('pemicu', 'SLA')
                ->count();
            $anggaranTertahan = Laporan::where('instansi_id', $instansi->id)
                ->where('status', 'TERJADWAL_ANGGARAN')
                ->count();

            $rasioSengketa = $totalTiket > 0 ? round(($tiketDisengketakan / $totalTiket) * 100, 1) : 0.0;

            return [
                'id' => $instansi->id,
                'nama' => $instansi->nama,
                'singkatan' => $instansi->singkatan,
                'total_tiket' => $totalTiket,
                'tiket_selesai' => $tiketSelesai,
                'tiket_sengketa' => $tiketDisengketakan,
                'rasio_sengketa' => $rasioSengketa,
                'eskalasi_sla' => $tiketEskalasiSla,
                'anggaran_tertahan' => $anggaranTertahan,
            ];
        });

        // 3. Ringkasan Metrik Pengawasan
        $totalEskalasiAktif = Eskalasi::whereNull('selesai_pada')->count();
        $totalPerintahDiterbitkan = KeputusanAuditor::where('jenis', 'PERINTAH')->count();
        $totalTiketSahAuditor = Laporan::where('status', 'TERTUTUP_AUDITOR')->count();
        $totalPengerjaanUlang = KeputusanAuditor::where('jenis', 'KERJAKAN_ULANG')->count();

        return [
            'ringkasan' => [
                'eskalasi_aktif' => $totalEskalasiAktif,
                'perintah_diterbitkan' => $totalPerintahDiterbitkan,
                'perbaikan_sah' => $totalTiketSahAuditor,
                'perintah_kerja_ulang' => $totalPengerjaanUlang,
            ],
            'pengalihan' => $pengalihanData,
            'performa_instansi' => $analitikInstansi,
        ];
    }
}

<?php

namespace App\Services;

use App\Models\Laporan;
use App\Models\Notifikasi;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NotifikasiService
{
    /**
     * Mengirim notifikasi dalam aplikasi ke pengguna tertentu (FR-NTF-01).
     * Akun yang dibekukan tidak akan menerima notifikasi (BR-NTF-01).
     */
    public function kirim(
        int $penggunaId,
        ?int $laporanId,
        string $tipe,
        string $pesan,
        ?string $kunciDedup = null
    ): ?Notifikasi {
        $user = User::find($penggunaId);
        if (! $user || $user->status_akun === 'dibekukan') {
            return null;
        }

        // Jika ada kunci deduplikasi, periksa apakah notifikasi serupa sudah pernah terbit
        if ($kunciDedup !== null) {
            $existing = Notifikasi::where('pengguna_id', $penggunaId)
                ->where('kunci_dedup', $kunciDedup)
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        return Notifikasi::create([
            'pengguna_id' => $penggunaId,
            'laporan_id' => $laporanId,
            'tipe' => $tipe,
            'pesan' => mb_substr($pesan, 0, 500),
            'kunci_dedup' => $kunciDedup,
            'created_at' => now(),
        ]);
    }

    /**
     * Mengirim siaran notifikasi ke seluruh warga berdomisili di kelurahan tiket (BR-NTF-01b).
     * Digunakan saat tiket memasuki tahap MENUNGGU_VERIFIKASI.
     */
    public function kirimBroadcastKelurahan(
        int $kelurahanId,
        Laporan $laporan,
        string $pesan,
        ?int $nomorRonde = 1
    ): int {
        $wargaList = User::query()
            ->where('peran', 'warga')
            ->where('kelurahan_id', $kelurahanId)
            ->where('status_akun', 'aktif')
            ->get(['id', 'status_akun']);

        $terkirim = 0;
        foreach ($wargaList as $warga) {
            $kunciDedup = "verif_ronde_{$laporan->id}_{$nomorRonde}_{$warga->id}";
            $notif = $this->kirim(
                penggunaId: $warga->id,
                laporanId: $laporan->id,
                tipe: 'PERMINTAAN_VERIFIKASI',
                pesan: $pesan,
                kunciDedup: $kunciDedup
            );

            if ($notif) {
                $terkirim++;
            }
        }

        return $terkirim;
    }

    /**
     * Mengirim notifikasi pembaruan status ke pelapor dan seluruh akun pendukung (BR-NTF-01a, BR-NTF-01c).
     */
    public function kirimKePelaporDanPendukung(
        Laporan $laporan,
        string $tipe,
        string $pesan,
        ?string $suffixDedup = null
    ): int {
        $penerimaIds = collect();

        if ($laporan->pelapor_id) {
            $penerimaIds->push($laporan->pelapor_id);
        }

        // Ambil seluruh user_id dari tabel dukungan
        $pendukungIds = $laporan->dukungan()->pluck('pengguna_id');
        $penerimaIds = $penerimaIds->merge($pendukungIds)->unique();

        $terkirim = 0;
        foreach ($penerimaIds as $userId) {
            $kunciDedup = $suffixDedup ? "lap_{$laporan->id}_{$userId}_{$suffixDedup}" : null;
            $notif = $this->kirim(
                penggunaId: $userId,
                laporanId: $laporan->id,
                tipe: $tipe,
                pesan: $pesan,
                kunciDedup: $kunciDedup
            );

            if ($notif) {
                $terkirim++;
            }
        }

        return $terkirim;
    }

    /**
     * Mengirim notifikasi ke seluruh petugas instansi pemilik tiket (BR-NTF-01d).
     */
    public function kirimKeInstansi(
        Laporan $laporan,
        string $tipe,
        string $pesan,
        ?string $suffixDedup = null
    ): int {
        if (! $laporan->instansi_id) {
            return 0;
        }

        $petugasList = User::query()
            ->where('peran', 'instansi')
            ->where('instansi_id', $laporan->instansi_id)
            ->where('status_akun', 'aktif')
            ->get(['id']);

        $terkirim = 0;
        foreach ($petugasList as $petugas) {
            $kunciDedup = $suffixDedup ? "instansi_{$laporan->id}_{$petugas->id}_{$suffixDedup}" : null;
            $notif = $this->kirim(
                penggunaId: $petugas->id,
                laporanId: $laporan->id,
                tipe: $tipe,
                pesan: $pesan,
                kunciDedup: $kunciDedup
            );

            if ($notif) {
                $terkirim++;
            }
        }

        return $terkirim;
    }

    /**
     * Mengambil daftar notifikasi terpaginasi milik pengguna.
     */
    public function ambilNotifikasiUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Notifikasi::query()
            ->with(['laporan:id,nomor_tiket,judul,status'])
            ->where('pengguna_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Mengambil cuplikan notifikasi ringkas beserta hitungan belum dibaca untuk navbar header.
     *
     * @return array{unread_count: int, notifikasi: Collection<int, Notifikasi>}
     */
    public function ambilRingkasanNavbar(User $user, int $limit = 5): array
    {
        $unreadCount = Notifikasi::query()
            ->where('pengguna_id', $user->id)
            ->whereNull('dibaca_pada')
            ->count();

        $notifikasi = Notifikasi::query()
            ->with(['laporan:id,nomor_tiket,judul,status'])
            ->where('pengguna_id', $user->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return [
            'unread_count' => $unreadCount,
            'notifikasi' => $notifikasi,
        ];
    }

    /**
     * Menandai satu notifikasi atau semua notifikasi milik pengguna sebagai dibaca.
     */
    public function tandaiDibaca(User $user, ?int $notifikasiId = null): int
    {
        $query = Notifikasi::query()
            ->where('pengguna_id', $user->id)
            ->whereNull('dibaca_pada');

        if ($notifikasiId !== null) {
            $query->where('id', $notifikasiId);
        }

        return $query->update(['dibaca_pada' => now()]);
    }
}

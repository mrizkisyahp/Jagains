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

        $laporanDemoSebelumnya = Laporan::query()
            ->whereLike('nomor_tiket', 'JAG-2026-DEP-%')
            ->orderBy('nomor_tiket')
            ->get();
        if ($laporanDemoSebelumnya->isNotEmpty()) {
            if ($laporanDemoSebelumnya->count() !== 255) {
                throw new \RuntimeException('Data demo sebelumnya tidak lengkap. Jalankan php artisan migrate:fresh --seed.');
            }

            $laporanDemoSebelumnya->values()->each(function (Laporan $laporan, int $index): void {
                [$lintang, $bujur] = $this->koordinatDepok($index + 1);
                $laporan->forceFill(['lintang' => $lintang, 'bujur' => $bujur])->save();
            });

            return;
        }

        $kelurahan = Wilayah::query()->where('tingkat', 'kelurahan')->orderBy('id')->get();
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

    private function buatPerluRouting(int $nomor, $kelurahan, $kategori, $warga): void
    {
        $waktu = CarbonImmutable::now()->subDays(25 - $nomor);
        $pelapor = $warga[$nomor % $warga->count()];
        $laporan = Laporan::create($this->atributLaporan(
            sprintf('JAG-2026-DEP-ROUT-%03d', $nomor), null, $pelapor, $kelurahan[$nomor % $kelurahan->count()], $kategori[$nomor % $kategori->count()], 'PERLU_ROUTING', $waktu, 250 + $nomor,
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
        $laporan = Laporan::create($this->atributLaporan(
            sprintf('JAG-2026-DEP-%s-%03d', $kodeInstansi, $nomor),
            $instansi, $pelapor, $kelurahan[($nomor + $index) % $kelurahan->count()], $kategori[($nomor + $index) % $kategori->count()], $status, $waktu, ($index * 50) + $nomor,
        ));
        $this->catat($laporan, 'T-01', null, 'DITERUSKAN', $pelapor, $instansi, 'Laporan diteruskan ke instansi penerima.', $waktu);
        $this->fotoAwal($laporan, $pelapor, $waktu);
        $this->linimasa($laporan, $status, $petugas, $auditor, $waktu);
    }

    private function atributLaporan(string $nomorTiket, ?Instansi $instansi, User $pelapor, Wilayah $kelurahan, Kategori $kategori, string $status, CarbonImmutable $waktu, int $penyebarKoordinat): array
    {
        $butuhTarget = in_array($status, ['TERJADWAL_ANGGARAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);
        $ditutup = in_array($status, ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true);

        [$lintang, $bujur] = $this->koordinatDepok($penyebarKoordinat);

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

    /** @return array{0: float, 1: float} */
    private function koordinatDepok(int $penyebar): array
    {
        $baris = $penyebar % 17;
        $kolom = intdiv($penyebar, 17);
        $jitterLintang = (($kolom % 3) - 1) * 0.0007;
        $jitterBujur = (($baris % 3) - 1) * 0.0007;

        return [
            -6.450000 + ($baris * 0.007) + $jitterLintang,
            106.690000 + ($kolom * 0.012) + $jitterBujur,
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

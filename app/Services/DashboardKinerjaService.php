<?php

namespace App\Services;

use App\Models\HariLibur;
use App\Models\Instansi;
use App\Models\Laporan;
use App\Models\Pengaturan;
use App\Models\Wilayah;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardKinerjaService
{
    /**
     * Cache daftar tanggal libur resmi.
     *
     * @var array<string, bool>|null
     */
    protected ?array $daftarLibur = null;

    /**
     * Ambang batas minimal tiket tertutup (P-21).
     */
    protected int $ambangBatas = 20;

    public function __construct()
    {
        $ambangDb = Pengaturan::where('key', 'ambang_dashboard_tiket')->value('nilai');
        if ($ambangDb !== null) {
            $this->ambangBatas = (int) $ambangDb;
        }
    }

    public function getAmbangBatas(): int
    {
        return $this->ambangBatas;
    }

    /**
     * Menghitung selisih hari kerja (HK) antara dua tanggal dengan mengecualikan akhir pekan & libur nasional.
     */
    public function hitungHariKerja(Carbon $mulai, Carbon $selesai): int
    {
        if ($mulai->greaterThan($selesai)) {
            return 0;
        }

        if ($this->daftarLibur === null) {
            $this->daftarLibur = HariLibur::pluck('tanggal')
                ->map(fn ($t) => $t instanceof Carbon ? $t->toDateString() : (string) $t)
                ->flip()
                ->all();
        }

        $current = $mulai->copy()->startOfDay()->addDay();
        $target = $selesai->copy()->startOfDay();
        $hariKerja = 0;

        while ($current->lessThanOrEqualTo($target)) {
            // Cek bukan Sabtu (6) dan bukan Minggu (0)
            if (! $current->isWeekend()) {
                $dateString = $current->toDateString();
                if (! isset($this->daftarLibur[$dateString])) {
                    $hariKerja++;
                }
            }
            $current->addDay();
        }

        return $hariKerja;
    }

    /**
     * Mengambil matriks komparasi kinerja antarkecamatan di Kota Depok (FR-DSH-01).
     *
     * @return array<int, array<string, mixed>>
     */
    public function ambilDataPerbandinganKecamatan(string $periode = 'semua'): array
    {
        $kecamatanList = Wilayah::where('tingkat', 'kecamatan')
            ->orderBy('nama')
            ->get();

        $queryLaporan = $this->bangunQueryLaporan($periode);
        $semuaLaporan = $queryLaporan->with(['kelurahan', 'riwayatStatus'])->get();

        $hasil = [];

        foreach ($kecamatanList as $kecamatan) {
            // Filter laporan yang kelurahannya berada di bawah kecamatan ini
            $laporanKecamatan = $semuaLaporan->filter(function (Laporan $laporan) use ($kecamatan) {
                return $laporan->kelurahan?->induk_id === $kecamatan->id;
            });

            $hasil[] = $this->kalkulasiMetrikBaris($kecamatan->id, 'Kecamatan '.$kecamatan->nama, $laporanKecamatan);
        }

        return $hasil;
    }

    /**
     * Mengambil matriks komparasi kinerja antarinstansi di Kota Depok (FR-DSH-01).
     *
     * @return array<int, array<string, mixed>>
     */
    public function ambilDataPerbandinganInstansi(string $periode = 'semua'): array
    {
        $instansiList = Instansi::where('aktif', true)
            ->orderBy('nama')
            ->get();

        $queryLaporan = $this->bangunQueryLaporan($periode);
        $semuaLaporan = $queryLaporan->with(['riwayatStatus'])->get();

        $hasil = [];

        foreach ($instansiList as $instansi) {
            $laporanInstansi = $semuaLaporan->filter(function (Laporan $laporan) use ($instansi) {
                return $laporan->instansi_id === $instansi->id;
            });

            $hasil[] = $this->kalkulasiMetrikBaris($instansi->id, $instansi->nama, $laporanInstansi);
        }

        return $hasil;
    }

    /**
     * Filter rentang waktu periode laporan.
     */
    protected function bangunQueryLaporan(string $periode)
    {
        $query = Laporan::query();

        if ($periode === '30_hari') {
            $query->where('created_at', '>=', now()->subDays(30));
        } elseif ($periode === '90_hari') {
            $query->where('created_at', '>=', now()->subDays(90));
        }

        return $query;
    }

    /**
     * Mengkalkulasikan 6 indikator objektif BR-IND untuk sekumpulan tiket.
     *
     * @param  Collection<int, Laporan>  $laporanList
     * @return array<string, mixed>
     */
    protected function kalkulasiMetrikBaris(int $id, string $nama, Collection $laporanList): array
    {
        $totalTiket = $laporanList->count();
        $tiketSelesai = $laporanList->filter(fn (Laporan $l) => in_array($l->status, ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'], true))->count();

        $durasiResponsList = [];
        $durasiSelesaiList = [];
        $tepatJanjiCount = 0;
        $totalTerjadwalSelesai = 0;
        $anggaranMenggantungTotal = 0;
        $pernahVerifikasiCount = 0;
        $tertutupWargaCount = 0;
        $pernahSengketaCount = 0;

        foreach ($laporanList as $laporan) {
            $riwayat = $laporan->riwayatStatus->sortBy('waktu')->values();

            // 1. BR-IND-01: Median respons pertama (dari DITERUSKAN ke respons pertama)
            $waktuDiteruskan = null;
            $waktuRespons = null;

            foreach ($riwayat as $rw) {
                if ($waktuDiteruskan === null && $rw->status_baru === 'DITERUSKAN') {
                    $waktuDiteruskan = $rw->waktu;
                } elseif ($waktuDiteruskan !== null && in_array($rw->status_baru, ['DITERIMA', 'DISURVEI', 'TERJADWAL_ANGGARAN'], true)) {
                    $waktuRespons = $rw->waktu;
                    break;
                }
            }

            if ($waktuDiteruskan && $waktuRespons) {
                $durasiResponsList[] = $this->hitungHariKerja($waktuDiteruskan, $waktuRespons);
            }

            // 2. BR-IND-02: Median waktu ke diajukan selesai (dari DITERIMA ke MENUNGGU_VERIFIKASI)
            $waktuDiterima = null;
            $waktuVerifikasi = null;

            foreach ($riwayat as $rw) {
                if ($waktuDiterima === null && $rw->status_baru === 'DITERIMA') {
                    $waktuDiterima = $rw->waktu;
                } elseif ($waktuDiterima !== null && $rw->status_baru === 'MENUNGGU_VERIFIKASI') {
                    $waktuVerifikasi = $rw->waktu;
                    break;
                }
            }

            if ($waktuDiterima && $waktuVerifikasi) {
                $durasiSelesaiList[] = $this->hitungHariKerja($waktuDiterima, $waktuVerifikasi);
            }

            // 3. BR-IND-03: Janji Ditepati (selesai <= tanggal_target_awal)
            if ($laporan->tanggal_target_awal && $waktuVerifikasi) {
                $totalTerjadwalSelesai++;
                if ($waktuVerifikasi->startOfDay()->lessThanOrEqualTo($laporan->tanggal_target_awal->startOfDay())) {
                    $tepatJanjiCount++;
                }
            }

            // 4. BR-IND-04: Anggaran Menggantung (TERJADWAL_ANGGARAN melewati tanggal_target)
            if ($laporan->status === 'TERJADWAL_ANGGARAN' && $laporan->tanggal_target && now()->greaterThan($laporan->tanggal_target)) {
                $anggaranMenggantungTotal++;
            }

            // 5. BR-IND-05 & BR-IND-06: Tingkat Verifikasi & Tingkat Sengketa
            $pernahVerif = $riwayat->contains(fn ($rw) => $rw->status_baru === 'MENUNGGU_VERIFIKASI');
            $pernahSengketa = $riwayat->contains(fn ($rw) => $rw->status_baru === 'DISENGKETAKAN');

            if ($pernahVerif) {
                $pernahVerifikasiCount++;
                if ($laporan->status === 'TERTUTUP_WARGA') {
                    $tertutupWargaCount++;
                }
                if ($pernahSengketa) {
                    $pernahSengketaCount++;
                }
            }
        }

        // Kalkulasi Median
        $medianRespons = $this->hitungMedian($durasiResponsList);
        $medianSelesai = $this->hitungMedian($durasiSelesaiList);

        $janjiDitepatiPersen = $totalTerjadwalSelesai > 0
            ? round(($tepatJanjiCount / $totalTerjadwalSelesai) * 100, 1)
            : ($tiketSelesai > 0 ? 100.0 : 0.0);

        $tingkatVerifikasiPersen = $pernahVerifikasiCount > 0
            ? round(($tertutupWargaCount / $pernahVerifikasiCount) * 100, 1)
            : 0.0;

        $tingkatSengketaPersen = $pernahVerifikasiCount > 0
            ? round(($pernahSengketaCount / $pernahVerifikasiCount) * 100, 1)
            : 0.0;

        $dataCukup = $tiketSelesai >= $this->ambangBatas;

        return [
            'id' => $id,
            'nama' => $nama,
            'total_tiket' => $totalTiket,
            'tiket_selesai' => $tiketSelesai,
            'median_respons_hk' => $medianRespons,
            'median_selesai_hk' => $medianSelesai,
            'janji_ditepati_persen' => $janjiDitepatiPersen,
            'anggaran_menggantung_total' => $anggaranMenggantungTotal,
            'tingkat_verifikasi_persen' => $tingkatVerifikasiPersen,
            'tingkat_sengketa_persen' => $tingkatSengketaPersen,
            'data_cukup' => $dataCukup,
        ];
    }

    /**
     * Menghitung median dari array angka.
     *
     * @param  array<int, int>  $angkaList
     */
    protected function hitungMedian(array $angkaList): ?float
    {
        if (empty($angkaList)) {
            return null;
        }

        sort($angkaList);
        $count = count($angkaList);
        $middle = (int) floor($count / 2);

        if ($count % 2 === 1) {
            return (float) $angkaList[$middle];
        }

        return round(($angkaList[$middle - 1] + $angkaList[$middle]) / 2, 1);
    }
}

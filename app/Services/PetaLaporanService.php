<?php

namespace App\Services;

use App\Models\HariLibur;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\Wilayah;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class PetaLaporanService
{
    /**
     * Mengambil daftar titik laporan untuk ditampilkan pada peta dan drawer list.
     * Hanya mengambil laporan yang TIDAK disembunyikan oleh moderasi (FR-ADM-06).
     * Meniadakan seluruh data identitas pelapor (Zero-Knowledge Privacy BR-AKN-01 & FR-TKT-01).
     *
     * @param  array{
     *     kategori_id?: ?int,
     *     kecamatan_id?: ?int,
     *     kondisi_sla?: ?string,
     *     instansi_id?: ?int,
     *     rentang_waktu?: ?int,
     *     search?: ?string
     * }  $filters
     * @return array<int, array<string, mixed>>
     */
    public function ambilDataTitik(array $filters = []): array
    {
        $query = Laporan::query()
            ->where('disembunyikan', false)
            ->with([
                'kategori:id,nama',
                'instansi:id,nama',
                'kelurahan:id,nama,induk_id',
                'kelurahan.induk:id,nama',
            ])
            ->withCount('dukungan')
            ->select([
                'id',
                'nomor_tiket',
                'judul',
                'kategori_id',
                'instansi_id',
                'kelurahan_id',
                'status',
                'keparahan',
                'lintang',
                'bujur',
                'sla_tahap',
                'sla_batas',
                'sla_satuan',
                'sla_jatuh_tempo',
                'disembunyikan',
                'created_at',
            ]);

        // Filter Kategori
        if (! empty($filters['kategori_id'])) {
            $query->where('kategori_id', (int) $filters['kategori_id']);
        }

        // Filter Kecamatan (melalui induk_id kelurahan)
        if (! empty($filters['kecamatan_id'])) {
            $kecamatanId = (int) $filters['kecamatan_id'];
            $query->whereHas('kelurahan', function ($q) use ($kecamatanId) {
                $q->where('induk_id', $kecamatanId);
            });
        }

        // Filter Instansi Penanggung Jawab
        if (! empty($filters['instansi_id'])) {
            $query->where('instansi_id', (int) $filters['instansi_id']);
        }

        // Filter Rentang Waktu (dalam hari terakhir, misal 7, 30, 90)
        if (! empty($filters['rentang_waktu'])) {
            $hari = (int) $filters['rentang_waktu'];
            $query->where('created_at', '>=', now()->subDays($hari));
        }

        // Pencarian Teks (Nomor Tiket atau Judul)
        if (! empty($filters['search'])) {
            $keyword = trim((string) $filters['search']);
            $query->where(function ($q) use ($keyword) {
                $q->where('nomor_tiket', 'ilike', "%{$keyword}%")
                    ->orWhere('judul', 'ilike', "%{$keyword}%");
            });
        }

        $laporanCollection = $query->orderByDesc('created_at')->get();

        $titikList = [];
        $filterKondisi = ! empty($filters['kondisi_sla']) ? (string) $filters['kondisi_sla'] : null;

        foreach ($laporanCollection as $laporan) {
            $evaluasiSla = $this->tentukanKondisiSla($laporan);

            // Filter Kondisi SLA jika diterapkan
            if ($filterKondisi && $evaluasiSla['kondisi'] !== $filterKondisi) {
                continue;
            }

            $titikList[] = [
                'id' => $laporan->id,
                'nomor_tiket' => $laporan->nomor_tiket,
                'judul' => $laporan->judul,
                'kategori_id' => $laporan->kategori_id,
                'kategori_nama' => $laporan->kategori?->nama ?? 'Umum',
                'instansi_id' => $laporan->instansi_id,
                'instansi_nama' => $laporan->instansi?->nama,
                'kecamatan_id' => $laporan->kelurahan?->induk_id ?? 0,
                'kecamatan_nama' => $laporan->kelurahan?->induk?->nama ?? 'Kota Depok',
                'kelurahan_nama' => $laporan->kelurahan?->nama ?? '',
                'status' => $laporan->status,
                'keparahan' => $laporan->keparahan,
                'kondisi_sla' => $evaluasiSla['kondisi'],
                'label_sla' => $evaluasiSla['label'],
                'warna_sla' => $evaluasiSla['warna'],
                'ikon_sla' => $evaluasiSla['ikon'],
                'sisa_hari_sla' => $evaluasiSla['sisa_hari'],
                'sisa_sla_teks' => $evaluasiSla['sisa_teks'],
                'lintang' => (float) $laporan->lintang,
                'bujur' => (float) $laporan->bujur,
                'jumlah_dukungan' => (int) ($laporan->dukungan_count ?? 0),
                'created_at' => $laporan->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ];
        }

        return $titikList;
    }

    /**
     * Menentukan kondisi status SLA penanda peta berdasarkan BR-SLA-06.
     * Mengembalikan kondisi: dalam_sla, hampir_lewat, lewat_sla, menunggu_warga, selesai.
     *
     * @return array{
     *     kondisi: 'dalam_sla'|'hampir_lewat'|'lewat_sla'|'menunggu_warga'|'selesai',
     *     label: string,
     *     warna: string,
     *     ikon: string,
     *     sisa_hari: ?int,
     *     sisa_teks: string
     * }
     */
    public function tentukanKondisiSla(Laporan $laporan, ?CarbonInterface $sekarang = null): array
    {
        $now = $sekarang ? $sekarang->copy() : now();
        $status = $laporan->status;

        // 1. Tiket Selesai / Ditutup Permanen
        if (in_array($status, ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'], true)) {
            $label = $status === 'DITOLAK' ? 'Ditolak' : 'Selesai';

            return [
                'kondisi' => 'selesai',
                'label' => $label,
                'warna' => '#64748b', // Slate
                'ikon' => 'CheckCheck',
                'sisa_hari' => null,
                'sisa_teks' => $status === 'DITOLAK' ? 'Laporan ditolak oleh instansi' : 'Perbaikan telah selesai diverifikasi',
            ];
        }

        // 2. Tiket Menunggu Warga / Arbitrase Auditor
        if (in_array($status, ['MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'USULAN_TOLAK', 'MENUNGGU_KEPUTUSAN_AUDITOR'], true)) {
            $isVerifikasi = $status === 'MENUNGGU_VERIFIKASI';

            return [
                'kondisi' => 'menunggu_warga',
                'label' => $isVerifikasi ? 'Menunggu Verifikasi Warga' : 'Proses Arbitrase / Auditor',
                'warna' => '#3b82f6', // Blue
                'ikon' => $isVerifikasi ? 'Users' : 'Scale',
                'sisa_hari' => null,
                'sisa_teks' => $isVerifikasi ? 'Menunggu kuorum verifikasi warga kelurahan' : 'Sedang ditinjau oleh Auditor Independen',
            ];
        }

        // 3. Tiket Tanpa Kolom SLA (misal: PERLU_ROUTING sebelum masuk dinas)
        if ($status === 'PERLU_ROUTING' || empty($laporan->sla_jatuh_tempo)) {
            return [
                'kondisi' => 'dalam_sla',
                'label' => 'Menunggu Disposisi',
                'warna' => '#10b981', // Emerald
                'ikon' => 'Clock',
                'sisa_hari' => null,
                'sisa_teks' => 'Menunggu disposisi penugasan ke dinas teknis',
            ];
        }

        // 4. Tiket Dalam Tahap Pengerjaan Ber-SLA
        $jatuhTempo = Carbon::parse($laporan->sla_jatuh_tempo);
        $tahapLabel = ucwords(strtolower(str_replace('_', ' ', (string) ($laporan->sla_tahap ?? 'Pengerjaan'))));

        // Evaluasi Keterlambatan
        if ($now->toDateString() > $jatuhTempo->toDateString()) {
            $hariTerlambat = $this->hitungHariKerja($jatuhTempo, $now);
            $hariTerlambat = max(1, $hariTerlambat);

            return [
                'kondisi' => 'lewat_sla',
                'label' => 'Lewat Batas SLA',
                'warna' => '#ef4444', // Rose/Red
                'ikon' => 'AlertTriangle',
                'sisa_hari' => -$hariTerlambat,
                'sisa_teks' => "Terlambat {$hariTerlambat} hari kerja tahap {$tahapLabel}",
            ];
        }

        // Evaluasi Sisa Waktu
        $sisaHariKerja = $this->hitungHariKerja($now, $jatuhTempo);
        $totalBatas = (int) ($laporan->sla_batas ?? 3);
        $ratio = $totalBatas > 0 ? ($sisaHariKerja / $totalBatas) : 1.0;

        // BR-SLA-06: Kuning bila 50% atau kurang dari batas tahap
        if ($ratio <= 0.5) {
            return [
                'kondisi' => 'hampir_lewat',
                'label' => 'Hampir Lewat',
                'warna' => '#f59e0b', // Amber
                'ikon' => 'Hourglass',
                'sisa_hari' => $sisaHariKerja,
                'sisa_teks' => "Sisa {$sisaHariKerja} hari kerja tahap {$tahapLabel}",
            ];
        }

        // Hijau bila sisa waktu > 50%
        return [
            'kondisi' => 'dalam_sla',
            'label' => 'Dalam SLA',
            'warna' => '#10b981', // Emerald
            'ikon' => 'ShieldCheck',
            'sisa_hari' => $sisaHariKerja,
            'sisa_teks' => "Sisa {$sisaHariKerja} hari kerja tahap {$tahapLabel}",
        ];
    }

    /**
     * Menghitung jumlah hari kerja antara dua tanggal (melompati akhir pekan dan hari libur).
     */
    public function hitungHariKerja(CarbonInterface $dari, CarbonInterface $sampai): int
    {
        $current = $dari->copy()->startOfDay();
        $target = $sampai->copy()->startOfDay();

        if ($current->gt($target)) {
            [$current, $target] = [$target, $current];
        }

        $hariKerja = 0;
        while ($current->lt($target)) {
            $current = $current->addDay();
            // Lewati Sabtu & Minggu
            if ($current->isWeekend()) {
                continue;
            }
            // Lewati hari libur nasional jika ada
            if (HariLibur::where('tanggal', $current->toDateString())->exists()) {
                continue;
            }
            $hariKerja++;
        }

        return $hariKerja;
    }

    /**
     * Mengambil master data filter untuk dropdown antarmuka.
     *
     * @return array{
     *     kategori: Collection<int, Kategori>,
     *     kecamatan: Collection<int, Wilayah>,
     *     instansi: Collection<int, Instansi>,
     *     statistik: array{
     *         total_laporan: int,
     *         laporan_aktif: int,
     *         laporan_selesai: int
     *     }
     * }
     */
    public function ambilMasterFilter(): array
    {
        $kategori = Kategori::where('aktif', true)
            ->select(['id', 'nama'])
            ->orderBy('nama')
            ->get();

        // Ambil kecamatan di bawah Kota Depok (induk_id = 1 atau nama induk Kota Depok)
        $kecamatan = Wilayah::where('tingkat', 'kecamatan')
            ->where(function ($q) {
                $q->where('induk_id', 1)
                    ->orWhereHas('induk', fn ($indukQuery) => $indukQuery->where('nama', 'ilike', '%Depok%'));
            })
            ->select(['id', 'nama'])
            ->orderBy('nama')
            ->get();

        $instansi = Instansi::select(['id', 'nama'])
            ->orderBy('nama')
            ->get();

        $totalLaporan = Laporan::where('disembunyikan', false)->count();
        $laporanSelesai = Laporan::where('disembunyikan', false)
            ->whereIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->count();
        $laporanAktif = $totalLaporan - $laporanSelesai;

        return [
            'kategori' => $kategori,
            'kecamatan' => $kecamatan,
            'instansi' => $instansi,
            'statistik' => [
                'total_laporan' => $totalLaporan,
                'laporan_aktif' => max(0, $laporanAktif),
                'laporan_selesai' => $laporanSelesai,
            ],
        ];
    }
}

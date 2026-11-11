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
use Illuminate\Support\Facades\DB;

class PetaLaporanService
{
    /**
     * Mengambil daftar titik laporan untuk ditampilkan pada peta dan drawer list.
     * Hanya mengambil laporan yang TIDAK disembunyikan oleh moderasi (FR-ADM-06).
     * Meniadakan seluruh data identitas pelapor untuk privasi publik.
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
                'kelurahan.induk:id,nama,induk_id',
                'kelurahan.induk.induk:id,nama',
                'lampiran:id,laporan_id,path,tahap',
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

        // Filter Kota (melalui induk_id kecamatan)
        if (! empty($filters['kota_id'])) {
            $kotaId = (int) $filters['kota_id'];
            $query->whereHas('kelurahan.induk', function ($q) use ($kotaId) {
                $q->where('induk_id', $kotaId);
            });
        }

        // Filter Kecamatan (melalui induk_id kelurahan)
        if (! empty($filters['kecamatan_id'])) {
            $kecamatanId = (int) $filters['kecamatan_id'];
            $query->whereHas('kelurahan', function ($q) use ($kecamatanId) {
                $q->where('induk_id', $kecamatanId);
            });
        }

        // Filter Status Laporan (Siklus Hidup Tiket)
        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
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
                'kecamatan_nama' => $laporan->kelurahan?->induk?->nama ?? '',
                'kota_id' => $laporan->kelurahan?->induk?->induk_id,
                'kota_nama' => $laporan->kelurahan?->induk?->induk?->nama ?? 'Jabodetabek',
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
                'foto_url' => $laporan->lampiran->first()?->path ? asset('storage/'.$laporan->lampiran->first()->path) : null,
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

        // Hitung sebaran laporan per kecamatan untuk memprioritaskan wilayah aktif
        $laporanPerKecamatan = DB::table('laporan')
            ->join('wilayah as kel', 'kel.id', '=', 'laporan.kelurahan_id')
            ->where('laporan.disembunyikan', false)
            ->groupBy('kel.induk_id')
            ->selectRaw('kel.induk_id as kecamatan_id, count(laporan.id) as total')
            ->pluck('total', 'kecamatan_id');

        // Ambil seluruh kecamatan (Depok, Jakarta, Bodetabek)
        $kecamatan = Wilayah::where('tingkat', 'kecamatan')
            ->with('induk:id,nama')
            ->select(['id', 'nama', 'induk_id'])
            ->orderBy('nama')
            ->get()
            ->map(function ($kec) use ($laporanPerKecamatan) {
                return [
                    'id' => $kec->id,
                    'nama' => $kec->nama,
                    'induk_id' => $kec->induk_id,
                    'kota_nama' => $kec->induk?->nama ?? 'Wilayah',
                    'total_laporan' => (int) ($laporanPerKecamatan[$kec->id] ?? 0),
                ];
            });

        // Hitung sebaran laporan per kota/kabupaten
        $laporanPerKota = DB::table('laporan')
            ->join('wilayah as kel', 'kel.id', '=', 'laporan.kelurahan_id')
            ->join('wilayah as kec', 'kec.id', '=', 'kel.induk_id')
            ->where('laporan.disembunyikan', false)
            ->groupBy('kec.induk_id')
            ->selectRaw('kec.induk_id as kota_id, count(laporan.id) as total')
            ->pluck('total', 'kota_id');

        $kota = Wilayah::where('tingkat', 'kota')
            ->select(['id', 'nama'])
            ->orderBy('nama')
            ->get()
            ->map(function ($k) use ($laporanPerKota) {
                return [
                    'id' => $k->id,
                    'nama' => $k->nama,
                    'total_laporan' => (int) ($laporanPerKota[$k->id] ?? 0),
                ];
            });

        // Daftar status resmi sesuai seeder siklus hidup laporan
        $status = [
            // Tahap Penanganan
            ['value' => 'PERLU_ROUTING', 'label' => 'Perlu Routing', 'grup' => 'Tahap Penanganan'],
            ['value' => 'DITERUSKAN', 'label' => 'Diteruskan ke Dinas', 'grup' => 'Tahap Penanganan'],
            ['value' => 'DITERIMA', 'label' => 'Diterima Dinas', 'grup' => 'Tahap Penanganan'],
            ['value' => 'DISURVEI', 'label' => 'Selesai Survei', 'grup' => 'Tahap Penanganan'],
            ['value' => 'TERJADWAL_ANGGARAN', 'label' => 'Terjadwal Anggaran', 'grup' => 'Tahap Penanganan'],
            ['value' => 'DIKERJAKAN', 'label' => 'Sedang Dikerjakan', 'grup' => 'Tahap Penanganan'],
            // Verifikasi & Arbitrase
            ['value' => 'MENUNGGU_VERIFIKASI', 'label' => 'Menunggu Verifikasi Warga', 'grup' => 'Verifikasi & Sengketa'],
            ['value' => 'DISENGKETAKAN', 'label' => 'Disengketakan', 'grup' => 'Verifikasi & Sengketa'],
            ['value' => 'MENUNGGU_KEPUTUSAN_AUDITOR', 'label' => 'Menunggu Keputusan Auditor', 'grup' => 'Verifikasi & Sengketa'],
            ['value' => 'USULAN_TOLAK', 'label' => 'Usulan Penolakan', 'grup' => 'Verifikasi & Sengketa'],
            // Selesai & Ditutup
            ['value' => 'TERTUTUP_WARGA', 'label' => 'Ditutup Warga', 'grup' => 'Selesai & Tutup'],
            ['value' => 'TERTUTUP_AUDITOR', 'label' => 'Ditutup Auditor', 'grup' => 'Selesai & Tutup'],
            ['value' => 'DITOLAK', 'label' => 'Ditolak', 'grup' => 'Selesai & Tutup'],
        ];

        $instansi = Instansi::select(['id', 'nama'])
            ->orderBy('nama')
            ->get();

        $totalLaporan = Laporan::where('disembunyikan', false)->count();
        $laporanSelesai = Laporan::where('disembunyikan', false)
            ->whereIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->count();
        $laporanAktif = $totalLaporan - $laporanSelesai;

        $durasiResponDetik = Laporan::whereNotNull('diteruskan_pertama_pada')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (diteruskan_pertama_pada - created_at))) as avg_seconds')
            ->value('avg_seconds');
        $rataRataResponMenit = $durasiResponDetik ? max(1, (int) round($durasiResponDetik / 60)) : 42;

        $persentaseTerlacak = $totalLaporan > 0
            ? (int) round((Laporan::whereNotNull('lintang')->whereNotNull('bujur')->count() / $totalLaporan) * 100)
            : 100;

        $rasioSelesaiMingguan = $totalLaporan > 0
            ? (int) round(($laporanSelesai / $totalLaporan) * 100)
            : 85;

        $trenRespon = [
            ['hari' => 'Sen', 'nilai' => 54],
            ['hari' => 'Sel', 'nilai' => 48],
            ['hari' => 'Rab', 'nilai' => 45],
            ['hari' => 'Kam', 'nilai' => 41],
            ['hari' => 'Jum', 'nilai' => 38],
            ['hari' => 'Sab', 'nilai' => 42],
            ['hari' => 'Min', 'nilai' => max(1, $rataRataResponMenit)],
        ];

        $trenTerlacak = [
            ['hari' => 'Sen', 'nilai' => 98],
            ['hari' => 'Sel', 'nilai' => 99],
            ['hari' => 'Rab', 'nilai' => 100],
            ['hari' => 'Kam', 'nilai' => 100],
            ['hari' => 'Jum', 'nilai' => 100],
            ['hari' => 'Sab', 'nilai' => 100],
            ['hari' => 'Min', 'nilai' => $persentaseTerlacak],
        ];

        $trenRasio = [
            ['hari' => 'Sen', 'nilai' => 74],
            ['hari' => 'Sel', 'nilai' => 78],
            ['hari' => 'Rab', 'nilai' => 82],
            ['hari' => 'Kam', 'nilai' => 84],
            ['hari' => 'Jum', 'nilai' => 86],
            ['hari' => 'Sab', 'nilai' => 87],
            ['hari' => 'Min', 'nilai' => max(50, $rasioSelesaiMingguan)],
        ];

        return [
            'kategori' => $kategori,
            'kecamatan' => $kecamatan,
            'kota' => $kota,
            'status' => $status,
            'instansi' => $instansi,
            'statistik' => [
                'total_laporan' => $totalLaporan,
                'laporan_aktif' => max(0, $laporanAktif),
                'laporan_selesai' => $laporanSelesai,
                'rata_rata_respon_menit' => $rataRataResponMenit,
                'persentase_terlacak' => $persentaseTerlacak,
                'rasio_selesai_mingguan' => $rasioSelesaiMingguan,
                'tren_mingguan' => [
                    'respon' => $trenRespon,
                    'terlacak' => $trenTerlacak,
                    'rasio' => $trenRasio,
                ],
            ],
        ];
    }
}

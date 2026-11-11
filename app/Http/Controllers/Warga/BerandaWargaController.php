<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use App\Services\DashboardKinerjaService;
use App\Services\PetaLaporanService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BerandaWargaController extends Controller
{
    public function __construct(
        protected PetaLaporanService $petaService,
        protected DashboardKinerjaService $dashboardService,
    ) {}

    /**
     * Menampilkan Beranda Utama Warga (Wireframe - 15).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing(['kelurahan.induk.induk']);

        // 1. Peta Eksplor (Titik aktif di sekitar Depok / Kelurahan warga)
        $titikLaporan = $this->petaService->ambilDataTitik([
            'limit' => 60,
        ]);

        // Laporan unggulan untuk kartu samping peta
        $laporanUnggulanRaw = Laporan::query()
            ->when($user->kelurahan_id, fn ($q) => $q->orderByRaw("case when kelurahan_id = {$user->kelurahan_id} then 0 else 1 end"))
            ->whereNotIn('status', ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'])
            ->with(['kategori', 'kelurahan.induk.induk', 'lampiran'])
            ->withCount('dukungan')
            ->latest('id')
            ->first();

        // Fallback jika tidak ada tiket aktif yang belum tertutup
        if (! $laporanUnggulanRaw) {
            $laporanUnggulanRaw = Laporan::query()
                ->with(['kategori', 'kelurahan.induk.induk', 'lampiran'])
                ->withCount('dukungan')
                ->latest('id')
                ->first();
        }

        $laporanUnggulan = null;
        if ($laporanUnggulanRaw) {
            $foto = $laporanUnggulanRaw->lampiran->first();
            $evaluasiSla = $this->petaService->tentukanKondisiSla($laporanUnggulanRaw);
            $laporanUnggulan = [
                'id' => $laporanUnggulanRaw->id,
                'nomor_tiket' => $laporanUnggulanRaw->nomor_tiket,
                'judul' => $laporanUnggulanRaw->judul,
                'status' => $laporanUnggulanRaw->status,
                'kategori_nama' => $laporanUnggulanRaw->kategori?->nama ?? 'Fasilitas Umum',
                'lokasi' => $laporanUnggulanRaw->kelurahan
                    ? "Kel. {$laporanUnggulanRaw->kelurahan->nama}, Kec. {$laporanUnggulanRaw->kelurahan->induk?->nama}".($laporanUnggulanRaw->kelurahan->induk?->induk?->nama ? ", {$laporanUnggulanRaw->kelurahan->induk->induk->nama}" : '')
                    : 'Jabodetabek',
                'foto_url' => $foto ? $foto->url : null,
                'sisa_hari_sla' => $evaluasiSla['sisa_hari'] ?? null,
                'sisa_teks' => $evaluasiSla['sisa_teks'] ?? ($evaluasiSla['sisa_hari'] !== null ? "Sisa {$evaluasiSla['sisa_hari']} hari kerja" : 'Sesuai SLA'),
                'kondisi_sla' => $evaluasiSla['kondisi'],
                'jumlah_dukungan' => $laporanUnggulanRaw->dukungan_count,
            ];
        }

        // 2. Riwayat Laporan Pengguna (Maksimal 3 tiket terbaru milik user)
        $riwayatLaporan = Laporan::query()
            ->where('pelapor_id', $user->id)
            ->with(['kategori', 'kelurahan.induk.induk', 'lampiran'])
            ->withCount('dukungan')
            ->latest('id')
            ->take(3)
            ->get()
            ->map(function ($lap) {
                $foto = $lap->lampiran->first();
                $evaluasiSla = $this->petaService->tentukanKondisiSla($lap);

                return [
                    'id' => $lap->id,
                    'nomor_tiket' => $lap->nomor_tiket,
                    'judul' => $lap->judul,
                    'status' => $lap->status,
                    'kategori_nama' => $lap->kategori?->nama ?? 'Fasilitas Umum',
                    'lokasi' => $lap->kelurahan
                        ? "Kel. {$lap->kelurahan->nama}, Kec. {$lap->kelurahan->induk?->nama}".($lap->kelurahan->induk?->induk?->nama ? ", {$lap->kelurahan->induk->induk->nama}" : '')
                        : 'Jabodetabek',
                    'foto_url' => $foto ? $foto->url : null,
                    'sisa_hari_sla' => $evaluasiSla['sisa_hari'] ?? null,
                    'sisa_teks' => $evaluasiSla['sisa_teks'] ?? ($evaluasiSla['sisa_hari'] !== null ? "Sisa {$evaluasiSla['sisa_hari']} hari kerja" : 'Selesai'),
                    'kondisi_sla' => $evaluasiSla['kondisi'],
                    'jumlah_dukungan' => $lap->dukungan_count,
                    'tanggal_format' => $lap->created_at->translatedFormat('d M Y'),
                ];
            });

        // 3. Kualitas Kinerja di Wilayahmu
        $semuaLaporanWilayah = Laporan::query()
            ->when($user->kelurahan?->induk_id, function ($q, $kecId) {
                $q->whereHas('kelurahan', fn ($kq) => $kq->where('induk_id', $kecId));
            })
            ->with(['riwayatStatus'])
            ->get();

        // Hitung metrik BR-IND untuk wilayah warga
        $metrikWilayah = $this->dashboardService->kalkulasiMetrikBaris(
            $user->kelurahan_id ?? 1,
            $user->kelurahan ? "Kecamatan {$user->kelurahan->induk?->nama}" : 'Seluruh Wilayah',
            $semuaLaporanWilayah
        );

        $namaWilayah = $user->kelurahan
            ? "Kel. {$user->kelurahan->nama}, Kec. {$user->kelurahan->induk?->nama}"
            : 'Jabodetabek';

        // Hitung rata-rata keterlambatan anggaran
        $laporanAnggaran = $semuaLaporanWilayah
            ->filter(fn ($l) => $l->status === 'TERJADWAL_ANGGARAN' && $l->tanggal_target && now()->greaterThan($l->tanggal_target));

        $rataRataKeterlambatan = 0.0;
        if ($laporanAnggaran->isNotEmpty()) {
            $totalHari = $laporanAnggaran->sum(fn ($l) => now()->startOfDay()->diffInDays(Carbon::parse($l->tanggal_target)->startOfDay()));
            $rataRataKeterlambatan = round($totalHari / $laporanAnggaran->count(), 1);
        }

        return Inertia::render('warga/beranda', [
            'nama_warga' => $user->username,
            'nama_wilayah' => $namaWilayah,
            'peta' => [
                'titik' => $titikLaporan,
                'laporan_unggulan' => $laporanUnggulan,
                'pusat' => [
                    'lat' => $user->kelurahan?->lintang ? (float) $user->kelurahan->lintang : -6.2088,
                    'lng' => $user->kelurahan?->bujur ? (float) $user->kelurahan->bujur : 106.8456,
                ],
            ],
            'riwayat_laporan' => $riwayatLaporan,
            'kinerja_wilayah' => [
                'median_respons_hari' => $metrikWilayah['median_respons_hk'] ?? 1.2,
                'median_durasi_hari' => $metrikWilayah['median_selesai_hk'] ?? 4.5,
                'indikator_kinerja' => [
                    'janji_ditepati' => [
                        'persen' => (float) ($metrikWilayah['janji_ditepati_persen'] ?? 100.0),
                        'label_tingkat' => ($metrikWilayah['janji_ditepati_persen'] ?? 100) >= 85 ? 'Sangat Baik' : 'Baik',
                        'tepat_waktu' => (int) round($metrikWilayah['janji_ditepati_persen'] ?? 100),
                        'terlambat' => (int) max(0, 100 - round($metrikWilayah['janji_ditepati_persen'] ?? 100)),
                    ],
                    'persentase_verifikasi' => [
                        'persen' => (float) ($metrikWilayah['tingkat_verifikasi_persen'] ?? 100.0),
                        'label_tingkat' => ($metrikWilayah['tingkat_verifikasi_persen'] ?? 100) >= 80 ? 'Tinggi' : 'Cukup',
                        'diverifikasi' => (int) round($metrikWilayah['tingkat_verifikasi_persen'] ?? 100),
                        'ditolak' => (int) max(0, 100 - round($metrikWilayah['tingkat_verifikasi_persen'] ?? 100)),
                    ],
                    'anggaran_menggantung' => [
                        'total_tiket' => (int) ($metrikWilayah['anggaran_menggantung_total'] ?? 0),
                        'rata_rata_keterlambatan_hari' => $rataRataKeterlambatan,
                    ],
                ],
            ],
        ]);
    }
}

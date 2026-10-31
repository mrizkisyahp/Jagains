<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardInstansiController extends Controller
{
    /**
     * Menampilkan dashboard analitik kinerja internal instansi teknis (FR-DSH-02).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $instansiId = $user->instansi_id;

        $laporanQuery = Laporan::where('instansi_id', $instansiId);

        $totalTiket = (clone $laporanQuery)->count();

        $tiketSelesai = (clone $laporanQuery)
            ->whereIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'])
            ->count();

        $tiketBerjalan = (clone $laporanQuery)
            ->whereNotIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->count();

        $tiketMenungguVerifikasi = (clone $laporanQuery)
            ->where('status', 'MENUNGGU_VERIFIKASI')
            ->count();

        // Tiket yang telah melampaui jatuh tempo SLA
        $tiketLewatSla = (clone $laporanQuery)
            ->whereNotNull('sla_jatuh_tempo')
            ->where('sla_jatuh_tempo', '<', now())
            ->whereNotIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->count();

        // Distribusi Tahap
        $daftarStatus = [
            'DITERUSKAN',
            'DITERIMA',
            'DISURVEI',
            'TERJADWAL_ANGGARAN',
            'DIKERJAKAN',
            'MENUNGGU_VERIFIKASI',
            'DISENGKETAKAN',
            'TERTUTUP_WARGA',
        ];

        $countsByStatus = (clone $laporanQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $distribusiTahap = [];
        foreach ($daftarStatus as $st) {
            $distribusiTahap[$st] = $countsByStatus[$st] ?? 0;
        }

        // Tiket Prioritas (Mendekati atau lewat SLA)
        $tiketPrioritas = (clone $laporanQuery)
            ->with(['kategori:id,nama', 'kelurahan:id,nama'])
            ->whereNotIn('status', ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'])
            ->orderByRaw('sla_jatuh_tempo ASC NULLS LAST')
            ->limit(5)
            ->get()
            ->map(fn (Laporan $l) => [
                'id' => $l->id,
                'nomor_tiket' => $l->nomor_tiket,
                'judul' => $l->judul,
                'kategori' => $l->kategori?->nama,
                'kelurahan' => $l->kelurahan?->nama,
                'status' => $l->status,
                'sla_jatuh_tempo' => $l->sla_jatuh_tempo?->toISOString(),
                'created_at' => $l->created_at->toISOString(),
            ]);

        return Inertia::render('instansi/dashboard', [
            'statistik' => [
                'total_tiket' => $totalTiket,
                'tiket_berjalan' => $tiketBerjalan,
                'tiket_lewat_sla' => $tiketLewatSla,
                'tiket_menunggu_verifikasi' => $tiketMenungguVerifikasi,
                'tiket_selesai' => $tiketSelesai,
            ],
            'distribusiTahap' => $distribusiTahap,
            'tiketPrioritas' => $tiketPrioritas,
        ]);
    }
}

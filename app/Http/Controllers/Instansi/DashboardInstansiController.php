<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Models\Instansi;
use App\Models\Laporan;
use App\Services\DashboardKinerjaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardInstansiController extends Controller
{
    public function __construct(
        protected DashboardKinerjaService $dashboardService,
    ) {}

    /**
     * Menampilkan dashboard analitik kinerja internal instansi teknis (FR-DSH-02).
     */
    public function index(Request $request): Response
    {
        $periode = $request->query('periode', 'semua');
        if (! in_array($periode, ['30_hari', '90_hari', 'semua'], true)) {
            $periode = 'semua';
        }

        $instansi = Instansi::findOrFail($request->user()->instansi_id);
        $laporanQuery = Laporan::query()
            ->whereBelongsTo($instansi)
            ->when($periode === '30_hari', fn ($query) => $query->where('created_at', '>=', now()->subDays(30)))
            ->when($periode === '90_hari', fn ($query) => $query->where('created_at', '>=', now()->subDays(90)));

        $statusTerminal = ['DITOLAK', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'];
        $tiketAktifQuery = (clone $laporanQuery)->whereNotIn('status', $statusTerminal);
        $tiketLewatSla = (clone $tiketAktifQuery)
            ->whereNotNull('sla_jatuh_tempo')
            ->where('sla_jatuh_tempo', '<', now()->startOfDay())
            ->count();

        $tindakan = [
            'lewat_sla' => $tiketLewatSla,
            'perlu_respons' => (clone $tiketAktifQuery)->where('status', 'DITERUSKAN')->count(),
            'perlu_respons_sengketa' => (clone $tiketAktifQuery)->where('status', 'DISENGKETAKAN')->count(),
            'menunggu_verifikasi' => (clone $tiketAktifQuery)->where('status', 'MENUNGGU_VERIFIKASI')->count(),
        ];

        $tindakan['prioritas'] = (clone $tiketAktifQuery)
            ->with(['kategori:id,nama', 'kelurahan:id,nama'])
            ->orderByRaw("case when sla_jatuh_tempo < current_date then 0 when status = 'DISENGKETAKAN' then 1 when status = 'DITERUSKAN' then 2 when sla_jatuh_tempo is not null then 3 else 4 end")
            ->orderBy('sla_jatuh_tempo')
            ->orderBy('created_at')
            ->limit(8)
            ->get()
            ->map(function (Laporan $laporan): array {
                $sisaHariSla = $laporan->sla_jatuh_tempo
                    ? (int) now()->startOfDay()->diffInDays($laporan->sla_jatuh_tempo->copy()->startOfDay(), false)
                    : null;

                return [
                    'id' => $laporan->id,
                    'nomor_tiket' => $laporan->nomor_tiket,
                    'judul' => $laporan->judul,
                    'status' => $laporan->status,
                    'kategori' => $laporan->kategori?->nama,
                    'kelurahan' => $laporan->kelurahan?->nama,
                    'urgensi' => $sisaHariSla !== null && $sisaHariSla < 0
                        ? 'lewat_sla'
                        : ($laporan->status === 'DISENGKETAKAN'
                            ? 'sengketa'
                            : ($laporan->status === 'DITERUSKAN' ? 'perlu_respons' : 'sla_aktif')),
                    'sisa_hari_sla' => $sisaHariSla,
                ];
            })
            ->values();

        $statusPipeline = [
            'DITERUSKAN',
            'DITERIMA',
            'DISURVEI',
            'TERJADWAL_ANGGARAN',
            'DIKERJAKAN',
            'MENUNGGU_VERIFIKASI',
            'DISENGKETAKAN',
            'MENUNGGU_KEPUTUSAN_AUDITOR',
            'TERTUTUP_WARGA',
            'TERTUTUP_AUDITOR',
            'DITOLAK',
        ];
        $jumlahStatus = (clone $laporanQuery)
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');
        $pipeline = collect($statusPipeline)
            ->map(fn (string $status): array => ['status' => $status, 'jumlah' => (int) ($jumlahStatus[$status] ?? 0)])
            ->values();

        $metrik = $this->dashboardService->ambilMetrikInstansi($instansi, $periode);

        return Inertia::render('instansi/dashboard', [
            'periode' => $periode,
            'diperbarui_pada' => now()->toISOString(),
            'tindakan' => $tindakan,
            'pipeline' => $pipeline,
            'kualitas' => [
                'data_cukup' => $metrik['data_cukup'],
                'ambang_tiket_tertutup' => $this->dashboardService->getAmbangBatas(),
                'tiket_tertutup' => $metrik['tiket_selesai'],
                'median_respons_hk' => $metrik['median_respons_hk'],
                'median_selesai_hk' => $metrik['median_selesai_hk'],
                'janji_ditepati_persen' => $metrik['janji_ditepati_persen'],
                'anggaran_menggantung_total' => $metrik['anggaran_menggantung_total'],
                'tingkat_verifikasi_persen' => $metrik['tingkat_verifikasi_persen'],
                'tingkat_sengketa_persen' => $metrik['tingkat_sengketa_persen'],
            ],
        ]);
    }
}

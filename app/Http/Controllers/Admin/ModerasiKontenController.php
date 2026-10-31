<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TindakanModerasiRequest;
use App\Models\LaporanPelanggaran;
use App\Services\ModerasiKontenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModerasiKontenController extends Controller
{
    public function __construct(
        protected ModerasiKontenService $moderasiService
    ) {}

    /**
     * Menampilkan antrean moderasi laporan pelanggaran konten (FR-ADM-06).
     */
    public function index(Request $request): Response
    {
        $statusFilter = $request->query('status', 'menunggu');

        $query = LaporanPelanggaran::with([
            'laporan.kategori:id,nama',
            'laporan.kelurahan:id,nama',
            'laporan.lampiran',
            'laporan.pelapor:id,username,poin_peringatan,status_akun',
            'pelapor:id,username',
            'moderator:id,username',
        ])->orderBy('created_at', 'asc');

        if ($statusFilter && in_array($statusFilter, ['menunggu', 'ditinjau', 'selesai'])) {
            $query->where('status', $statusFilter);
        }

        $antreanModerasi = $query->paginate(10)
            ->withQueryString()
            ->through(fn (LaporanPelanggaran $p) => [
                'id' => $p->id,
                'alasan' => $p->alasan,
                'catatan' => $p->catatan,
                'status' => $p->status,
                'tindakan' => $p->tindakan,
                'catatan_moderator' => $p->catatan_moderator,
                'created_at' => $p->created_at->toISOString(),
                'pelapor_pengadu' => [
                    'id' => $p->pelapor?->id,
                    'username' => $p->pelapor?->username,
                ],
                'moderator' => $p->moderator ? [
                    'id' => $p->moderator->id,
                    'username' => $p->moderator->username,
                ] : null,
                'laporan' => [
                    'id' => $p->laporan->id,
                    'nomor_tiket' => $p->laporan->nomor_tiket,
                    'judul' => $p->laporan->judul,
                    'keterangan' => $p->laporan->keterangan,
                    'keparahan' => $p->laporan->keparahan,
                    'disembunyikan' => (bool) $p->laporan->disembunyikan,
                    'kategori' => $p->laporan->kategori?->nama,
                    'kelurahan' => $p->laporan->kelurahan?->nama,
                    'foto' => $p->laporan->lampiran->first()?->path,
                    'pelapor_tiket' => [
                        'id' => $p->laporan->pelapor?->id,
                        'username' => $p->laporan->pelapor?->username,
                        'poin_peringatan' => $p->laporan->pelapor?->poin_peringatan ?? 0,
                        'status_akun' => $p->laporan->pelapor?->status_akun ?? 'aktif',
                    ],
                ],
            ]);

        return Inertia::render('admin/moderasi', [
            'antreanModerasi' => $antreanModerasi,
            'statusFilter' => $statusFilter,
        ]);
    }

    /**
     * Menjalankan sanksi / tindakan moderasi konten.
     */
    public function tindak(TindakanModerasiRequest $request, LaporanPelanggaran $pelanggaran): RedirectResponse
    {
        $this->moderasiService->eksekusiModerasi(
            admin: $request->user(),
            pelanggaran: $pelanggaran,
            tindakan: $request->validated('tindakan'),
            catatan: $request->validated('catatan')
        );

        return back()->with('sukses', 'Tindakan moderasi berhasil diterapkan dan dicatat ke audit log.');
    }
}

<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instansi\AjukanSelesaiRequest;
use App\Http\Requests\Instansi\AlihkanTiketRequest;
use App\Http\Requests\Instansi\BeritaAcaraRequest;
use App\Http\Requests\Instansi\JadwalAnggaranRequest;
use App\Http\Requests\Instansi\KembalikanTiketRequest;
use App\Http\Requests\Instansi\ResponsSengketaRequest;
use App\Http\Requests\Instansi\RevisiTargetRequest;
use App\Http\Requests\Instansi\SurveiSelesaiRequest;
use App\Http\Requests\Instansi\TanggapanResmiRequest;
use App\Http\Requests\Instansi\TerimaTiketRequest;
use App\Http\Requests\Instansi\UsulanTolakRequest;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Services\InstansiTiketService;
use App\Services\VerifikasiWargaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AntreanInstansiController extends Controller
{
    public function __construct(
        protected InstansiTiketService $service,
        protected VerifikasiWargaService $verifikasiService,
    ) {}

    /**
     * Menampilkan antarmuka antrean tiket instansi (FR-TIK-02).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = $request->only(['status', 'q', 'kategori_id', 'per_page']);

        $antrean = $this->service->ambilAntreanInstansi($user, $filters);

        // Rekapitulasi tab filter
        $instansiId = $user->instansi_id;
        $ringkasan = [
            'semua' => Laporan::where('instansi_id', $instansiId)->count(),
            'perlu_respons' => Laporan::where('instansi_id', $instansiId)->where('status', 'DITERUSKAN')->count(),
            'survei_anggaran' => Laporan::where('instansi_id', $instansiId)->whereIn('status', ['DITERIMA', 'DISURVEI'])->count(),
            'pengerjaan' => Laporan::where('instansi_id', $instansiId)->whereIn('status', ['TERJADWAL_ANGGARAN', 'DIKERJAKAN'])->count(),
            'verifikasi' => Laporan::where('instansi_id', $instansiId)->where('status', 'MENUNGGU_VERIFIKASI')->count(),
            'sengketa' => Laporan::where('instansi_id', $instansiId)->whereIn('status', ['DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR'])->count(),
        ];

        // Format data tiket untuk tampilan frontend
        $transformedItems = $antrean->getCollection()->map(function ($lap) {
            $fotoAwal = $lap->lampiran->where('tahap', 'awal')->first();
            $beritaTerakhir = $lap->beritaAcara->sortByDesc('versi')->first();

            // Hitung sisa SLA dalam hari kerja / kalender
            $sisaHari = null;
            $persenSla = null;
            if ($lap->sla_jatuh_tempo && $lap->sla_mulai_pada) {
                $now = now()->startOfDay();
                $jatuhTempo = $lap->sla_jatuh_tempo->copy()->startOfDay();
                $sisaHari = (int) $now->diffInDays($jatuhTempo, false);

                $totalHari = max(1, $lap->sla_mulai_pada->startOfDay()->diffInDays($jatuhTempo));
                $terlewatHari = max(0, $lap->sla_mulai_pada->startOfDay()->diffInDays($now));
                $persenSla = max(0, min(100, round((($totalHari - $terlewatHari) / $totalHari) * 100)));
            }

            return [
                'id' => $lap->id,
                'nomor_tiket' => $lap->nomor_tiket,
                'judul' => $lap->judul,
                'keterangan' => $lap->keterangan,
                'keparahan' => $lap->keparahan,
                'status' => $lap->status,
                'kategori_nama' => $lap->kategori?->nama,
                'wilayah_nama' => $lap->kelurahan ? "Kel. {$lap->kelurahan->nama}, Kec. {$lap->kelurahan->induk?->nama}" : null,
                'kota_nama' => $lap->kelurahan?->induk?->induk?->nama,
                'lintang' => (float) $lap->lintang,
                'bujur' => (float) $lap->bujur,
                'foto_awal_url' => $fotoAwal ? asset('storage/'.$fotoAwal->path) : null,
                'jumlah_pengalihan' => $lap->jumlah_pengalihan,
                'jenis_pendanaan' => $lap->jenis_pendanaan,
                'tanggal_target' => $lap->tanggal_target ? $lap->tanggal_target->toDateString() : null,
                'tanggal_target_format' => $lap->tanggal_target ? $lap->tanggal_target->translatedFormat('d M Y') : null,
                'sla_tahap' => $lap->sla_tahap,
                'sla_jatuh_tempo' => $lap->sla_jatuh_tempo ? $lap->sla_jatuh_tempo->toDateString() : null,
                'sla_jatuh_tempo_format' => $lap->sla_jatuh_tempo ? $lap->sla_jatuh_tempo->translatedFormat('d M Y') : null,
                'sisa_hari_sla' => $sisaHari,
                'persen_sla' => $persenSla,
                'total_berita_acara' => $lap->beritaAcara->count(),
                'berita_acara_terakhir' => $beritaTerakhir ? [
                    'versi' => $beritaTerakhir->versi,
                    'kegiatan' => $beritaTerakhir->kegiatan,
                    'hasil' => $beritaTerakhir->hasil,
                    'hambatan' => $beritaTerakhir->hambatan,
                    'waktu' => $beritaTerakhir->created_at->diffForHumans(),
                ] : null,
                'semua_berita_acara' => $lap->beritaAcara->sortByDesc('versi')->values()->map(fn ($ba) => [
                    'versi' => $ba->versi,
                    'kegiatan' => $ba->kegiatan,
                    'hasil' => $ba->hasil,
                    'hambatan' => $ba->hambatan,
                    'waktu' => $ba->created_at->translatedFormat('d M Y, H:i'),
                ]),
                'riwayat_pengalihan' => $lap->pengalihan->map(fn ($p) => [
                    'asal' => $p->instansiAsal?->nama,
                    'tujuan' => $p->instansiTujuan?->nama,
                    'alasan' => $p->alasan,
                    'waktu' => $p->waktu->translatedFormat('d M Y, H:i'),
                ]),
                'created_at_human' => $lap->created_at->diffForHumans(),
                'created_at_format' => $lap->created_at->translatedFormat('d F Y, H:i'),
            ];
        });

        $antrean->setCollection($transformedItems);

        $kategoriList = Kategori::where('aktif', true)->orderBy('nama')->get(['id', 'nama']);

        // Instansi lain untuk modal pengalihan
        $instansiList = Instansi::where('aktif', true)
            ->where('id', '!=', $instansiId)
            ->orderBy('nama')
            ->get(['id', 'nama', 'singkatan']);

        return Inertia::render('instansi/antrean', [
            'antrean' => $antrean,
            'filters' => $filters,
            'ringkasan' => $ringkasan,
            'kategoriList' => $kategoriList,
            'instansiList' => $instansiList,
            'instansiSaya' => $user->instansi,
        ]);
    }

    /**
     * Aksi Menerima Tiket (FR-TIK-03).
     */
    public function terima(TerimaTiketRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->terimaTiket(
            $laporan,
            $request->user(),
            $request->validated('catatan')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Tiket {$updated->nomor_tiket} berhasil diterima untuk disurvei.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Tiket {$updated->nomor_tiket} berhasil diterima untuk disurvei.");
    }

    /**
     * Aksi Mengalihkan Tiket (FR-TIK-03).
     */
    public function alihkan(AlihkanTiketRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->alihkanTiket(
            $laporan,
            (int) $request->validated('instansi_tujuan_id'),
            $request->validated('alasan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Tiket {$updated->nomor_tiket} berhasil dialihkan ke instansi tujuan.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Tiket {$updated->nomor_tiket} berhasil dialihkan ke instansi tujuan.");
    }

    /**
     * Aksi Mengembalikan Tiket ke Admin (FR-TIK-03).
     */
    public function kembalikan(KembalikanTiketRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->kembalikanKeAdmin(
            $laporan,
            $request->validated('alasan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Tiket {$updated->nomor_tiket} telah dikembalikan ke antrean routing Admin.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Tiket {$updated->nomor_tiket} telah dikembalikan ke antrean routing Admin.");
    }

    /**
     * Aksi Menyelesaikan Survei Lapangan (FR-TIK-04).
     */
    public function selesaikanSurvei(SurveiSelesaiRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->selesaikanSurvei(
            $laporan,
            $request->validated('catatan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Survei untuk tiket {$updated->nomor_tiket} berhasil ditandai selesai.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Survei untuk tiket {$updated->nomor_tiket} berhasil ditandai selesai.");
    }

    /**
     * Aksi Menjadwalkan Anggaran & Janji Target (FR-TIK-05).
     */
    public function jadwalkanAnggaran(JadwalAnggaranRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->jadwalkanAnggaran(
            $laporan,
            $request->validated('jenis_pendanaan'),
            $request->validated('tanggal_target'),
            $request->user(),
            $request->validated('catatan')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Jadwal anggaran dan janji target publik tiket {$updated->nomor_tiket} berhasil ditetapkan.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Jadwal anggaran dan janji target publik tiket {$updated->nomor_tiket} berhasil ditetapkan.");
    }

    /**
     * Aksi Memulai Pengerjaan Fisik (FR-TIK-06).
     */
    public function mulaiPengerjaan(Request $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->mulaiPengerjaan(
            $laporan,
            $request->user(),
            $request->input('catatan')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Pengerjaan fisik lapangan untuk tiket {$updated->nomor_tiket} resmi dimulai.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Pengerjaan fisik lapangan untuk tiket {$updated->nomor_tiket} resmi dimulai.");
    }

    /**
     * Aksi Menerbitkan Berita Acara (FR-TIK-07).
     */
    public function simpanBeritaAcara(BeritaAcaraRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $beritaAcara = $this->service->simpanBeritaAcara(
            $laporan,
            $request->validated(),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Berita Acara versi {$beritaAcara->versi} berhasil dicatat.",
                'berita_acara' => $beritaAcara,
            ]);
        }

        return back()->with('sukses', "Berita Acara versi {$beritaAcara->versi} berhasil dicatat.");
    }

    /**
     * Aksi Mengajukan Selesai Fisik (FR-TIK-08).
     */
    public function ajukanSelesai(AjukanSelesaiRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->ajukanSelesai(
            $laporan,
            $request->validated('foto'),
            (float) $request->validated('lintang'),
            (float) $request->validated('bujur'),
            $request->filled('akurasi_gps_m') ? (float) $request->validated('akurasi_gps_m') : null,
            $request->user(),
            $request->validated('catatan')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Pekerjaan fisik tiket {$updated->nomor_tiket} berhasil diajukan selesai dan masuk ronde verifikasi warga.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Pekerjaan fisik tiket {$updated->nomor_tiket} berhasil diajukan selesai dan masuk ronde verifikasi warga.");
    }

    /**
     * Aksi Tanggapan Resmi Instansi (FR-TIK-09).
     */
    public function tanggapanResmi(TanggapanResmiRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $riwayat = $this->service->tanggapanResmi(
            $laporan,
            $request->validated('tanggapan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => 'Tanggapan resmi instansi berhasil disematkan pada tiket publik.',
                'riwayat' => $riwayat,
            ]);
        }

        return back()->with('sukses', 'Tanggapan resmi instansi berhasil disematkan pada tiket publik.');
    }

    /**
     * Aksi Usulkan Penolakan Tiket (FR-TIK-13).
     */
    public function usulkanTolak(UsulanTolakRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->usulkanTolak(
            $laporan,
            $request->validated('alasan_baku'),
            $request->validated('keterangan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Usulan penolakan untuk tiket {$updated->nomor_tiket} telah diteruskan ke meja Auditor.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Usulan penolakan untuk tiket {$updated->nomor_tiket} telah diteruskan ke meja Auditor.");
    }

    /**
     * Aksi Revisi Janji Target Penyelesaian (FR-TIK-14).
     */
    public function revisiTarget(RevisiTargetRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $updated = $this->service->revisiTanggalTarget(
            $laporan,
            $request->validated('tanggal_target_baru'),
            $request->validated('alasan'),
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => "Tanggal target publik tiket {$updated->nomor_tiket} berhasil diperbarui.",
                'laporan' => $updated,
            ]);
        }

        return back()->with('sukses', "Tanggal target publik tiket {$updated->nomor_tiket} berhasil diperbarui.");
    }

    /**
     * Aksi Respons Sengketa Warga (FR-VER-06).
     * Instansi memilih: 'kerjakan_ulang' atau 'sanggah'.
     */
    public function responsSengketa(ResponsSengketaRequest $request, Laporan $laporan): RedirectResponse|JsonResponse
    {
        $hasil = $this->verifikasiService->responsSengketaInstansi(
            $request->user(),
            $laporan,
            $request->validated('pilihan'),
            $request->validated('alasan_sanggah')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'sukses' => true,
                'pesan' => $hasil['pesan'],
                'status' => $hasil['status'],
            ]);
        }

        return back()->with('sukses', $hasil['pesan']);
    }
}

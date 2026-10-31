<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AturanRouting;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Wilayah;
use App\Services\KonfigurasiSistemService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KonfigurasiSistemController extends Controller
{
    public function __construct(
        protected KonfigurasiSistemService $konfigurasiService
    ) {}

    /**
     * Menampilkan dashboard utama konfigurasi sistem dengan 4 sub-tab (FR-ADM-01 s/d FR-ADM-03).
     */
    public function index(Request $request): Response
    {
        $data = $this->konfigurasiService->ambilSemuaKonfigurasi();

        return Inertia::render('admin/konfigurasi', [
            'pengaturan' => $data['pengaturan'],
            'masterInstansi' => $data['masterInstansi'],
            'masterKategori' => $data['masterKategori'],
            'masterWilayah' => $data['masterWilayah'],
            'aturanRouting' => $data['aturanRouting'],
            'aturanSla' => $data['aturanSla'],
            'parameterKuorum' => $data['parameterKuorum'],
        ]);
    }

    /**
     * Memperbarui satu nilai parameter sistem (P-01 s/d P-25).
     */
    public function updateParameter(Request $request, string $key): RedirectResponse
    {
        $validated = $request->validate([
            'nilai' => ['required', 'string'],
            'alasan' => ['nullable', 'string', 'max:500'],
        ]);

        $this->konfigurasiService->updateParameter(
            admin: $request->user(),
            key: $key,
            nilai: $validated['nilai'],
            alasan: $validated['alasan'] ?? null
        );

        return back()->with('sukses', "Parameter {$key} berhasil diperbarui.");
    }

    /**
     * Menambah master instansi baru.
     */
    public function storeInstansi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'singkatan' => ['required', 'string', 'max:50'],
            'wilayah_id' => ['required', 'integer', 'exists:wilayah,id'],
            'aktif' => ['boolean'],
        ]);

        $this->konfigurasiService->simpanInstansi($request->user(), $validated);

        return back()->with('sukses', 'Instansi baru berhasil ditambahkan.');
    }

    /**
     * Memperbarui master instansi yang sudah ada.
     */
    public function updateInstansi(Request $request, Instansi $instansi): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'singkatan' => ['required', 'string', 'max:50'],
            'wilayah_id' => ['required', 'integer', 'exists:wilayah,id'],
            'aktif' => ['boolean'],
        ]);

        $this->konfigurasiService->simpanInstansi($request->user(), $validated, $instansi->id);

        return back()->with('sukses', 'Data instansi berhasil diperbarui.');
    }

    /**
     * Menambah master kategori kerusakan baru.
     */
    public function storeKategori(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:240', 'unique:kategori,nama'],
            'radius_gabung_m' => ['required', 'integer', 'min:5', 'max:500'],
            'aktif' => ['boolean'],
        ]);

        $this->konfigurasiService->simpanKategori($request->user(), $validated);

        return back()->with('sukses', 'Kategori kerusakan baru berhasil ditambahkan.');
    }

    /**
     * Memperbarui master kategori kerusakan yang sudah ada.
     */
    public function updateKategori(Request $request, Kategori $kategori): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:240', 'unique:kategori,nama,'.$kategori->id],
            'radius_gabung_m' => ['required', 'integer', 'min:5', 'max:500'],
            'aktif' => ['boolean'],
        ]);

        $this->konfigurasiService->simpanKategori($request->user(), $validated, $kategori->id);

        return back()->with('sukses', 'Data kategori kerusakan berhasil diperbarui.');
    }

    /**
     * Menambah master wilayah administratif baru.
     */
    public function storeWilayah(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tingkat' => ['required', 'string', 'in:kota,kecamatan,kelurahan'],
            'nama' => ['required', 'string', 'max:120'],
            'kode_bps' => ['nullable', 'string', 'max:20'],
            'induk_id' => ['nullable', 'required_unless:tingkat,kota', 'integer', 'exists:wilayah,id'],
        ]);

        $this->konfigurasiService->simpanWilayah($request->user(), $validated);

        return back()->with('sukses', 'Wilayah administratif baru berhasil ditambahkan.');
    }

    /**
     * Memperbarui master wilayah administratif yang sudah ada.
     */
    public function updateWilayah(Request $request, Wilayah $wilayah): RedirectResponse
    {
        $validated = $request->validate([
            'tingkat' => ['required', 'string', 'in:kota,kecamatan,kelurahan'],
            'nama' => ['required', 'string', 'max:120'],
            'kode_bps' => ['nullable', 'string', 'max:20'],
            'induk_id' => ['nullable', 'required_unless:tingkat,kota', 'integer', 'exists:wilayah,id'],
        ]);

        $this->konfigurasiService->simpanWilayah($request->user(), $validated, $wilayah->id);

        return back()->with('sukses', 'Data wilayah administratif berhasil diperbarui.');
    }

    /**
     * Menambah atau memperbarui aturan routing disposisi otomatis.
     */
    public function storeRouting(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kategori_id' => ['required', 'integer', 'exists:kategori,id'],
            'wilayah_id' => ['required', 'integer', 'exists:wilayah,id'],
            'instansi_id' => ['required', 'integer', 'exists:instansi,id'],
            'prioritas' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $this->konfigurasiService->simpanRouting($request->user(), $validated);

        return back()->with('sukses', 'Aturan routing berhasil disimpan.');
    }

    /**
     * Memperbarui aturan routing disposisi yang sudah ada.
     */
    public function updateRouting(Request $request, AturanRouting $aturan): RedirectResponse
    {
        $validated = $request->validate([
            'kategori_id' => ['required', 'integer', 'exists:kategori,id'],
            'wilayah_id' => ['required', 'integer', 'exists:wilayah,id'],
            'instansi_id' => ['required', 'integer', 'exists:instansi,id'],
            'prioritas' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $this->konfigurasiService->simpanRouting($request->user(), $validated, $aturan->id);

        return back()->with('sukses', 'Aturan routing berhasil diperbarui.');
    }

    /**
     * Menghapus aturan routing.
     */
    public function destroyRouting(Request $request, AturanRouting $aturan): RedirectResponse
    {
        $this->konfigurasiService->hapusRouting($request->user(), $aturan);

        return back()->with('sukses', 'Aturan routing berhasil dihapus.');
    }

    /**
     * Menetapkan batas waktu standar SLA hari kerja per kategori.
     */
    public function storeSla(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kategori_id' => ['required', 'integer', 'exists:kategori,id'],
            'batas_respons_hk' => ['required', 'integer', 'min:1'],
            'batas_survei_hk' => ['required', 'integer', 'min:1'],
            'batas_anggaran_hk' => ['required', 'integer', 'min:1'],
            'batas_jawab_sengketa_hk' => ['required', 'integer', 'min:1'],
            'batas_verifikasi_hari' => ['required', 'integer', 'min:1'],
        ]);

        $this->konfigurasiService->simpanSla($request->user(), $validated);

        return back()->with('sukses', 'Standar SLA kategori berhasil diperbarui.');
    }

    /**
     * Menetapkan parameter kuorum warga per wilayah.
     */
    public function storeKuorum(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'wilayah_id' => ['required', 'integer', 'exists:wilayah,id'],
            'k_bp' => ['required', 'integer', 'min:0', 'max:10000'],
            'kmin' => ['required', 'numeric', 'min:0.1'],
            'kmax' => ['required', 'numeric', 'gte:kmin'],
        ]);

        $this->konfigurasiService->simpanKuorum($request->user(), $validated);

        return back()->with('sukses', 'Parameter kuorum wilayah berhasil diperbarui.');
    }
}

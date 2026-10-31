<?php

use App\Http\Controllers\Admin\AdminRoutingController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\IdentitasPelaporController;
use App\Http\Controllers\Admin\KonfigurasiSistemController;
use App\Http\Controllers\Admin\ModerasiKontenController;
use App\Http\Controllers\Admin\PetugasManagementController;
use App\Http\Controllers\Auth\GantiSandiPertamaController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PemulihanSandiController;
use App\Http\Controllers\Auth\PendaftaranWargaController;
use App\Http\Controllers\Instansi\AntreanInstansiController;
use App\Http\Controllers\Instansi\DashboardInstansiController;
use App\Http\Controllers\NotifikasiController;
use App\Http\Controllers\Peta\PetaLaporanController;
use App\Http\Controllers\Publik\BantuanPrivasiController;
use App\Http\Controllers\Publik\DashboardKinerjaController;
use App\Http\Controllers\Tiket\TiketInteraksiController;
use App\Http\Controllers\Tiket\TiketPublikController;
use App\Http\Controllers\Warga\LaporanWargaController;
use App\Http\Controllers\Warga\ProfilKelurahanController;
use App\Http\Controllers\Warga\VerifikasiWargaController;
use App\Http\Controllers\Wilayah\WilayahApiController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing Page Publik (Default Route)
Route::get('/', [PetaLaporanController::class, 'landingPage'])->name('home');

// Halaman Bantuan dan Kebijakan Privasi Publik (FR-LAN-01)
Route::get('/bantuan', [BantuanPrivasiController::class, 'index'])->name('bantuan');

// Dashboard Komparasi Kinerja Publik (FR-DSH-01)
Route::get('/dashboard', [DashboardKinerjaController::class, 'index'])->name('dashboard.kinerja');

// Autentikasi Pengguna (FR-AKN-02)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'tampilkanFormLogin'])->name('login');
    Route::post('/login', [LoginController::class, 'masuk'])->name('login.post');

    // Pemulihan Kata Sandi Warga (FR-AKN-03)
    Route::get('/lupa-sandi', [PemulihanSandiController::class, 'tampilkanFormLupaSandi'])->name('password.request');
    Route::post('/lupa-sandi', [PemulihanSandiController::class, 'kirimTautanPemulihan'])->name('password.email');
    Route::get('/reset-sandi/{token}', [PemulihanSandiController::class, 'tampilkanFormReset'])->name('password.reset');
    Route::post('/reset-sandi', [PemulihanSandiController::class, 'simpanSandiBaru'])->name('password.update');
});

Route::post('/logout', [LoginController::class, 'keluar'])->name('logout')->middleware('auth');

// Detail Tiket Publik & Interaksi Warga (FR-TKT-01, FR-INT-01 s.d. FR-INT-03)
Route::get('/tiket/{nomor_tiket}', [TiketPublikController::class, 'tampilkanDetail'])->name('tiket.detail');
Route::middleware(['auth', 'role:warga'])->group(function () {
    Route::post('/tiket/{nomor_tiket}/dukung', [TiketInteraksiController::class, 'toggleDukungan'])->name('tiket.dukung');
    Route::post('/tiket/{nomor_tiket}/lapor-konten', [TiketInteraksiController::class, 'laporkanKonten'])->name('tiket.lapor-konten');
});

// Investigasi Identitas Pelapor Khusus Admin & Auditor (FR-ADM-08)
Route::middleware(['auth', 'role:admin,auditor'])->group(function () {
    Route::post('/api/tiket/{nomor_tiket}/buka-identitas', [IdentitasPelaporController::class, 'buka'])->name('tiket.buka-identitas');
});

// Modul Profil, Kelurahan, Pelaporan & Peta Internal Warga (FR-AKN-04, FR-LAP-01 s.d. FR-LAP-05, FR-PET-01)
Route::middleware(['auth', 'role:warga'])->group(function () {
    Route::get('/peta', [PetaLaporanController::class, 'tampilkanPeta'])->name('warga.peta');
    Route::get('/warga/profil', [ProfilKelurahanController::class, 'tampilkanProfil'])->name('warga.profil');
    Route::post('/warga/kelurahan', [ProfilKelurahanController::class, 'gantiKelurahan'])->name('warga.kelurahan.update');
    Route::get('/warga/lapor', [LaporanWargaController::class, 'tampilkanFormLapor'])->name('warga.lapor');
    Route::post('/warga/lapor', [LaporanWargaController::class, 'buatLaporan'])->name('warga.lapor.store');
    Route::post('/warga/lapor/dukung', [LaporanWargaController::class, 'dukungLaporan'])->name('warga.lapor.dukung');
    Route::get('/warga/riwayat', [LaporanWargaController::class, 'tampilkanRiwayat'])->name('warga.riwayat');
    Route::get('/warga/verifikasi', [VerifikasiWargaController::class, 'index'])->name('warga.verifikasi');
    Route::get('/warga/verifikasi/{nomor_tiket}', [VerifikasiWargaController::class, 'show'])->name('warga.verifikasi.show');
    Route::post('/warga/verifikasi/{nomor_tiket}', [VerifikasiWargaController::class, 'store'])->name('warga.verifikasi.store');
});

// Modul Notifikasi Dalam Aplikasi (FR-NTF-01)
Route::middleware('auth')->group(function () {
    Route::get('/notifikasi', [NotifikasiController::class, 'index'])->name('notifikasi.index');
    Route::get('/api/notifikasi/ringkasan', [NotifikasiController::class, 'ringkasan'])->name('notifikasi.ringkasan');
    Route::patch('/api/notifikasi/{id}/baca', [NotifikasiController::class, 'baca'])->name('notifikasi.baca');
    Route::post('/api/notifikasi/baca-semua', [NotifikasiController::class, 'bacaSemua'])->name('notifikasi.baca-semua');
});

// Ganti Sandi Pertama Petugas (FR-AKN-05)
Route::middleware('auth')->group(function () {
    Route::get('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'tampilkanForm'])->name('auth.first-time-password');
    Route::post('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'simpanSandiBaru'])->name('auth.first-time-password.post');
});

// Panel Petugas Instansi (FR-TIK-02 s.d. FR-TIK-14)
Route::middleware(['auth', 'role:instansi'])->prefix('instansi')->name('instansi.')->group(function () {
    Route::get('/antrean', [AntreanInstansiController::class, 'index'])->name('antrean');
    Route::post('/tiket/{laporan}/terima', [AntreanInstansiController::class, 'terima'])->name('tiket.terima');
    Route::post('/tiket/{laporan}/alihkan', [AntreanInstansiController::class, 'alihkan'])->name('tiket.alihkan');
    Route::post('/tiket/{laporan}/kembalikan', [AntreanInstansiController::class, 'kembalikan'])->name('tiket.kembalikan');
    Route::post('/tiket/{laporan}/survei', [AntreanInstansiController::class, 'selesaikanSurvei'])->name('tiket.survei');
    Route::post('/tiket/{laporan}/anggaran', [AntreanInstansiController::class, 'jadwalkanAnggaran'])->name('tiket.anggaran');
    Route::post('/tiket/{laporan}/mulai', [AntreanInstansiController::class, 'mulaiPengerjaan'])->name('tiket.mulai');
    Route::post('/tiket/{laporan}/berita-acara', [AntreanInstansiController::class, 'simpanBeritaAcara'])->name('tiket.berita-acara');
    Route::post('/tiket/{laporan}/selesai', [AntreanInstansiController::class, 'ajukanSelesai'])->name('tiket.selesai');
    Route::post('/tiket/{laporan}/tanggapan', [AntreanInstansiController::class, 'tanggapanResmi'])->name('tiket.tanggapan');
    Route::post('/tiket/{laporan}/usul-tolak', [AntreanInstansiController::class, 'usulkanTolak'])->name('tiket.usul-tolak');
    Route::post('/tiket/{laporan}/revisi-target', [AntreanInstansiController::class, 'revisiTarget'])->name('tiket.revisi-target');
    Route::post('/tiket/{laporan}/respons-sengketa', [AntreanInstansiController::class, 'responsSengketa'])->name('tiket.respons-sengketa');

    Route::get('/sengketa', fn () => Inertia::render('instansi/sengketa'))->name('sengketa');
    Route::get('/dashboard', [DashboardInstansiController::class, 'index'])->name('dashboard');
    Route::get('/profil', fn () => Inertia::render('instansi/profil'))->name('profil');
});

// Panel Auditor Independen (FR-AUD-01 s.d. FR-AUD-03)
Route::middleware(['auth', 'role:auditor'])->group(function () {
    Route::get('/auditor/antrean', fn () => Inertia::render('auditor/antrean'))->name('auditor.antrean');
    Route::get('/auditor/pola-pengawasan', fn () => Inertia::render('auditor/pola-pengawasan'))->name('auditor.pola-pengawasan');
    Route::get('/auditor/audit-log', [AuditLogController::class, 'index'])->name('auditor.audit-log');
    Route::get('/auditor/profil', fn () => Inertia::render('auditor/profil'))->name('auditor.profil');
});

// Panel Administrator Sistem (FR-ADM-04, FR-ADM-05, FR-ADM-07)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/antrean-routing', [AdminRoutingController::class, 'index'])->name('admin.antrean-routing');
    Route::post('/admin/antrean-routing/{nomor_tiket}/disposisi', [AdminRoutingController::class, 'disposisi'])->name('admin.antrean-routing.disposisi');
    Route::get('/admin/moderasi', [ModerasiKontenController::class, 'index'])->name('admin.moderasi');
    Route::post('/admin/moderasi/{pelanggaran}/tindak', [ModerasiKontenController::class, 'tindak'])->name('admin.moderasi.tindak');
    Route::get('/admin/petugas', [PetugasManagementController::class, 'index'])->name('admin.petugas');
    Route::post('/admin/petugas', [PetugasManagementController::class, 'store'])->name('admin.petugas.store');
    Route::post('/admin/petugas/{user}/reset-sandi', [PetugasManagementController::class, 'resetSandi'])->name('admin.petugas.reset-sandi');
    Route::patch('/admin/petugas/{user}/toggle-status', [PetugasManagementController::class, 'toggleStatus'])->name('admin.petugas.toggle-status');
    Route::get('/admin/konfigurasi', [KonfigurasiSistemController::class, 'index'])->name('admin.konfigurasi');
    Route::put('/admin/konfigurasi/parameter/{key}', [KonfigurasiSistemController::class, 'updateParameter'])->name('admin.konfigurasi.parameter');
    Route::post('/admin/konfigurasi/instansi', [KonfigurasiSistemController::class, 'storeInstansi'])->name('admin.konfigurasi.instansi.store');
    Route::put('/admin/konfigurasi/instansi/{instansi}', [KonfigurasiSistemController::class, 'updateInstansi'])->name('admin.konfigurasi.instansi.update');
    Route::post('/admin/konfigurasi/kategori', [KonfigurasiSistemController::class, 'storeKategori'])->name('admin.konfigurasi.kategori.store');
    Route::put('/admin/konfigurasi/kategori/{kategori}', [KonfigurasiSistemController::class, 'updateKategori'])->name('admin.konfigurasi.kategori.update');
    Route::post('/admin/konfigurasi/wilayah', [KonfigurasiSistemController::class, 'storeWilayah'])->name('admin.konfigurasi.wilayah.store');
    Route::put('/admin/konfigurasi/wilayah/{wilayah}', [KonfigurasiSistemController::class, 'updateWilayah'])->name('admin.konfigurasi.wilayah.update');
    Route::post('/admin/konfigurasi/routing', [KonfigurasiSistemController::class, 'storeRouting'])->name('admin.konfigurasi.routing.store');
    Route::put('/admin/konfigurasi/routing/{aturan}', [KonfigurasiSistemController::class, 'updateRouting'])->name('admin.konfigurasi.routing.update');
    Route::delete('/admin/konfigurasi/routing/{aturan}', [KonfigurasiSistemController::class, 'destroyRouting'])->name('admin.konfigurasi.routing.destroy');
    Route::post('/admin/konfigurasi/sla', [KonfigurasiSistemController::class, 'storeSla'])->name('admin.konfigurasi.sla.store');
    Route::post('/admin/konfigurasi/kuorum', [KonfigurasiSistemController::class, 'storeKuorum'])->name('admin.konfigurasi.kuorum.store');
    Route::get('/admin/audit-log', [AuditLogController::class, 'index'])->name('admin.audit-log');
});

// Pendaftaran Warga (FR-AKN-01)
Route::prefix('daftar')->name('daftar.')->group(function () {
    Route::get('/', [PendaftaranWargaController::class, 'tampilkanFormEmail'])->name('index');
    Route::post('/kirim-verifikasi', [PendaftaranWargaController::class, 'kirimVerifikasiEmail'])->name('kirim-verifikasi');
    Route::get('/verifikasi/{token}', [PendaftaranWargaController::class, 'verifikasiTautan'])->name('verifikasi');
    Route::post('/selesai', [PendaftaranWargaController::class, 'selesaiPendaftaran'])->name('selesai');
});

// API Wilayah (Deteksi & Daftar Kelurahan)
Route::prefix('api/wilayah')->name('api.wilayah.')->group(function () {
    Route::post('/deteksi-kelurahan', [WilayahApiController::class, 'deteksiKelurahan'])->name('deteksi');
    Route::get('/kelurahan', [WilayahApiController::class, 'daftarKelurahan'])->name('index');
});

// API Laporan Warga
Route::middleware('auth')->prefix('api/laporan')->name('api.laporan.')->group(function () {
    Route::post('/cek-serupa', [LaporanWargaController::class, 'cekSerupa'])->name('cek-serupa');
});

// API Peta Publik (FR-PET-01 s.d. FR-PET-03)
Route::prefix('api/peta')->name('api.peta.')->group(function () {
    Route::get('/titik', [PetaLaporanController::class, 'ambilDataTitik'])->name('titik');
});

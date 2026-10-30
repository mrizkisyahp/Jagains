<?php

use App\Http\Controllers\Auth\GantiSandiPertamaController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PemulihanSandiController;
use App\Http\Controllers\Auth\PendaftaranWargaController;
use App\Http\Controllers\Warga\LaporanWargaController;
use App\Http\Controllers\Warga\ProfilKelurahanController;
use App\Http\Controllers\Wilayah\WilayahApiController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

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

// Modul Profil & Kelurahan Warga (FR-AKN-04 & Panel Warga)
Route::middleware(['auth', 'role:warga'])->group(function () {
    Route::get('/warga/profil', [ProfilKelurahanController::class, 'tampilkanProfil'])->name('warga.profil');
    Route::post('/warga/kelurahan', [ProfilKelurahanController::class, 'gantiKelurahan'])->name('warga.kelurahan.update');
    Route::get('/peta', fn () => Inertia::render('warga/peta'))->name('warga.peta');
    Route::get('/warga/lapor', fn () => Inertia::render('warga/lapor'))->name('warga.lapor');
    Route::get('/warga/riwayat', fn () => Inertia::render('warga/riwayat'))->name('warga.riwayat');
    Route::get('/warga/verifikasi', fn () => Inertia::render('warga/verifikasi'))->name('warga.verifikasi');
});

// Ganti Sandi Pertama Petugas (FR-AKN-05)
Route::middleware('auth')->group(function () {
    Route::get('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'tampilkanForm'])->name('auth.first-time-password');
    Route::post('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'simpanSandiBaru'])->name('auth.first-time-password.post');
});

// Panel Petugas Instansi (FR-TIK-02 s.d. FR-TIK-08)
Route::middleware(['auth', 'role:instansi'])->group(function () {
    Route::get('/instansi/antrean', fn () => Inertia::render('instansi/antrean'))->name('instansi.antrean');
    Route::get('/instansi/sengketa', fn () => Inertia::render('instansi/sengketa'))->name('instansi.sengketa');
    Route::get('/instansi/dashboard', fn () => Inertia::render('instansi/dashboard'))->name('instansi.dashboard');
    Route::get('/instansi/profil', fn () => Inertia::render('instansi/profil'))->name('instansi.profil');
});

// Panel Auditor Independen (FR-AUD-01 s.d. FR-AUD-03)
Route::middleware(['auth', 'role:auditor'])->group(function () {
    Route::get('/auditor/antrean', fn () => Inertia::render('auditor/antrean'))->name('auditor.antrean');
    Route::get('/auditor/pola-pengawasan', fn () => Inertia::render('auditor/pola-pengawasan'))->name('auditor.pola-pengawasan');
    Route::get('/auditor/audit-log', fn () => Inertia::render('auditor/audit-log'))->name('auditor.audit-log');
    Route::get('/auditor/profil', fn () => Inertia::render('auditor/profil'))->name('auditor.profil');
});

// Panel Administrator Sistem (FR-ADM-04, FR-ADM-05, FR-ADM-07)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/antrean-routing', fn () => Inertia::render('admin/antrean-routing'))->name('admin.antrean-routing');
    Route::get('/admin/moderasi', fn () => Inertia::render('admin/moderasi'))->name('admin.moderasi');
    Route::get('/admin/petugas', fn () => Inertia::render('admin/petugas'))->name('admin.petugas');
    Route::get('/admin/konfigurasi', fn () => Inertia::render('admin/konfigurasi'))->name('admin.konfigurasi');
    Route::get('/admin/audit-log', fn () => Inertia::render('admin/audit-log'))->name('admin.audit-log');
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

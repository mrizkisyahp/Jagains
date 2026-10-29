<?php

use App\Http\Controllers\Auth\GantiSandiPertamaController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PemulihanSandiController;
use App\Http\Controllers\Auth\PendaftaranWargaController;
use App\Http\Controllers\Warga\ProfilKelurahanController;
use App\Http\Controllers\Wilayah\WilayahApiController;
use Illuminate\Support\Facades\Route;

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

// Modul Profil & Kelurahan Warga (FR-AKN-04)
Route::middleware(['auth', 'role:warga'])->group(function () {
    Route::get('/warga/profil', [ProfilKelurahanController::class, 'tampilkanProfil'])->name('warga.profil');
    Route::post('/warga/kelurahan', [ProfilKelurahanController::class, 'gantiKelurahan'])->name('warga.kelurahan.update');
});

// Ganti Sandi Pertama Petugas (FR-AKN-05)
Route::middleware('auth')->group(function () {
    Route::get('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'tampilkanForm'])->name('auth.first-time-password');
    Route::post('/ganti-sandi-pertama', [GantiSandiPertamaController::class, 'simpanSandiBaru'])->name('auth.first-time-password.post');
});

// Rute Terproteksi Peran (Uji Otorisasi Server ST-09)
Route::middleware(['auth', 'role:auditor'])->group(function () {
    Route::get('/auditor/antrean', fn () => response()->json(['status' => 'auditor_antrean_ok']))->name('auditor.antrean');
});

Route::middleware(['auth', 'role:instansi'])->group(function () {
    Route::get('/instansi/antrean', fn () => response()->json(['status' => 'instansi_antrean_ok']))->name('instansi.antrean');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/antrean-routing', fn () => response()->json(['status' => 'admin_routing_ok']))->name('admin.antrean-routing');
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

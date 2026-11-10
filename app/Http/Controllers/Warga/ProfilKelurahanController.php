<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Http\Requests\Warga\GantiKelurahanRequest;
use App\Http\Requests\Warga\GantiPasswordWargaRequest;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfilKelurahanController extends Controller
{
    /**
     * Menampilkan halaman profil akun warga beserta informasi kelurahan domisili.
     */
    public function tampilkanProfil(Request $request): Response
    {
        $user = $request->user()->load('kelurahan.induk');

        $diubahPada = $user->kelurahan_diubah_pada;
        $bisaGanti = true;
        $sisaHari = 0;
        $tanggalTercepat = null;

        if ($diubahPada) {
            $selisihHari = $diubahPada->diffInDays(now());
            if ($selisihHari < 90) {
                $bisaGanti = false;
                $sisaHari = 90 - (int) $selisihHari;
                $tanggalTercepat = $diubahPada->addDays(90)->format('d F Y');
            }
        }

        return Inertia::render('warga/profile', [
            'profil' => [
                'username' => $user->username,
                'status_akun' => $user->status_akun,
                'poin_peringatan' => $user->poin_peringatan,
                'kelurahan_saat_ini' => [
                    'id' => $user->kelurahan?->id,
                    'nama' => $user->kelurahan?->nama,
                    'kecamatan' => $user->kelurahan?->induk?->nama,
                ],
                'kelurahan_diubah_pada' => $diubahPada?->format('d F Y H:i'),
                'bisa_ganti_kelurahan' => $bisaGanti,
                'sisa_hari_kunci' => $sisaHari,
                'tanggal_tercepat_boleh_ganti' => $tanggalTercepat,
            ],
        ]);
    }

    /**
     * Memproses pergantian kelurahan domisili dengan mematuhi aturan jeda 90 hari (FR-AKN-04).
     */
    public function gantiKelurahan(GantiKelurahanRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->update([
            'kelurahan_id' => $request->input('kelurahan_id'),
            'kelurahan_diubah_pada' => now(),
        ]);

        return back()->with('success', 'Kelurahan domisili Anda berhasil dipindahkan. Perubahan ini tercatat untuk periode 90 hari ke depan.');
    }

    /**
     * Memproses penggantian kata sandi akun warga.
     */
    public function gantiPassword(GantiPasswordWargaRequest $request): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $request) {
            $user->update([
                'password' => Hash::make($request->input('password')),
            ]);

            AuditLog::create([
                'pelaku_id' => $user->id,
                'aksi' => 'GANTI_KATA_SANDI',
                'objek_tipe' => 'User',
                'objek_id' => $user->id,
                'alasan' => 'Penggantian kata sandi mandiri oleh warga.',
                'waktu' => now(),
            ]);
        });

        return back()->with('success', 'Kata sandi akun Anda berhasil diperbarui.');
    }
}

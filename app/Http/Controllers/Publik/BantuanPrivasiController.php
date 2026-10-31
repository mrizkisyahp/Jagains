<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BantuanPrivasiController extends Controller
{
    /**
     * Menampilkan halaman bantuan publik dan transparansi kebijakan privasi Zero-Knowledge (FR-LAN-01).
     */
    public function index(): Response
    {
        return Inertia::render('bantuan', [
            'transparansiData' => [
                'disimpan' => [
                    'Hash email dengan algoritma HMAC-SHA256 (kunci rahasia diisolasi di luar basis data)',
                    'Nama pengguna unik (username) pilihan warga untuk autentikasi',
                    'Kata sandi yang telah di-hash menggunakan algoritma lambat (Argon2id/Bcrypt)',
                    'Kelurahan domisili yang dipilih warga (untuk verifikasi kuorum wilayah)',
                    'Foto kerusakan fasilitas publik (metadata EXIF dan GPS foto langsung dihapus)',
                    'Koordinat lokasi fasilitas publik yang dilaporkan (bukan koordinat rumah pelapor)',
                    'Riwayat status penanganan, disposisi dinas, dan catatan berita acara resmi',
                ],
                'tidakDisimpan' => [
                    'Alamat email asli / teks polos (tidak pernah disimpan di basis data aplikasi)',
                    'Nomor Induk Kependudukan (NIK) atau data Kartu Keluarga (KK)',
                    'Nomor telepon, WhatsApp, atau kontak pribadi warga',
                    'Alamat rumah atau titik koordinat tempat tinggal pelapor',
                    'Rekam jejak GPS perangkat pelapor (koordinat dibaca sekali di memori saat pendaftaran lalu dimusnahkan)',
                    'Identitas akun pemberi suara pada hasil perhitungan kuorum verifikasi publik',
                ],
                'batasDiakui' => [
                    'Kehilangan akses ke alamat email terdaftar berarti kehilangan akun secara permanen (karena sistem tidak menyimpan email asli untuk verifikasi manual oleh petugas).',
                    'Satu orang secara teknis dapat memiliki lebih dari satu alamat email, namun normalisasi ketat menolak alias plus (+) dan titik pada penyedia email populer.',
                    'Kelurahan domisili dipilih sendiri oleh warga saat registrasi; perubahan kelurahan dibatasi dengan jeda minimal 90 hari kalender.',
                    'Koordinat perangkat hanya dibaca sekali saat rekomendasi kelurahan dan langsung dibuang dari memori server.',
                    'Data akun pelapor suatu tiket hanya dapat disingkap oleh Administrator dan Auditor Ombudsman dalam kondisi investigasi hukum khusus (FR-ADM-08), dengan kewajiban mengisi alasan tertulis yang dicatat permanen dalam Audit Log tak dapat dihapus.',
                ],
            ],
        ]);
    }
}

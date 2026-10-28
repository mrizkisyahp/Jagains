<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('verifikasi_warga', function (Blueprint $table) {
            $table->id();
            // Ronde verifikasi yang sedang berjalan
            $table->foreignId('ronde_id')->constrained('ronde_verifikasi')->restrictOnDelete();
            // Akun warga yang memberi suara (dirahasiakan dari publik)
            $table->foreignId('pengguna_id')->constrained('users')->restrictOnDelete();
            // Pilihan suara: true = "Sudah Sesuai", false = "Belum Sesuai"
            $table->boolean('setuju');
            // Jalur pembuktian: 'A' (hadir di lokasi dengan foto kamera & GPS cocok) atau 'B' (tanpa foto)
            $table->char('jalur', 1);
            // Nilai bobot suara (1.0 untuk Jalur A, 0.5 untuk Jalur B)
            $table->decimal('bobot', 3, 1);
            // Foto bukti kamera warga jika memilih Jalur A (merujuk ke tabel lampiran)
            $table->foreignId('lampiran_id')->nullable()->unique()->constrained('lampiran')->restrictOnDelete();
            // Alasan penolakan jika memilih belum sesuai (wajib diisi, tampil publik)
            $table->text('alasan')->nullable();
            // Waktu suara diberikan
            $table->timestampTz('waktu')->useCurrent();
        });

        // jalur hanya boleh 'A' atau 'B', dan bobot harus lebih dari 0
        DB::statement("ALTER TABLE verifikasi_warga ADD CONSTRAINT vw_jalur_ck CHECK (
            jalur IN ('A', 'B') AND 
            bobot > 0
        )");

        // jika Jalur A maka lampiran_id WAJIB ada, jika Jalur B WAJIB null
        DB::statement("ALTER TABLE verifikasi_warga ADD CONSTRAINT vw_foto_ck CHECK (
            (jalur = 'A') = (lampiran_id IS NOT NULL)
        )");

        // jika menolak (setuju = false), alasan WAJIB diisi dan bukan teks kosong
        DB::statement("ALTER TABLE verifikasi_warga ADD CONSTRAINT vw_alasan_ck CHECK (
            setuju OR (alasan IS NOT NULL AND btrim(alasan) <> '')
        )");

        // Mencegah satu akun memberi suara lebih dari satu kali dalam ronde yang sama (BR-VER-07)
        DB::statement('CREATE UNIQUE INDEX vw_ronde_pengguna_uq ON verifikasi_warga (ronde_id, pengguna_id)');

        // Index untuk penghitungan kilat akumulasi kuorum (tally) setelah setiap suara masuk
        DB::statement('CREATE INDEX vw_tally_idx ON verifikasi_warga (ronde_id, setuju, jalur)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verifikasi_warga');
    }
};

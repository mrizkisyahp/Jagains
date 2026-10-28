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
        Schema::create('ronde_verifikasi', function (Blueprint $table) {
            $table->id();
            // Tiket laporan yang diverifikasi
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete();
            // Nomor ronde per tiket (ronde 1, ronde 2 jika pernah disengketakan/dikerjakan ulang)
            $table->unsignedSmallInteger('nomor');
            // Snapshot target kuorum K yang dihitung saat ronde dibuka
            $table->decimal('k', 4, 1);
            // Snapshot parameter kuorum: {n, k_bp, kmin, kmax, bobot_a, bobot_b, jendela_hari, wilayah_sumber_id}
            $table->jsonb('k_param');
            // Foto bukti perbaikan fisik yang membuka ronde ini (merujuk ke lampiran)
            $table->foreignId('lampiran_sesudah_id')->unique()->constrained('lampiran')->restrictOnDelete();
            // Waktu ronde dibuka
            $table->timestampTz('mulai');
            // Batas waktu ronde berakhir (mulai + 14 hari kalender)
            $table->timestampTz('batas_waktu');
            // Hasil akhir ronde: null (sedang berjalan), 'setuju' (lolos warga), 'tolak' (sengketa), 'kedaluwarsa' (14 hari habis tanpa kuorum)
            $table->string('hasil', 12)->nullable();
            // Waktu ronde selesai diputuskan
            $table->timestampTz('selesai_pada')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            // Nomor ronde unik per laporan
            $table->unique(['laporan_id', 'nomor'], 'ronde_laporan_nomor_uq');
        });

        // hasil ronde hanya boleh 3 nilai
        DB::statement("ALTER TABLE ronde_verifikasi ADD CONSTRAINT ronde_hasil_ck CHECK (
            hasil IS NULL OR hasil IN ('setuju', 'tolak', 'kedaluwarsa')
        )");

        // selesai_pada wajib ada jika hasil sudah terisi, batas waktu harus setelah waktu mulai, K > 0
        DB::statement('ALTER TABLE ronde_verifikasi ADD CONSTRAINT ronde_selesai_ck CHECK (
            (hasil IS NULL) = (selesai_pada IS NULL) AND 
            batas_waktu > mulai AND 
            k > 0
        )');

        // Menjamin HANYA ADA 1 RONDE TERBUKA dalam satu waktu untuk satu laporan (BR-VER-01)
        DB::statement('CREATE UNIQUE INDEX ronde_satu_terbuka_uq ON ronde_verifikasi (laporan_id) WHERE hasil IS NULL');

        // Index untuk pengecekan otomatis ronde yang sudah melewati 14 hari kalender
        DB::statement('CREATE INDEX ronde_kedaluwarsa_idx ON ronde_verifikasi (batas_waktu) WHERE hasil IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ronde_verifikasi');
    }
};

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
        Schema::create('lampiran', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // identifier publik unik untuk mengakses foto (UUID)

            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete(); // laporan terkait

            $table->foreignId('pengguna_id')->constrained('users')->restrictOnDelete(); // pengunggah foto
            $table->string('tahap', 10); // tahap foto diambil 'awal' (laporan warga), 'sesudah' (perbaikan dinas), 'verifikasi' (suara warga jalur A)
            $table->string('path', 255); // path penyimpanan berkas
            $table->unsignedInteger('ukuran_byte'); // ukuran berkas dalam satuan byte
            $table->unsignedSmallInteger('lebar'); // dimensi foto lebar dalam piksel
            $table->unsignedSmallInteger('tinggi'); // dimensi foto tinggi dalam piksel
            $table->boolean('gps_cocok')->nullable(); // status kecocokan gps dengan titik kerusakan (true jika <= 50 meter)
            $table->decimal('jarak_m', 8, 1)->nullable(); // jarak perangkat saat memotret ke titik kerusakan laporan (dalam meter)
            $table->decimal('akurasi_m', 7, 1)->nullable(); // akurasi gps perangkat saat mengambil foto
            $table->timestampTz('created_at')->useCurrent(); // waktu foto unggah
        });

        // tahap hanya boleh 'awal', 'sesudah', atau 'verifikasi'
        DB::statement("ALTER TABLE lampiran ADD CONSTRAINT lampiran_tahap_ck CHECK (tahap IN ('awal', 'sesudah', 'verifikasi'))");

        // untuk foto sesudah & verifikasi, kecocokan GPS wajib bernilai true dan jarak/akurasi wajib tercatat
        DB::statement("ALTER TABLE lampiran ADD CONSTRAINT lampiran_gps_ck CHECK (
            tahap = 'awal' OR (gps_cocok IS TRUE AND jarak_m IS NOT NULL AND akurasi_m IS NOT NULL)
        )");

        // Satu laporan hanya boleh memiliki tepat satu foto bukti awal
        DB::statement("CREATE UNIQUE INDEX lampiran_awal_uq ON lampiran (laporan_id) WHERE tahap = 'awal'");

        // Index untuk pencarian foto berdasarkan tiket dan tahapannya
        DB::statement('CREATE INDEX lampiran_laporan_tahap_idx ON lampiran (laporan_id, tahap)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lampiran');
    }
};

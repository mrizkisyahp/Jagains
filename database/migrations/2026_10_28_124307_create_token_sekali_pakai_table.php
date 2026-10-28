<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('token_sekali_pakai', function (Blueprint $table) {
            $table->id();
            // Jenis penggunaan token: 'daftar' (verifikasi email warga baru) atau 'pemulihan' (reset kata sandi)
            $table->string('jenis', 10);
            // Hash SHA-256 dari token acak sekali pakai (unik, bukan turunan dari email)
            $table->char('penanda_hash', 64)->unique();
            // Akun pengguna terkait (khusus untuk jenis 'pemulihan', null untuk pendaftaran baru)
            $table->foreignId('pengguna_id')->nullable()->constrained('users')->restrictOnDelete();
            // Waktu token kedaluwarsa (berlaku 30 menit sejak dibuat)
            $table->timestampTz('kedaluwarsa');
            // Waktu token berhasil dikonsumsi/digunakan (null jika belum dipakai)
            $table->timestampTz('dipakai_pada')->nullable();
            // Waktu pembuatan token
            $table->timestampTz('created_at')->useCurrent();
        });

        // jenis hanya 'daftar' atau 'pemulihan', dan pengguna_id wajib ada jika jenis pemulihan
        DB::statement("ALTER TABLE token_sekali_pakai ADD CONSTRAINT token_jenis_ck CHECK (
            jenis IN ('daftar', 'pemulihan') AND 
            (jenis = 'pemulihan') = (pengguna_id IS NOT NULL)
        )");

        // // Index untuk pembersihan otomatis token-token yang sudah kedaluwarsa (purge job)
        DB::statement('CREATE INDEX token_kedaluwarsa_idx ON token_sekali_pakai (kedaluwarsa)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('token_sekali_pakai');
    }
};

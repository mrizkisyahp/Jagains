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
        Schema::create('dukungan', function (Blueprint $table) {
            $table->id();
            // Tiket laporan yang didukung
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete();
            // Akun warga yang memberikan dukungan (dirahasiakan dari publik)
            $table->foreignId('pengguna_id')->constrained('users')->restrictOnDelete();
            // Waktu dukungan diberikan
            $table->timestampTz('created_at')->useCurrent();
            // Mencegah dukungan ganda: satu akun hanya boleh mendukung satu kali per tiket
            $table->unique(['laporan_id', 'pengguna_id'], 'dukungan_laporan_pengguna_uq');
            // Index untuk melihat riwayat dukungan per pengguna
            $table->index('pengguna_id', 'dukungan_pengguna_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dukungan');
    }
};

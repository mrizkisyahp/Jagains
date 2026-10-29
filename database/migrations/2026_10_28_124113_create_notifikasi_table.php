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
        Schema::create('notifikasi', function (Blueprint $table) {
            $table->id();
            // Pengguna penerima notifikasi (warga, petugas, auditor, atau admin)
            $table->foreignId('pengguna_id')->constrained('users')->restrictOnDelete();
            // Tiket laporan terkait peristiwa ini (opsional)
            $table->foreignId('laporan_id')->nullable()->constrained('laporan')->restrictOnDelete();
            // Tipe/kategori peristiwa notifikasi (BR-NTF-01a s/d h)
            $table->string('tipe', 30);
            // Isi ringkas pesan notifikasi
            $table->string('pesan', 500);
            // Kunci unik deduplikasi agar tugas otomatis tidak mengirim notifikasi berulang (idempoten)
            $table->string('kunci_dedup', 120)->nullable();
            // Waktu notifikasi dibaca pengguna (null jika belum dibaca)
            $table->timestampTz('dibaca_pada')->nullable();
            // Waktu notifikasi dikirimkan
            $table->timestampTz('created_at')->useCurrent();
        });

        // Mencegah notifikasi duplikat jika kunci deduplikasi diisi
        DB::statement('CREATE UNIQUE INDEX notifikasi_dedup_uq ON notifikasi (pengguna_id, kunci_dedup) WHERE kunci_dedup IS NOT NULL');

        // Index untuk menampilkan daftar riwayat notifikasi terbaru pengguna
        DB::statement('CREATE INDEX notifikasi_pengguna_created_idx ON notifikasi (pengguna_id, created_at DESC)');

        // Index untuk penghitungan kilat lencana jumlah notifikasi belum dibaca (badge count)
        DB::statement('CREATE INDEX notifikasi_belum_dibaca_idx ON notifikasi (pengguna_id) WHERE dibaca_pada IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifikasi');
    }
};

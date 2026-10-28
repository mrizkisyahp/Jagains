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
        Schema::create('pengalihan', function (Blueprint $table) {
            $table->id();
            // Tiket laporan yang dialihkan
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete();
            // Instansi yang mengalihkan (instansi asal)
            $table->foreignId('instansi_asal_id')->constrained('instansi')->restrictOnDelete();
            // Instansi tujuan pengalihan
            $table->foreignId('instansi_tujuan_id')->constrained('instansi')->restrictOnDelete();
            // Alasan wajib pengalihan wewenang (tampil publik)
            $table->text('alasan');
            // Petugas instansi asal yang melakukan pengalihan
            $table->foreignId('pelaku_id')->constrained('users')->restrictOnDelete();
            // Waktu pengalihan dilakukan
            $table->timestampTz('waktu')->useCurrent();
            // Mencegah tiket dialihkan ulang ke instansi yang pernah menanganinya (BR-STS-07)
            $table->unique(['laporan_id', 'instansi_tujuan_id'], 'pengalihan_laporan_tujuan_uq');
            // Index pencarian riwayat pengalihan per tiket secara kronologis
            $table->index(['laporan_id', 'waktu'], 'pengalihan_laporan_waktu_idx');
        });

        // instansi asal dan tujuan tidak boleh sama, dan alasan tidak boleh teks/spasi kosong
        DB::statement("ALTER TABLE pengalihan ADD CONSTRAINT pengalihan_valid_ck CHECK (
            instansi_asal_id <> instansi_tujuan_id AND 
            btrim(alasan) <> ''
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengalihan');
    }
};

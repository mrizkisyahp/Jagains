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
        Schema::create('berita_acara', function (Blueprint $table) {
            $table->id();
            // Tiket laporan yang dikerjakan
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete();
            // Instansi yang menyusun berita acara
            $table->foreignId('instansi_id')->constrained('instansi')->restrictOnDelete();
            // Petugas instansi yang menulis berita acara
            $table->foreignId('penulis_id')->constrained('users')->restrictOnDelete();
            // Nomor versi berita acara pada siklus tiket ini (1, 2, dst)
            $table->unsignedInteger('versi');
            // Uraian kegiatan penanganan yang dilakukan
            $table->text('kegiatan');
            // Hasil capaian fisik pekerjaan
            $table->text('hasil');
            // Kendala atau hambatan di lapangan jika ada (opsional)
            $table->text('hambatan')->nullable();
            // Waktu pencatatan berita acara
            $table->timestampTz('created_at')->useCurrent();
            // Nomor versi harus unik per tiket laporan
            $table->unique(['laporan_id', 'versi'], 'berita_acara_laporan_versi_uq');
            // Index riwayat versi berita acara per tiket
            $table->index(['laporan_id', 'versi'], 'berita_acara_laporan_versi_idx');
        });

        // uraian kegiatan dan hasil tidak boleh teks/spasi kosong
        DB::statement("ALTER TABLE berita_acara ADD CONSTRAINT berita_acara_isi_ck CHECK (
            btrim(kegiatan) <> '' AND 
            btrim(hasil) <> ''
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('berita_acara');
    }
};

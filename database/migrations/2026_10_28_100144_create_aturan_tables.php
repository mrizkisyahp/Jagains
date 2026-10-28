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
        Schema::create('aturan_routing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kategori_id')->constrained('kategori')->restrictOnDelete(); // kategori kerusakan yang dicakup
            $table->foreignId('wilayah_id')->constrained('wilayah')->restrictOnDelete(); // wilayah cakupan (kota, kecamatan/kelurahan)
            $table->foreignId('instansi_id')->constrained('instansi')->restrictOnDelete(); // instansi tujuan yang berwenang menangani
            $table->smallInteger('prioritas')->default(100); // prioritas aturan jika spesifikasinya sama (angka kecil = prio tinggi)
            $table->timestampsTz();

            $table->unique(['kategori_id', 'wilayah_id', 'instansi_id'], 'aturan_routing_kwi_uq'); // Mencegah aturan kembar untuk kategori, wilayah, dan instansi yang sama
            $table->index(['kategori_id', 'wilayah_id'], 'aturan_routing_kat_wil_idx');
        });

        Schema::create('aturan_sla', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kategori_id')->unique()->constrained('kategori')->restrictOnDelete(); // satu aturan sla untuk satu kategori kerusakan
            $table->smallInteger('batas_respons_hk')->default(3); // batas respon awal instansi (dalam hari kerja, default: 3)
            $table->smallInteger('batas_survei_hk')->default(5); // batas survei lapangan (dalam hari kerja, default 5 hk)
            $table->smallInteger('batas_anggaran_hk')->default(10); // batas penjadwalan anggaran (dalam hari kerja, default 10 hk)
            $table->smallInteger('batas_jawab_sengketa_hk')->default(7); // batas instansi menjawab sengketa warga (dalam hari kerja, default 7)
            $table->smallInteger('batas_verifikasi_hari')->default(14); // batas jendela waktu warga verifikasi per ronde
            $table->timestampsTz();
        });

        // Validasi database: semua batas waktu SLA harus berupa angka positif (> 0)
        DB::statement('ALTER TABLE aturan_sla ADD CONSTRAINT aturan_sla_positif_ck CHECK (
        batas_respons_hk > 0 AND
        batas_survei_hk > 0 AND
        batas_anggaran_hk > 0 AND
        batas_jawab_sengketa_hk > 0 AND
        batas_verifikasi_hari > 0)');

        Schema::create('parameter_kuorum', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wilayah_id')->unique()->constrained('wilayah')->restrictOnDelete(); // parameter kuorum dapat diatur per wilayah (kota, kecamatan atau kelurahan)
            $table->smallInteger('k_bp')->default(200); // persentasi pemilih dalam basis point (200 bp = 2%) untuk rumus k * N
            $table->decimal('kmin', 4, 1)->default(2.0); // batas bawah minimum kuorum K (default: 2.0 suara)
            $table->decimal('kmax', 4, 1)->default(5.0); // batas atas maksimum kuorum K (default: 5.0 suara)
            $table->timestampsTz();
        });

        // Validasi database: k_bp antara 0-100%, kmin positif, dan kmax >= kmin

        DB::statement('ALTER TABLE parameter_kuorum ADD CONSTRAINT parameter_kuorum_ck CHECK (
        k_bp BETWEEN 0 AND 10000 AND
        kmin > 0 AND
        kmax >= kmin)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameter_kuorum');
        Schema::dropIfExists('aturan_sla');
        Schema::dropIfExists('aturan_routing');
    }
};

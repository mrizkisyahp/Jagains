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
        Schema::create('riwayat_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete(); // laporan yang statusnya berubah
            $table->string('kode_transisi', 4); // kode transisi (T-01 s/d T-20)
            $table->string('status_lama', 30)->nullable(); // status sebelum transisi
            $table->string('status_baru', 30); // status setelah transisi
            $table->foreignId('pelaku_id')->nullable()->constrained('users')->restrictOnDelete(); // pengguna yg melakukan perubahan

            $table->foreignId('instansi_id')->nullable()->constrained('instansi')->restrictOnDelete(); // instansi pemilik tanggung jawab tiket
            $table->text('catatan')->nullable(); // catatan / alasan terkait perubahan status
            $table->timestampTz('waktu')->useCurrent();
        });

        // format kode transisi harus tepat T-01 s/d T-20
        DB::statement("ALTER TABLE riwayat_status ADD CONSTRAINT riwayat_kode_ck CHECK (kode_transisi ~ '^T-(0[1-9]|1[0-9]|20)$')");

        // nilai status_baru dan status_lama harus masuk dalam 13 status resmi
        DB::statement("ALTER TABLE riwayat_status ADD CONSTRAINT riwayat_status_ck CHECK (
            status_baru IN (
                'DITERUSKAN','PERLU_ROUTING','USULAN_TOLAK','DITOLAK','DITERIMA','DISURVEI',
                'TERJADWAL_ANGGARAN','DIKERJAKAN','MENUNGGU_VERIFIKASI','DISENGKETAKAN',
                'MENUNGGU_KEPUTUSAN_AUDITOR','TERTUTUP_WARGA','TERTUTUP_AUDITOR'
            ) AND (
                status_lama IS NULL OR status_lama IN (
                    'DITERUSKAN','PERLU_ROUTING','USULAN_TOLAK','DITOLAK','DITERIMA','DISURVEI',
                    'TERJADWAL_ANGGARAN','DIKERJAKAN','MENUNGGU_VERIFIKASI','DISENGKETAKAN',
                    'MENUNGGU_KEPUTUSAN_AUDITOR','TERTUTUP_WARGA','TERTUTUP_AUDITOR'
                )
            )
        )");

        // Index untuk menyusun timeline riwayat status tiket secara kronologis
        DB::statement('CREATE INDEX riwayat_laporan_idx ON riwayat_status (laporan_id, waktu, id)');

        // Index untuk agregasi indikator dashboard per kode transisi
        DB::statement('CREATE INDEX riwayat_kode_idx ON riwayat_status (kode_transisi, waktu)');

        // Index pencarian transisi spesifik pada tiket tertentu
        DB::statement('CREATE INDEX riwayat_laporan_kode_idx ON riwayat_status (laporan_id, kode_transisi)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_status');
    }
};

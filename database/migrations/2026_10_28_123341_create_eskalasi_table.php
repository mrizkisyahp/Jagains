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
        Schema::create('eskalasi', function (Blueprint $table) {
            $table->id();
            // Tiket laporan yang dieskalasi
            $table->foreignId('laporan_id')->constrained('laporan')->restrictOnDelete();
            // Pemicu eskalasi: 'SLA', 'SANGGAHAN', 'RONDE', atau 'TANPA_KUORUM'
            $table->string('pemicu', 12);
            // Tahap yang melanggar SLA (khusus pemicu SLA)
            $table->string('tahap', 20)->nullable();
            // Riwayat status saat tiket masuk tahap tersebut (khusus pemicu SLA)
            $table->foreignId('riwayat_masuk_id')->nullable()->constrained('riwayat_status')->restrictOnDelete();
            // Ronde verifikasi terkait (khusus pemicu non-SLA: SANGGAHAN, RONDE, TANPA_KUORUM)
            $table->foreignId('ronde_id')->nullable()->constrained('ronde_verifikasi')->restrictOnDelete();
            // Waktu eskalasi dibuat
            $table->timestampTz('created_at')->useCurrent();
            // Waktu eskalasi selesai diselesaikan
            $table->timestampTz('selesai_pada')->nullable();
            // Alasan penyelesaian eskalasi: 'tahap_berpindah' (untuk SLA) atau 'diputuskan' (oleh Auditor)
            $table->string('selesai_alasan', 16)->nullable();
        });

        // pemicu eskalasi hanya boleh 4 jenis
        DB::statement("ALTER TABLE eskalasi ADD CONSTRAINT eskalasi_pemicu_ck CHECK (
            pemicu IN ('SLA', 'SANGGAHAN', 'RONDE', 'TANPA_KUORUM')
        )");

        // integritas relasi bentuk eskalasi (SLA vs non-SLA)
        DB::statement("ALTER TABLE eskalasi ADD CONSTRAINT eskalasi_bentuk_ck CHECK (
            (pemicu = 'SLA' AND tahap IS NOT NULL AND riwayat_masuk_id IS NOT NULL AND ronde_id IS NULL) OR
            (pemicu <> 'SLA' AND tahap IS NULL AND riwayat_masuk_id IS NULL AND ronde_id IS NOT NULL)
        )");

        // selesai_alasan wajib ada jika dan hanya jika selesai_pada terisi
        DB::statement("ALTER TABLE eskalasi ADD CONSTRAINT eskalasi_selesai_ck CHECK (
            (selesai_pada IS NULL) = (selesai_alasan IS NULL) AND 
            (selesai_alasan IS NULL OR selesai_alasan IN ('tahap_berpindah', 'diputuskan'))
        )");

        // Idempotensi: hanya 1 eskalasi SLA per tiket per tahap per riwayat masuk
        DB::statement("CREATE UNIQUE INDEX eskalasi_sla_uq ON eskalasi (laporan_id, tahap, riwayat_masuk_id) WHERE pemicu = 'SLA'");

        // Hanya 1 eskalasi per ronde verifikasi
        DB::statement("CREATE UNIQUE INDEX eskalasi_ronde_uq ON eskalasi (ronde_id) WHERE pemicu <> 'SLA'");

        // Menjamin hanya ada 1 eskalasi non-SLA yang terbuka dalam satu waktu per laporan
        DB::statement("CREATE UNIQUE INDEX eskalasi_satu_keputusan_terbuka_uq ON eskalasi (laporan_id) WHERE pemicu <> 'SLA' AND selesai_pada IS NULL");

        // Index antrean eskalasi aktif untuk dashboard Auditor
        DB::statement('CREATE INDEX eskalasi_terbuka_idx ON eskalasi (created_at) WHERE selesai_pada IS NULL');
        DB::statement('CREATE INDEX eskalasi_laporan_idx ON eskalasi (laporan_id)');

        // 2. Tabel Keputusan Resmi Auditor (DD-14, BR-AUD-01 s/d 04)
        Schema::create('keputusan_auditor', function (Blueprint $table) {
            $table->id();
            // Eskalasi yang diputuskan
            $table->foreignId('eskalasi_id')->constrained('eskalasi')->restrictOnDelete();
            // Auditor yang mengambil keputusan
            $table->foreignId('auditor_id')->constrained('users')->restrictOnDelete();
            // Jenis keputusan: 'PERINTAH', 'PERBAIKAN_SAH', atau 'KERJAKAN_ULANG'
            $table->string('jenis', 15);
            // Alasan tertulis keputusan Auditor (wajib, tampil publik)
            $table->text('alasan')->nullable();
            // Perintah kerja tertulis dari Auditor (khusus jenis PERINTAH)
            $table->text('perintah')->nullable();
            // Tenggat waktu baru yang ditetapkan Auditor (khusus jenis PERINTAH atau KERJAKAN_ULANG)
            $table->date('tenggat')->nullable();
            // Waktu keputusan diterbitkan
            $table->timestampTz('waktu')->useCurrent();
        });

        // aturan kelengkapan data per jenis keputusan Auditor
        DB::statement("ALTER TABLE keputusan_auditor ADD CONSTRAINT ka_bentuk_ck CHECK (
            (jenis = 'PERINTAH' AND perintah IS NOT NULL AND tenggat IS NOT NULL) OR
            (jenis = 'PERBAIKAN_SAH' AND alasan IS NOT NULL) OR
            (jenis = 'KERJAKAN_ULANG' AND alasan IS NOT NULL AND tenggat IS NOT NULL)
        )");

        // Index pencarian kronologis keputusan per eskalasi
        DB::statement('CREATE INDEX ka_eskalasi_idx ON keputusan_auditor (eskalasi_id, waktu)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keputusan_auditor');
        Schema::dropIfExists('eskalasi');
    }
};

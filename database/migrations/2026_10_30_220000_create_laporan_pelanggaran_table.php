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
        Schema::create('laporan_pelanggaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained('laporan')->cascadeOnDelete();
            $table->foreignId('pelapor_id')->constrained('users')->cascadeOnDelete();
            $table->string('alasan', 50); // sara_ujaran_kebencian, foto_tidak_senonoh, spam_promosi, informasi_palsu, pelanggaran_privasi, lainnya
            $table->text('catatan')->nullable(); // keterangan tambahan dari warga (maks 500 karakter)
            $table->string('status', 20)->default('menunggu'); // 'menunggu', 'ditinjau', 'selesai'
            $table->string('tindakan', 50)->nullable(); // 'disembunyikan', 'peringatan', 'diabaikan'
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_moderator')->nullable();
            $table->timestamps();

            // Index pencarian antrean moderasi
            $table->index(['status', 'created_at'], 'laporan_pelanggaran_status_idx');
            $table->index('laporan_id', 'laporan_pelanggaran_laporan_idx');
        });

        DB::statement("ALTER TABLE laporan_pelanggaran ADD CONSTRAINT laporan_pelanggaran_status_ck CHECK (status IN ('menunggu', 'ditinjau', 'selesai'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_pelanggaran');
    }
};

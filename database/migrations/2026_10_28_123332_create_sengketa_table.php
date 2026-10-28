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
        Schema::create('sengketa', function (Blueprint $table) {
            $table->id();
            // Ronde verifikasi yang disengketakan warga
            $table->foreignId('ronde_id')->unique()->constrained('ronde_verifikasi')->restrictOnDelete();
            // Batas tenggat waktu instansi menjawab sengketa (7 hari kerja dari tanggal sengketa)
            $table->date('tenggat');
            // Pilihan jawaban instansi: null (belum dijawab), 'kerjakan_ulang', atau 'sanggah'
            $table->string('jawaban', 15)->nullable();
            // Alasan sanggahan instansi jika memilih sanggah (tampil publik)
            $table->text('alasan_sanggah')->nullable();
            // Waktu instansi mengirim jawaban sengketa
            $table->timestampTz('waktu_jawab')->nullable();
            // Petugas instansi yang memberikan jawaban
            $table->foreignId('pelaku_id')->nullable()->constrained('users')->restrictOnDelete();
            // Waktu pencatatan sengketa
            $table->timestampTz('created_at')->useCurrent();
        });

        // Validasi database:
        // 1. waktu_jawab wajib ada jika dan hanya jika jawaban sudah diisi
        // 2. alasan_sanggah wajib ada jika jawaban = 'sanggah'
        // 3. jawaban hanya boleh null, 'kerjakan_ulang', atau 'sanggah'
        DB::statement("ALTER TABLE sengketa ADD CONSTRAINT sengketa_jawaban_ck CHECK (
            (jawaban IS NULL) = (waktu_jawab IS NULL) AND 
            (jawaban = 'sanggah') = (alasan_sanggah IS NOT NULL) AND 
            (jawaban IS NULL OR jawaban IN ('kerjakan_ulang', 'sanggah'))
        )");

        // Index untuk memantau sengketa yang belum dijawab dan mendekati tenggat
        DB::statement('CREATE INDEX sengketa_tenggat_idx ON sengketa (tenggat) WHERE jawaban IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sengketa');
    }
};

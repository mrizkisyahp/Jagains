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
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id();
            // Pengguna yang melakukan tindakan (null jika dijalankan via CLI/seeder)
            $table->foreignId('pelaku_id')->nullable()->constrained('users')->restrictOnDelete();
            // Nama aksi/tindakan (misal: 'UBAH_PENGATURAN', 'PELAPOR_DIBUKA', 'RESET_SANDI')
            $table->string('aksi', 60);
            // Tipe model/entitas yang dimutasi secara polimorfik (misal: 'Laporan', 'Pengaturan')
            $table->string('objek_tipe', 40);
            // ID entitas yang dimutasi
            $table->unsignedBigInteger('objek_id')->nullable();
            // ID laporan terkait (khusus untuk audit pembukaan identitas pelapor FR-ADM-08)
            $table->foreignId('laporan_id')->nullable()->constrained('laporan')->restrictOnDelete();
            // Data lama sebelum diubah dalam format JSONB (whitelist atribut non-sensitif)
            $table->jsonb('nilai_lama')->nullable();
            // Data baru setelah diubah dalam format JSONB
            $table->jsonb('nilai_baru')->nullable();
            // Alasan tertulis dilakukannya tindakan berprivilese (wajib untuk akses identitas pelapor)
            $table->text('alasan')->nullable();
            // Konteks tambahan (misal: IP address, sumber request)
            $table->jsonb('konteks')->nullable();
            // Waktu pencatatan audit log
            $table->timestampTz('waktu')->useCurrent();
        });

        // Index untuk penelusuran kronologis log audit terbaru
        DB::statement('CREATE INDEX audit_log_waktu_idx ON audit_log (waktu DESC)');

        // Index untuk audit jejak aktivitas petugas tertentu
        DB::statement('CREATE INDEX audit_log_pelaku_idx ON audit_log (pelaku_id, waktu)');

        // Index pencarian riwayat perubahan pada objek/entitas tertentu
        DB::statement('CREATE INDEX audit_log_objek_idx ON audit_log (objek_tipe, objek_id)');

        // Index pencarian berdasarkan jenis tindakan audit
        DB::statement('CREATE INDEX audit_log_aksi_idx ON audit_log (aksi, waktu)');

        // Index pencarian jejak audit pada tiket laporan tertentu
        DB::statement('CREATE INDEX audit_log_laporan_idx ON audit_log (laporan_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_log');
    }
};

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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 30); // username akun (simpen huruf kecil, unik);
            $table->string('password', 255); // password hash bcrypt/argon2id... keknya bcrypt aja.
            $table->char('email_hash', 64)->nullable()->unique(); // hash hmac-sha256 dari email khusus peran warga yang mau anonim
            $table->string('peran', 16); // peran: 'warga', 'instansi', 'admin', 'auditor'
            $table->foreignId('kelurahan_id')->nullable()->constrained('wilayah')->restrictOnDelete(); // domisili kelurahan akun warga, khusus peran warga.
            $table->timestampTz('kelurahan_diubah_pada')->nullable(); // waktu terakhir ganti kelurahan
            $table->foreignId('instansi_id')->nullable()->constrained('instansi')->restrictOnDelete(); // khusus peran instansi
            $table->string('status_akun', 10)->default('aktif'); // status akun, 'aktif', 'dibekukan', 'nonaktif'
            $table->smallInteger('poin_peringatan')->default(0); // poin pelanggaran dari moderasi konten
            $table->boolean('wajib_ganti_sandi')->default(false); // wajib ganti sandi login pertama (khusus akun petugas buatan admin)
            $table->timestampTz('aktivitas_terakhir_pada')->nullable(); // waktu aktivitas terakhir (lapor/dukung/verif) untuk menghitung status akun aktif 90 hari
            $table->timestampsTz();
        });

        DB::statement('CREATE UNIQUE INDEX users_username_lower_uq ON users(lower(username))'); // username tidak boleh duplikat tanpa membedakan huruf besar/kecil
        DB::statement("ALTER TABLE users add CONSTRAINT users_peran_ck CHECK (peran IN ('warga', 'instansi', 'admin', 'auditor'))"); // peran harus salah satu dari daftar
        DB::statement("ALTER TABLE users add CONSTRAINT users_status_ck CHECK (status_akun IN ('aktif', 'dibekukan', 'nonaktif'))"); // status akun hanya boleh 3 jenis
        DB::statement("ALTER TABLE users add CONSTRAINT users_email_hash_ck CHECK (email_hash IS NULL OR email_hash ~ '^[0-9a-f]{64}$')"); // format emial harus tepat 64 karakter heksadesimal

        // Aturan ketat integritas peran:
        // - Warga: WAJIB punya kelurahan & email_hash, TIDAK BOLEH punya instansi_id
        // - Instansi: WAJIB punya instansi_id, TIDAK BOLEH punya email_hash & kelurahan_id
        // - Admin/Auditor: TIDAK BOLEH punya email_hash, kelurahan_id, maupun instansi_id
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_peran_kolom_ck CHECK (
            (peran = 'warga' AND kelurahan_id IS NOT NULL AND email_hash IS NOT NULL AND instansi_id IS NULL) OR
            (peran = 'instansi' AND instansi_id  IS NOT NULL AND email_hash IS NULL AND kelurahan_id IS NULL) OR
            (peran IN ('admin', 'auditor') AND email_hash IS NULL AND instansi_id IS NULL AND kelurahan_id IS NULL)
        )");

        DB::statement('CREATE INDEX users_kelurahan_peran_idx ON users (kelurahan_id, peran, status_akun)'); // index optimasi pencarian warga per kelurahan (untuk perhitungan kuorum)
        DB::statement('CREATE INDEX users_instansi_idx ON users (instansi_id) WHERE instansi_id IS NOT NULL'); // index petugas berdasarkan instansi

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

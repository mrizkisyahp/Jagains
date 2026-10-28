<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Role runtime aplikasi yang dipisahkan dari owner/migration role (DD-02, NFR-INT-02)
        // Jika environment variable DB_RUNTIME_ROLE tidak diset (misal di local dev), lewati migration ini (no-op).
        $runtimeRole = env('DB_RUNTIME_ROLE');
        if (! $runtimeRole) {
            return;
        }
        DB::statement("
            DO \$\$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{$runtimeRole}') THEN
                    -- Cabut seluruh hak bawaan terlebih dahulu
                    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM {$runtimeRole};
                    -- Hak CRUD standar untuk tabel operasional
                    GRANT SELECT, INSERT, UPDATE ON 
                        laporan, users, eskalasi, sengketa, ronde_verifikasi, pengaturan, 
                        instansi, wilayah, kategori, aturan_routing, aturan_sla, 
                        parameter_kuorum, hari_libur, lampiran, token_sekali_pakai, notifikasi 
                    TO {$runtimeRole};
                    -- Hak Append-Only murni untuk tabel riwayat, audit, dan suara warga
                    GRANT SELECT, INSERT ON 
                        audit_log, riwayat_status, berita_acara, pengalihan, 
                        verifikasi_warga, keputusan_auditor 
                    TO {$runtimeRole};
                    -- Hak khusus tabel dukungan (dukungan dapat ditarik kembali sebelum tiket ditutup)
                    GRANT SELECT, INSERT, DELETE ON dukungan TO {$runtimeRole};
                    -- Hak session, cache, dan locks framework Laravel
                    GRANT SELECT, INSERT, UPDATE, DELETE ON sessions, cache, cache_locks TO {$runtimeRole};
                    -- Hak pembersihan berkala (purge jobs) untuk token kedaluwarsa dan notifikasi lama
                    GRANT DELETE ON token_sekali_pakai, notifikasi TO {$runtimeRole};
                    -- Hak akses sequences PostgreSQL (laporan_nomor_seq, auto-increment id)
                    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {$runtimeRole};
                END IF;
            END \$\$;
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // down no-op (idempoten dan tidak pernah di-rollback di production demi keamanan data)
    }
};

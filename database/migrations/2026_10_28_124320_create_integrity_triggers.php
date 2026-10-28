<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Fungsi penolak UPDATE, DELETE, dan TRUNCATE untuk tabel Append-Only (NFR-INT-01, NFR-INT-02)
        DB::statement("
            CREATE OR REPLACE FUNCTION jagains_tolak_ubah() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'Tabel % hanya dapat ditambah (operasi % ditolak)', TG_TABLE_NAME, TG_OP 
                USING ERRCODE = 'integrity_constraint_violation';
            END $$;
        ");

        // Pasang trigger append-only pada 6 tabel riwayat, audit, dan suara
        $tabelAppendOnly = [
            'audit_log',
            'riwayat_status',
            'berita_acara',
            'pengalihan',
            'verifikasi_warga',
            'keputusan_auditor',
        ];

        foreach ($tabelAppendOnly as $tabel) {
            DB::statement("
                CREATE TRIGGER {$tabel}_append_only 
                BEFORE UPDATE OR DELETE ON {$tabel}
                FOR EACH ROW EXECUTE FUNCTION jagains_tolak_ubah();
            ");
            DB::statement("
                CREATE TRIGGER {$tabel}_no_truncate 
                BEFORE TRUNCATE ON {$tabel}
                FOR EACH STATEMENT EXECUTE FUNCTION jagains_tolak_ubah();
            ");
        }

        // 2. Fungsi pengawal status laporan (DD-02, BR-STS-01)
        DB::statement("
            CREATE OR REPLACE FUNCTION jagains_jaga_status() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status)
                   AND coalesce(current_setting('jagains.izin_status', true), '') <> 'on' THEN
                    RAISE EXCEPTION 'Status laporan hanya boleh diubah melalui TiketStatusService' 
                    USING ERRCODE = 'integrity_constraint_violation';
                END IF;
                RETURN NEW;
            END $$;
        ");

        // Pasang trigger pengawal status pada tabel laporan
        DB::statement('
            CREATE TRIGGER laporan_jaga_status 
            BEFORE INSERT OR UPDATE OF status ON laporan
            FOR EACH ROW EXECUTE FUNCTION jagains_jaga_status();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS laporan_jaga_status ON laporan');
        DB::statement('DROP FUNCTION IF EXISTS jagains_jaga_status()');
        $tabelAppendOnly = [
            'audit_log',
            'riwayat_status',
            'berita_acara',
            'pengalihan',
            'verifikasi_warga',
            'keputusan_auditor',
        ];
        foreach ($tabelAppendOnly as $tabel) {
            DB::statement("DROP TRIGGER IF EXISTS {$tabel}_append_only ON {$tabel}");
            DB::statement("DROP TRIGGER IF EXISTS {$tabel}_no_truncate ON {$tabel}");
        }
        DB::statement('DROP FUNCTION IF EXISTS jagains_tolak_ubah()');
    }
};

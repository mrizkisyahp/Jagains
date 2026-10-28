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
        // Menghubungkan kolom anchor SLA di laporan ke id riwayat status terkait
        DB::statement('ALTER TABLE laporan 
            ADD CONSTRAINT laporan_sla_riwayat_fk 
            FOREIGN KEY (sla_riwayat_id) 
            REFERENCES riwayat_status(id) 
            ON DELETE RESTRICT 
            DEFERRABLE INITIALLY DEFERRED');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE laporan DROP CONSTRAINT IF EXISTS laporan_sla_riwayat_fk');
    }
};

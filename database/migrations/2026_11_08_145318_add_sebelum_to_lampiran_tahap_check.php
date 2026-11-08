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
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE lampiran DROP CONSTRAINT IF EXISTS lampiran_tahap_ck');
            DB::statement("ALTER TABLE lampiran ADD CONSTRAINT lampiran_tahap_ck CHECK (tahap IN ('awal', 'sebelum', 'sesudah', 'verifikasi'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE lampiran DROP CONSTRAINT IF EXISTS lampiran_tahap_ck');
            DB::statement("ALTER TABLE lampiran ADD CONSTRAINT lampiran_tahap_ck CHECK (tahap IN ('awal', 'sesudah', 'verifikasi'))");
        }
    }
};

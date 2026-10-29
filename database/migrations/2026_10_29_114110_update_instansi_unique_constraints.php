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
        DB::statement('ALTER TABLE instansi DROP CONSTRAINT IF EXISTS instansi_nama_unique');
        DB::statement('ALTER TABLE instansi DROP CONSTRAINT IF EXISTS instansi_singkatan_unique');

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS instansi_wilayah_nama_uq ON instansi (wilayah_id, lower(nama))');
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS instansi_wilayah_singkatan_uq ON instansi (wilayah_id, lower(singkatan)) WHERE singkatan IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS instansi_wilayah_nama_uq');
        DB::statement('DROP INDEX IF EXISTS instansi_wilayah_singkatan_uq');

        Schema::table('instansi', function (Blueprint $table) {
            $table->unique('nama', 'instansi_nama_unique');
            $table->unique('singkatan', 'instansi_singkatan_unique');
        });
    }
};

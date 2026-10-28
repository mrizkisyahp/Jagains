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
        Schema::create('wilayah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('induk_id')->nullable()->constrained('wilayah')->restrictOnDelete(); // Kota induknya null, kecamatan punya induk kota, kelurahan punya induk kecamatan
            $table->string('tingkat', 10); // Kabupaten/Kota, Kecamatan, Kelurahan/Desa
            $table->string('nama', 120); // self explanatory.
            $table->string('kode_bps', 20)->nullable(); // ambil dari badan pusat statistik
            $table->jsonb('geometri')->nullable(); // batas poligon dalam format geojson.
            $table->decimal('min_lintang', 9, 6)->nullable(); // Bounding box utara
            $table->decimal('max_lintang', 9, 6)->nullable(); // Bounding box selatan
            $table->decimal('min_bujur', 9, 6)->nullable(); // Bounding box barat
            $table->decimal('max_bujur', 9, 6)->nullable(); // Bounding box timur
            $table->timestampsTz();
            $table->index('induk_id', 'wilayah_induk_idx');
        });

        DB::statement("ALTER TABLE wilayah ADD CONSTRAINT wilayah_tingkat_ck CHECK (tingkat IN ('kota', 'kecamatan', 'kelurahan'))"); // Validasi database PostgreSQL: memastikan tingkat hanya 3 jenis
        DB::statement("ALTER TABLE wilayah ADD CONSTRAINT wilayah_induk_ck CHECK ((tingkat = 'kota') = (induk_id IS NULL))"); // Validasi database: hanya tingkat 'kota' yang tidak punya induk (induk_id IS NULL)
        DB::statement('ALTER TABLE wilayah ADD CONSTRAINT wilayah_bbox_ck CHECK (num_nonnulls(min_lintang, max_lintang, min_bujur, max_bujur) IN (0, 4))'); // Validasi database: 4 titik bounding box harus terisi semua atau kosong semua
        DB::statement('CREATE UNIQUE INDEX wilayah_induk_nama_uq ON wilayah (induk_id, lower(nama)) WHERE induk_id IS NOT NULL');  // Nama wilayah di bawah induk yang sama tidak boleh kembar (case-insensitive)
        DB::statement("CREATE INDEX wilayah_bbox_idx ON wilayah (min_lintang, max_lintang, min_bujur, max_bujur) WHERE tingkat = 'kelurahan'"); // Index spasial bounding box untuk pencarian kilat posisi kelurahan dari GPS
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wilayah'); // self explanatory
    }
};

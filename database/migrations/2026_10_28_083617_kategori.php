<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kategori', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 240)->unique(); // nama kategori fasil publik misal, jalan berlubang / lampu jalan.
            $table->smallInteger('radius_gabung_m')->default(25); // radius dalam meter untuk deteksi laporan serupa/duplikat di dekat lokasi
            $table->boolean('aktif')->default(true); // status aktif/false.
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kategori');
    }
};

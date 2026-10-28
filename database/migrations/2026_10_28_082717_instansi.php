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
        Schema::create('instansi', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 150)->unique(); // nama lengkap instansi misal: Dinas PUPR
            $table->string('singkatan', 30)->nullable()->unique(); // singkatan instansi
            $table->foreignId('wilayah_id')->constrained('wilayah')->restrictOnDelete(); // Cakupan wilayah instnasi, merujuk pada tingkat kota atau kecamatan pada tabel wilayah.
            $table->boolean('aktif')->default(true);
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instansi');
    }
};

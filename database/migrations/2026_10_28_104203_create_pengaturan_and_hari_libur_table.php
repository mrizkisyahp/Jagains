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
        Schema::create('pengaturan', function (Blueprint $table) {
            $table->string('key', 60)->primary(); // primary key untuk identifikasi pengaturan
            $table->string('nilai', 255); // nilai parameter
            $table->string('tipe', 8); // int, decimal, bool / string.
            $table->unsignedInteger('versi')->default(1); // nomor versi konfigurasi
            $table->foreignId('diubah_oleh')->nullable()->constrained('users')->restrictOnDelete(); // admin yang terakhir mengubah parameter
            $table->timestampTz('waktu')->useCurrent(); // waktu perubahan parameter
        });

        Schema::create('hari_libur', function (Blueprint $table) {
            $table->date('tanggal')->primary(); // self explanatory
            $table->string('keterangan', 150); // keterangan libur
            $table->string('sumber', 150)->nullable(); // sumber resmi penetapan libur
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hari_libur');
        Schema::dropIfExists('pengaturan');
    }
};

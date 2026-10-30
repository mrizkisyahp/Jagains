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
        DB::statement('CREATE SEQUENCE IF NOT EXISTS laporan_nomor_seq START 1');

        Schema::create('laporan', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_tiket', 24)->unique(); // nomor tiket publik
            $table->foreignId('pelapor_id')->constrained('users')->restrictOnDelete(); // akun pelapor (warga)
            $table->foreignId('kategori_id')->constrained('kategori')->restrictOnDelete(); // kategori kerusakan
            $table->foreignId('instansi_id')->nullable()->constrained('instansi')->restrictOnDelete(); // instansi yang saat ini megang tanggung jawab
            $table->foreignId('kelurahan_id')->constrained('wilayah')->restrictOnDelete(); // kelurahan titik laporan
            $table->string('judul', 200); // judul laporan
            $table->text('keterangan'); // keterangan detail kerusakan dari pelapor
            $table->string('keparahan', 10)->default('sedang'); // tingkat keparahan 'ringan', 'sedang', 'berat'
            $table->decimal('lintang', 9, 6);
            $table->decimal('bujur', 9, 6); // titik koordinat kerusakan di peta
            $table->decimal('akurasi_gps_m', 7, 1)->nullable(); // tingkat akurasi gps pelapor.

            $table->string('lokasi_sumber', 6); // sumber titik lokasi, gps atau manual
            $table->string('status', 30); // status utama laporan
            $table->string('jenis_pendanaan', 15)->nullable(); // apbd kota, abpd apa gitu bla bla hehe
            $table->date('tanggal_target_awal')->nullable(); // janji target tanggal selesai)
            $table->date('tanggal_target')->nullable();
            $table->smallInteger('ronde_sengketa')->default(0); // penghitung jumlah sengketa
            $table->smallInteger('jumlah_pengalihan')->default(0); // penghitung jumlah pengalihan tiket
            $table->boolean('disembunyikan')->default(false); // penanda moderasi konten
            $table->string('referensi_sp4n', 100)->nullable(); // referensi eksternal s4n lapor jika ada
            $table->string('sla_tahap', 20)->nullable();
            $table->unsignedBigInteger('sla_riwayat_id')->nullable(); // foreign key ke sla riwayat
            $table->timestampTz('sla_mulai_pada')->nullable();
            $table->smallInteger('sla_batas')->nullable();
            $table->string('sla_satuan', 12)->nullable(); // hari kerja atau hari kalender
            $table->date('sla_jatuh_tempo')->nullable();
            $table->timestampTz('diteruskan_pertama_pada')->nullable(); // jam umur tiket (hari kerja dari pertama diteruskan sampai selesai)
            $table->timestampTz('ditutup_pada')->nullable();
            $table->timestampsTz();
        });

        // VALIDASI 13 STATUS RESMI Status Jagains
        DB::statement("ALTER TABLE laporan ADD constraint laporan_status_ck CHECK (status IN 
        ('DITERUSKAN', 'PERLU_ROUTING', 'USULAN_TOLAK', 'DITOLAK', 'DITERIMA', 'DISURVEI', 'TERJADWAL_ANGGARAN',
        'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'DISENGKETAKAN', 'MENUNGGU_KEPUTUSAN_AUDITOR', 'TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'
        ))");

        // validasi keparahan

        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_keparahan_ck CHECK (keparahan IN ('ringan',
        'sedang', 'berat'))");

        // validasi sumber gps maka akurasi wajib ada, koordinat lintang/bujur dalam batas bola bumi
        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_lokasi_ck CHECK (
        lokasi_sumber IN ('gps', 'manual') AND
        (lokasi_sumber = 'gps') = (akurasi_gps_m IS NOT NULL) AND
        lintang BETWEEN -90 AND 90 AND 
        bujur BETWEEN -180 AND 180)");

        // Validasi database: jenis pendanaan
        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_pendanaan_ck CHECK (
            jenis_pendanaan IS NULL OR 
            jenis_pendanaan IN ('APBD_KOTA','APBD_PROVINSI','APBN','LAINNYA')
        )");

        // Validasi database: tanggal target awal dan saat ini harus sama-sama terisi/kosong bersama pendanaan
        DB::statement('ALTER TABLE laporan ADD CONSTRAINT laporan_target_ck CHECK (
            (tanggal_target IS NULL) = (tanggal_target_awal IS NULL) AND 
            (jenis_pendanaan IS NULL) = (tanggal_target IS NULL)
        )');

        // hanya status perlu_routing yang tidak memiliki instansi_id
        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_instansi_ck CHECK (
        (status = 'PERLU_ROUTING') = (instansi_id IS NULL))");

        // ditutup_pada wajib terisi hanya saat status final
        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_final_ck CHECK (
            (ditutup_pada IS NOT NULL) = (status IN ('TERTUTUP_WARGA','TERTUTUP_AUDITOR','DITOLAK'))
        )");

        // 6 kolom SLA harus terisi lengkap semua atau null semua

        DB::statement("ALTER TABLE laporan ADD CONSTRAINT laporan_sla_ck CHECK (
            num_nonnulls(sla_tahap, sla_riwayat_id, sla_mulai_pada, sla_batas, sla_satuan, sla_jatuh_tempo) IN (0, 6) AND 
            (sla_tahap IS NULL OR sla_tahap IN ('RESPONS','SURVEI','ANGGARAN','PELAKSANAAN','JAWAB_SENGKETA')) AND 
            (sla_satuan IS NULL OR sla_satuan IN ('hari_kerja','hari_kalender'))
        )");

        // counter tidak boleh minus

        DB::statement('ALTER TABLE laporan ADD CONSTRAINT laporan_counter_ck CHECK (ronde_sengketa >= 0 AND jumlah_pengalihan >= 0)');

        // index untuk performa filter peta & dashboard
        DB::statement('CREATE INDEX laporan_status_idx ON laporan (status)');
        DB::statement('CREATE INDEX laporan_kelurahan_idx ON laporan (kelurahan_id)');
        DB::statement('CREATE INDEX laporan_kategori_idx ON laporan (kategori_id)');
        DB::statement('CREATE INDEX laporan_status_kel_kat_idx ON laporan (status, kelurahan_id, kategori_id)');
        DB::statement('CREATE INDEX laporan_instansi_status_idx ON laporan (instansi_id, status)');
        DB::statement('CREATE INDEX laporan_pelapor_waktu_idx ON laporan (pelapor_id, created_at)');
        DB::statement('CREATE INDEX laporan_lokasi_idx ON laporan (lintang, bujur)');
        DB::statement('CREATE INDEX laporan_sla_idx ON laporan (sla_jatuh_tempo) WHERE sla_tahap IS NOT NULL');
        DB::statement('CREATE INDEX laporan_instansi_sla_idx ON laporan (instansi_id, sla_jatuh_tempo) WHERE sla_tahap IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan');
        DB::statement('DROP SEQUENCE IF EXISTS laporan_nomor_seq');
    }
};

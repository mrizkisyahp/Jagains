<?php

namespace Tests\Feature\Sistem;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\InstansiTiketService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TriggerIntegritasStatusTest extends TestCase
{
    use DatabaseTransactions;

    protected Wilayah $kota;

    protected Wilayah $kecamatan;

    protected Wilayah $kelurahan;

    protected Instansi $instansi;

    protected Kategori $kategori;

    protected User $warga;

    protected User $petugas;

    protected function setUp(): void
    {
        parent::setUp();

        // Pastikan izin status dalam kondisi bersih (ter-reset)
        DB::statement('RESET jagains.izin_status');

        $this->kota = Wilayah::create([
            'kode_bps' => '3276',
            'nama' => 'Kota Depok',
            'tingkat' => 'kota',
        ]);

        $this->kecamatan = Wilayah::create([
            'kode_bps' => '3276010',
            'nama' => 'Pancoran Mas',
            'tingkat' => 'kecamatan',
            'induk_id' => $this->kota->id,
        ]);

        $this->kelurahan = Wilayah::create([
            'kode_bps' => '3276010001',
            'nama' => 'Depok',
            'tingkat' => 'kelurahan',
            'induk_id' => $this->kecamatan->id,
        ]);

        $this->instansi = Instansi::create([
            'nama' => 'Dinas Pekerjaan Umum dan Penataan Ruang',
            'singkatan' => 'DPUPR',
            'wilayah_id' => $this->kota->id,
            'aktif' => true,
        ]);

        $this->kategori = Kategori::create([
            'nama' => 'Jalan Rusak Parah',
            'radius_gabung_m' => 15,
            'aktif' => true,
        ]);

        $this->warga = User::create([
            'username' => 'warga_trigger_test',
            'password' => bcrypt('password123'),
            'email_hash' => hash('sha256', 'warga_trigger@example.com'),
            'peran' => 'warga',
            'kelurahan_id' => $this->kelurahan->id,
            'status_akun' => 'aktif',
        ]);

        $this->petugas = User::create([
            'username' => 'petugas_trigger_test',
            'password' => bcrypt('password123'),
            'email_hash' => null,
            'peran' => 'instansi',
            'instansi_id' => $this->instansi->id,
            'status_akun' => 'aktif',
        ]);
    }

    protected function tearDown(): void
    {
        try {
            DB::statement('RESET jagains.izin_status');
        } catch (\Throwable) {
        }

        parent::tearDown();
    }

    protected function buatLaporanUji(string $statusAwal = 'DITERUSKAN'): Laporan
    {
        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-2026-TRG'.rand(10000, 99999),
            'judul' => 'Jalan Berlubang Depan Stasiun',
            'keterangan' => 'Aspal mengelupas sedalam 12cm membahayakan pengguna jalan.',
            'kategori_id' => $this->kategori->id,
            'kelurahan_id' => $this->kelurahan->id,
            'instansi_id' => $this->instansi->id,
            'pelapor_id' => $this->warga->id,
            'status' => $statusAwal,
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'gps',
            'lintang' => -6.402484,
            'bujur' => 106.794241,
            'akurasi_gps_m' => 5.0,
            'ronde_sengketa' => 0,
            'jumlah_pengalihan' => 0,
        ]);

        // Segera reset izin_status setelah pembuatan fixture selesai
        DB::statement('RESET jagains.izin_status');

        return $laporan;
    }

    /**
     * Skenario A: Pembaruan status laporan secara langsung (Eloquent & Raw SQL)
     * tanpa izin_status wajib ditolak oleh PostgreSQL trigger jagains_jaga_status,
     * dan nilai status pada database tidak boleh berubah.
     */
    public function test_skenario_a_pembaruan_status_langsung_tanpa_izin_ditolak_trigger(): void
    {
        $laporan = $this->buatLaporanUji('DITERUSKAN');
        $this->assertEquals('DITERUSKAN', $laporan->fresh()->status);

        // 1. Uji penolakan via Eloquent update (dibungkus savepoint agar abort tidak merusak outer transaction)
        $eloquentGagal = false;
        try {
            DB::transaction(function () use ($laporan) {
                $laporan->status = 'DITERIMA';
                $laporan->save();
            });
        } catch (QueryException $e) {
            $eloquentGagal = true;
            $this->assertStringContainsString('Status laporan hanya boleh diubah melalui TiketStatusService', $e->getMessage());
        }
        $this->assertTrue($eloquentGagal, 'Eloquent update pada laporan.status wajib ditolak oleh trigger.');
        $this->assertEquals('DITERUSKAN', $laporan->fresh()->status, 'Status di database harus tetap DITERUSKAN.');

        // 2. Uji penolakan via Raw SQL UPDATE (dibungkus savepoint)
        $sqlGagal = false;
        try {
            DB::transaction(function () use ($laporan) {
                DB::statement("UPDATE laporan SET status = 'SELESAI' WHERE id = ?", [$laporan->id]);
            });
        } catch (QueryException $e) {
            $sqlGagal = true;
            $this->assertStringContainsString('Status laporan hanya boleh diubah melalui TiketStatusService', $e->getMessage());
        }
        $this->assertTrue($sqlGagal, 'Raw SQL UPDATE pada laporan.status wajib ditolak oleh trigger.');
        $this->assertEquals('DITERUSKAN', $laporan->fresh()->status, 'Status di database harus tetap DITERUSKAN.');
    }

    /**
     * Skenario B: Membuktikan secara murni bahwa PostgreSQL SET LOCAL jagains.izin_status = 'on'
     * tidak bertahan (does not survive) setelah transaksi paling luar (outermost transaction) berakhir.
     *
     * Tes ini melepaskan wrapper transaksi DatabaseTransactions agar menguji siklus hidup transaksi
     * top-level nyata pada koneksi PostgreSQL yang sama (pg_backend_pid), membuktikan ketiadaan kebocoran
     * TANPA menggunakan perintah manual RESET jagains.izin_status.
     */
    public function test_skenario_b_izin_status_set_local_tidak_bocor_ke_transaksi_berikutnya(): void
    {
        // 1. Lepas transaksi pembungkus bawaan DatabaseTransactions agar berada di level 0
        DB::rollBack();
        $this->assertSame(0, DB::transactionLevel(), 'Transaction level harus 0 (autocommit/idle).');

        // Rekam ID proses PostgreSQL pada koneksi ini untuk menjamin koneksi yang sama digunakan
        $pidAwal = DB::select('SELECT pg_backend_pid() as pid')[0]->pid;

        // Pastikan parameter izin_status di awal tidak bernilai 'on'
        $settingAwal = DB::select("SELECT coalesce(current_setting('jagains.izin_status', true), '') as v")[0]->v;
        $this->assertNotSame('on', $settingAwal, "Awalnya jagains.izin_status tidak boleh 'on'.");

        // 2. Buat master data dan tiket uji di dalam transaksi top-level yang sah
        $kota = Wilayah::create(['kode_bps' => '3276', 'nama' => 'Kota Depok', 'tingkat' => 'kota']);
        $kec = Wilayah::create(['kode_bps' => '3276010', 'nama' => 'Pancoran Mas', 'tingkat' => 'kecamatan', 'induk_id' => $kota->id]);
        $kel = Wilayah::create(['kode_bps' => '3276010001', 'nama' => 'Depok', 'tingkat' => 'kelurahan', 'induk_id' => $kec->id]);
        $instansi = Instansi::create(['nama' => 'DPUPR Depok', 'singkatan' => 'DPUPR', 'wilayah_id' => $kota->id, 'aktif' => true]);
        $kategori = Kategori::create(['nama' => 'Jalan Rusak', 'radius_gabung_m' => 15, 'aktif' => true]);
        $warga = User::create([
            'username' => 'warga_iso_'.uniqid(),
            'password' => bcrypt('password'),
            'email_hash' => hash('sha256', 'warga@iso.com'),
            'peran' => 'warga',
            'kelurahan_id' => $kel->id,
            'status_akun' => 'aktif',
        ]);

        DB::beginTransaction();
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-ISO-'.rand(1000, 9999),
            'judul' => 'Jalan Berlubang Depan Stasiun',
            'keterangan' => 'Aspal mengelupas sedalam 12cm',
            'kategori_id' => $kategori->id,
            'kelurahan_id' => $kel->id,
            'instansi_id' => $instansi->id,
            'pelapor_id' => $warga->id,
            'status' => 'DITERUSKAN',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'gps',
            'lintang' => -6.4,
            'bujur' => 106.8,
            'akurasi_gps_m' => 5.0,
        ]);
        DB::commit();

        $this->assertSame(0, DB::transactionLevel());

        // --- SUB-SKENARIO B1: Batas COMMIT Transaksi Outermost ---
        // Mulai transaksi top-level baru untuk pembaruan status sah
        DB::beginTransaction();
        $this->assertSame(1, DB::transactionLevel());

        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $settingDalamTransaksi = DB::select("SELECT coalesce(current_setting('jagains.izin_status', true), '') as v")[0]->v;
        $this->assertSame('on', $settingDalamTransaksi, "Di dalam transaksi sah, SET LOCAL harus menghasilkan 'on'.");

        DB::table('laporan')->where('id', $laporan->id)->update(['status' => 'DITERIMA']);

        // Selesaikan (COMMIT) transaksi top-level
        DB::commit();
        $this->assertSame(0, DB::transactionLevel());

        // Verifikasi pada koneksi yang SAMA (PID identik): SET LOCAL wajib gugur secara alami tanpa perintah RESET
        $pidSetelahCommit = DB::select('SELECT pg_backend_pid() as pid')[0]->pid;
        $this->assertSame($pidAwal, $pidSetelahCommit, 'Pengujian wajib berjalan pada koneksi PostgreSQL yang sama.');

        $settingSetelahCommit = DB::select("SELECT coalesce(current_setting('jagains.izin_status', true), '') as v")[0]->v;
        $this->assertNotSame('on', $settingSetelahCommit, "Setelah COMMIT, SET LOCAL wajib gugur alami dan tidak bernilai 'on'.");
        $this->assertSame('', $settingSetelahCommit);

        // Uji pembaruan status tidak sah langsung pada koneksi yang sama: trigger wajib menolak
        $unauthorizedCommitGagal = false;
        try {
            DB::statement("UPDATE laporan SET status = 'DIKERJAKAN' WHERE id = ?", [$laporan->id]);
        } catch (QueryException $e) {
            $unauthorizedCommitGagal = true;
            $this->assertStringContainsString('Status laporan hanya boleh diubah melalui TiketStatusService', $e->getMessage());
        }
        $this->assertTrue($unauthorizedCommitGagal, 'Pembaruan langsung tanpa izin pasca-COMMIT wajib ditolak trigger.');
        $this->assertSame('DITERIMA', $laporan->fresh()->status, 'Status di database harus tetap DITERIMA.');

        // --- SUB-SKENARIO B2: Batas ROLLBACK Transaksi Outermost ---
        // Mulai transaksi top-level baru
        DB::beginTransaction();
        $this->assertSame(1, DB::transactionLevel());

        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $this->assertSame('on', DB::select("SELECT coalesce(current_setting('jagains.izin_status', true), '') as v")[0]->v);

        // Batalkan (ROLLBACK) transaksi top-level
        DB::rollBack();
        $this->assertSame(0, DB::transactionLevel());

        // Verifikasi pada koneksi yang sama: SET LOCAL wajib gugur setelah ROLLBACK
        $settingSetelahRollback = DB::select("SELECT coalesce(current_setting('jagains.izin_status', true), '') as v")[0]->v;
        $this->assertNotSame('on', $settingSetelahRollback, "Setelah ROLLBACK, SET LOCAL wajib gugur alami dan tidak bernilai 'on'.");
        $this->assertSame('', $settingSetelahRollback);

        // Uji pembaruan tidak sah lagi
        $unauthorizedRollbackGagal = false;
        try {
            DB::statement("UPDATE laporan SET status = 'SELESAI' WHERE id = ?", [$laporan->id]);
        } catch (QueryException $e) {
            $unauthorizedRollbackGagal = true;
            $this->assertStringContainsString('Status laporan hanya boleh diubah melalui TiketStatusService', $e->getMessage());
        }
        $this->assertTrue($unauthorizedRollbackGagal, 'Pembaruan langsung tanpa izin pasca-ROLLBACK wajib ditolak trigger.');
        $this->assertSame('DITERIMA', $laporan->fresh()->status, 'Status di database harus tetap DITERIMA.');

        // 3. Bersihkan data uji manual dan pulihkan transaksi pembungkus agar tearDown Laravel seimbang
        DB::statement("SET LOCAL jagains.izin_status = 'on'");
        $laporan->delete();
        $warga->delete();
        $kategori->delete();
        $instansi->delete();
        $kel->delete();
        $kec->delete();
        $kota->delete();

        // Pulihkan transaksi pembungkus DatabaseTransactions untuk tearDown()
        DB::beginTransaction();
    }

    /**
     * Skenario C: Pembaruan status resmi yang dilakukan melalui service aplikasi
     * yang berwenang (misalnya InstansiTiketService) berhasil tanpa interferensi trigger.
     */
    public function test_skenario_c_pembaruan_status_resmi_melalui_service_berhasil(): void
    {
        $laporan = $this->buatLaporanUji('DITERUSKAN');
        $service = app(InstansiTiketService::class);

        // Petugas menerima tiket resmi melalui service berwenang
        $hasil = $service->terimaTiket($laporan, $this->petugas, 'Petugas dinas siap melakukan survei lapangan.');

        $this->assertEquals('DITERIMA', $hasil->status);
        $this->assertEquals('DITERIMA', $laporan->fresh()->status);
        $this->assertEquals('SURVEI', $laporan->fresh()->sla_tahap);
    }
}

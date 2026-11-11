<?php

namespace Tests\Feature\Notifikasi;

use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\Laporan;
use App\Models\Notifikasi;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\NotifikasiService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotifikasiFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function test_pengguna_bisa_mengakses_halaman_dan_ringkasan_notifikasi()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $user = User::factory()->create([
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'status_akun' => 'aktif',
        ]);

        $notif1 = Notifikasi::create([
            'pengguna_id' => $user->id,
            'tipe' => 'PERMINTAAN_VERIFIKASI',
            'pesan' => 'Tiket fasilitas publik butuh verifikasi Anda.',
            'created_at' => now(),
        ]);

        $notif2 = Notifikasi::create([
            'pengguna_id' => $user->id,
            'tipe' => 'STATUS_DIPERBARUI',
            'pesan' => 'Status laporan telah diubah.',
            'created_at' => now()->subMinute(),
        ]);

        // 1. Test ringkasan JSON untuk bell
        $response = $this->actingAs($user)->getJson('/api/notifikasi/ringkasan');
        $response->assertOk()
            ->assertJsonPath('unread_count', 2)
            ->assertJsonCount(2, 'notifikasi');

        // 2. Test halaman penuh /notifikasi
        $responsePage = $this->actingAs($user)->get('/notifikasi');
        $responsePage->assertOk();

        // 3. Test tandai satu dibaca
        $responseBaca = $this->actingAs($user)->patchJson("/api/notifikasi/{$notif1->id}/baca");
        $responseBaca->assertOk();
        $this->assertNotNull($notif1->fresh()->dibaca_pada);

        // 4. Test ringkasan setelah 1 dibaca
        $responseAfterBaca = $this->actingAs($user)->getJson('/api/notifikasi/ringkasan');
        $responseAfterBaca->assertJsonPath('unread_count', 1);

        // 5. Test baca semua
        $responseBacaSemua = $this->actingAs($user)->postJson('/api/notifikasi/baca-semua');
        $responseBacaSemua->assertOk();
        $this->assertNotNull($notif2->fresh()->dibaca_pada);

        $responseEmpty = $this->actingAs($user)->getJson('/api/notifikasi/ringkasan');
        $responseEmpty->assertJsonPath('unread_count', 0);
    }

    public function test_service_kirim_broadcast_kelurahan_dan_ke_instansi()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create();
        $kelurahanLain = Wilayah::factory()->kelurahan()->create();
        $instansi = Instansi::factory()->create();

        // Buat 3 warga (2 di kelurahan target, 1 di kelurahan berbeda)
        $warga1 = User::factory()->create(['peran' => 'warga', 'kelurahan_id' => $kelurahan->id, 'status_akun' => 'aktif']);
        $warga2 = User::factory()->create(['peran' => 'warga', 'kelurahan_id' => $kelurahan->id, 'status_akun' => 'aktif']);
        $wargaLuar = User::factory()->create(['peran' => 'warga', 'kelurahan_id' => $kelurahanLain->id, 'status_akun' => 'aktif']);

        // Buat petugas instansi
        $petugas = User::factory()->instansi($instansi->id)->create(['status_akun' => 'aktif']);

        $kategori = Kategori::first() ?? Kategori::create([
            'nama' => 'Infrastruktur Jalan',
            'slug' => 'infrastruktur-jalan',
            'deskripsi' => 'Kerusakan jalan',
            'aktif' => true,
        ]);

        DB::statement("SET LOCAL jagains.izin_status = 'on'");

        $laporan = Laporan::create([
            'nomor_tiket' => 'JAG-NOTIF-001',
            'pelapor_id' => $warga1->id,
            'kategori_id' => $kategori->id,
            'instansi_id' => $instansi->id,
            'kelurahan_id' => $kelurahan->id,
            'judul' => 'Lampu PJU Rusak',
            'keterangan' => 'Lampu PJU padam di malam hari',
            'keparahan' => 'sedang',
            'lokasi_sumber' => 'manual',
            'lintang' => -6.402484,
            'bujur' => 106.794240,
            'status' => 'MENUNGGU_VERIFIKASI',
            'disembunyikan' => false,
        ]);

        $service = app(NotifikasiService::class);

        // Broadcast ke warga kelurahan
        $terkirim = $service->kirimBroadcastKelurahan($kelurahan->id, $laporan, 'Perbaikan butuh verifikasi.');
        $this->assertEquals(2, $terkirim);

        // Verifikasi warga1 dan warga2 menerima notifikasi, wargaLuar tidak
        $this->assertEquals(1, Notifikasi::where('pengguna_id', $warga1->id)->count());
        $this->assertEquals(1, Notifikasi::where('pengguna_id', $warga2->id)->count());
        $this->assertEquals(0, Notifikasi::where('pengguna_id', $wargaLuar->id)->count());

        // Kirim ke instansi
        $terkirimInstansi = $service->kirimKeInstansi($laporan, 'PERINTAH_AUDITOR', 'Perintah perbaikan baru.');
        $this->assertEquals(1, $terkirimInstansi);
        $this->assertEquals(1, Notifikasi::where('pengguna_id', $petugas->id)->count());
    }
}

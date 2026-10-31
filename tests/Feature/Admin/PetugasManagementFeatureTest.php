<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\User;
use App\Models\Wilayah;
use Database\Seeders\WilayahSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PetugasManagementFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        if (Wilayah::count() === 0) {
            $this->seed(WilayahSeeder::class);
        }
    }

    public function test_admin_dapat_melihat_daftar_petugas(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/petugas');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/petugas')
            ->has('daftarPetugas')
            ->has('daftarInstansi')
        );
    }

    public function test_admin_dapat_membuat_akun_petugas_instansi(): void
    {
        $admin = User::factory()->admin()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Perhubungan Pengujian',
            'singkatan' => 'DISHUB_TEST',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $response = $this->actingAs($admin)->post('/admin/petugas', [
            'username' => 'petugas_dishub_baru',
            'peran' => 'instansi',
            'instansi_id' => $instansi->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('sandi_baru');

        $user = User::where('username', 'petugas_dishub_baru')->first();
        $this->assertNotNull($user);
        $this->assertEquals('instansi', $user->peran);
        $this->assertEquals($instansi->id, $user->instansi_id);
        $this->assertNull($user->email_hash);
        $this->assertNull($user->kelurahan_id);
        $this->assertTrue($user->wajib_ganti_sandi);

        // Verifikasi audit log
        $audit = AuditLog::where('objek_id', $user->id)
            ->where('aksi', 'BUAT_AKUN_PETUGAS')
            ->first();
        $this->assertNotNull($audit);
        $this->assertEquals($admin->id, $audit->pelaku_id);
    }

    public function test_admin_dapat_membuat_akun_auditor(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/petugas', [
            'username' => 'auditor_baru_01',
            'peran' => 'auditor',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('sandi_baru');

        $user = User::where('username', 'auditor_baru_01')->first();
        $this->assertNotNull($user);
        $this->assertEquals('auditor', $user->peran);
        $this->assertNull($user->instansi_id);
        $this->assertNull($user->email_hash);
        $this->assertNull($user->kelurahan_id);
        $this->assertTrue($user->wajib_ganti_sandi);
    }

    public function test_admin_dapat_mereset_kata_sandi_petugas(): void
    {
        $admin = User::factory()->admin()->create();
        $kota = Wilayah::where('tingkat', 'kota')->first() ?? Wilayah::first();

        $instansi = Instansi::create([
            'nama' => 'Dinas Kesehatan Pengujian',
            'singkatan' => 'DINKES_TEST',
            'wilayah_id' => $kota->id,
            'aktif' => true,
        ]);

        $petugas = User::factory()->instansi()->create([
            'instansi_id' => $instansi->id,
            'wajib_ganti_sandi' => false,
        ]);

        $oldPasswordHash = $petugas->password;

        $response = $this->actingAs($admin)->post("/admin/petugas/{$petugas->id}/reset-sandi");

        $response->assertRedirect();
        $response->assertSessionHas('sandi_baru');
        $sandiBaru = session('sandi_baru');
        $this->assertIsString($sandiBaru);
        $this->assertGreaterThanOrEqual(12, strlen($sandiBaru));

        $petugasSegar = $petugas->fresh();
        $this->assertTrue($petugasSegar->wajib_ganti_sandi);
        $this->assertNotEquals($oldPasswordHash, $petugasSegar->password);
        $this->assertTrue(Hash::check($sandiBaru, $petugasSegar->password));

        // Verifikasi audit log
        $audit = AuditLog::where('objek_id', $petugas->id)
            ->where('aksi', 'RESET_SANDI_PETUGAS')
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_admin_dapat_mengubah_status_aktif_nonaktif_petugas(): void
    {
        $admin = User::factory()->admin()->create();
        $auditor = User::factory()->auditor()->create([
            'status_akun' => 'aktif',
        ]);

        $response = $this->actingAs($admin)->patch("/admin/petugas/{$auditor->id}/toggle-status");

        $response->assertRedirect();
        $this->assertEquals('nonaktif', $auditor->fresh()->status_akun);

        // Toggle kembali
        $this->actingAs($admin)->patch("/admin/petugas/{$auditor->id}/toggle-status");
        $this->assertEquals('aktif', $auditor->fresh()->status_akun);

        // Verifikasi audit log
        $audit = AuditLog::where('objek_id', $auditor->id)
            ->where('aksi', 'UBAH_STATUS_PETUGAS')
            ->first();
        $this->assertNotNull($audit);
    }
}

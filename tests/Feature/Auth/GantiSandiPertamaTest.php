<?php

namespace Tests\Feature\Auth;

use App\Models\AuditLog;
use App\Models\Instansi;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GantiSandiPertamaTest extends TestCase
{
    use DatabaseTransactions;

    public function test_petugas_dengan_wajib_ganti_sandi_tidak_bisa_membuka_halaman_lain()
    {
        $instansi = Instansi::factory()->create();
        $petugas = User::factory()->instansi($instansi->id)->wajibGantiSandi()->create();

        $response = $this->actingAs($petugas)->get('/instansi/antrean');
        $response->assertRedirect('/ganti-sandi-pertama');
    }

    public function test_ganti_sandi_pertama_menolak_sandi_baru_yang_sama_dengan_sandi_awal()
    {
        $instansi = Instansi::factory()->create();
        $petugas = User::factory()->instansi($instansi->id)->wajibGantiSandi()->create([
            'password' => bcrypt('InitialRandomPass123'),
        ]);

        $response = $this->actingAs($petugas)->post('/ganti-sandi-pertama', [
            'current_password' => 'InitialRandomPass123',
            'new_password' => 'InitialRandomPass123',
            'new_password_confirmation' => 'InitialRandomPass123',
        ]);

        $response->assertSessionHasErrors('new_password');
    }

    public function test_berhasil_ganti_sandi_pertama_dan_mencatat_audit_log()
    {
        $instansi = Instansi::factory()->create();
        $petugas = User::factory()->instansi($instansi->id)->wajibGantiSandi()->create([
            'password' => bcrypt('InitialRandomPass123'),
        ]);

        $response = $this->actingAs($petugas)->post('/ganti-sandi-pertama', [
            'current_password' => 'InitialRandomPass123',
            'new_password' => 'SandiBaruKuat456!',
            'new_password_confirmation' => 'SandiBaruKuat456!',
        ]);

        $response->assertRedirect('/instansi/antrean');
        $petugas->refresh();

        $this->assertFalse($petugas->wajib_ganti_sandi);
        $this->assertTrue(Hash::check('SandiBaruKuat456!', $petugas->password));

        // Verifikasi audit log tercatat (NFR-INT-01 / FR-AKN-05)
        $audit = AuditLog::where('pelaku_id', $petugas->id)
            ->where('aksi', 'GANTI_SANDI_PERTAMA')
            ->first();

        $this->assertNotNull($audit);
        $this->assertEquals('User', $audit->objek_tipe);
        $this->assertEquals($petugas->id, $audit->objek_id);
    }
}

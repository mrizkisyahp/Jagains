<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class KelurahanWargaTest extends TestCase
{
    use DatabaseTransactions;

    public function test_halaman_profil_warga_menampilkan_status_kelurahan_saat_ini()
    {
        $kelurahan = Wilayah::factory()->kelurahan()->create(['nama' => 'Kemiri Muka']);
        $warga = User::factory()->create([
            'username' => 'wargaprofil',
            'peran' => 'warga',
            'kelurahan_id' => $kelurahan->id,
            'email_hash' => hash('sha256', 'wargaprofil@gmail.com'),
            'kelurahan_diubah_pada' => now()->subDays(10),
        ]);

        $response = $this->actingAs($warga)->get('/warga/profil');
        $response->assertOk();
    }

    public function test_penggantian_kelurahan_ditolak_jika_belum_90_hari()
    {
        $kel1 = Wilayah::factory()->kelurahan()->create(['nama' => 'Pancoran Mas']);
        $kel2 = Wilayah::factory()->kelurahan()->create(['nama' => 'Beji']);

        $warga = User::factory()->create([
            'username' => 'wargadepok1',
            'peran' => 'warga',
            'kelurahan_id' => $kel1->id,
            'email_hash' => hash('sha256', 'warga1@gmail.com'),
            'kelurahan_diubah_pada' => now()->subDays(30), // Baru 30 hari (kurang dari 90 hari)
        ]);

        $response = $this->actingAs($warga)->post('/warga/kelurahan', [
            'kelurahan_id' => $kel2->id,
        ]);

        $response->assertSessionHasErrors('kelurahan_id');

        $this->assertStringContainsString('90 hari', session('errors')->first('kelurahan_id'));
        $warga->refresh();
        $this->assertEquals($kel1->id, $warga->kelurahan_id);
    }

    public function test_penggantian_kelurahan_berhasil_jika_sudah_90_hari()
    {
        $kel1 = Wilayah::factory()->kelurahan()->create(['nama' => 'Pancoran Mas']);
        $kel2 = Wilayah::factory()->kelurahan()->create(['nama' => 'Beji']);

        $warga = User::factory()->create([
            'username' => 'wargadepok2',
            'peran' => 'warga',
            'kelurahan_id' => $kel1->id,
            'email_hash' => hash('sha256', 'warga2@gmail.com'),
            'kelurahan_diubah_pada' => now()->subDays(91), // Sudah lebih dari 90 hari
        ]);

        $response = $this->actingAs($warga)->post('/warga/kelurahan', [
            'kelurahan_id' => $kel2->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $warga->refresh();
        $this->assertEquals($kel2->id, $warga->kelurahan_id);
        $this->assertTrue($warga->kelurahan_diubah_pada->isToday());
    }

    public function test_penggantian_kelurahan_menolak_kelurahan_yang_sama()
    {
        $kel1 = Wilayah::factory()->kelurahan()->create(['nama' => 'Pancoran Mas']);

        $warga = User::factory()->create([
            'username' => 'wargadepok3',
            'peran' => 'warga',
            'kelurahan_id' => $kel1->id,
            'email_hash' => hash('sha256', 'warga3@gmail.com'),
            'kelurahan_diubah_pada' => now()->subDays(100),
        ]);

        $response = $this->actingAs($warga)->post('/warga/kelurahan', [
            'kelurahan_id' => $kel1->id,
        ]);

        $response->assertSessionHasErrors('kelurahan_id');
    }
}

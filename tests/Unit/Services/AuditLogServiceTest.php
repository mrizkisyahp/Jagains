<?php

namespace Tests\Unit\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuditLogServiceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_catat_berhasil_menyimpan_log_audit_ke_database(): void
    {
        $admin = User::factory()->admin()->create();

        $log = AuditLogService::catat(
            aksi: 'UBAH_PENGATURAN_SISTEM',
            objekTipe: 'Pengaturan',
            objekId: 1,
            nilaiLama: ['nilai' => '3'],
            nilaiBaru: ['nilai' => '5'],
            alasan: 'Penyesuaian batas SLA respons',
            pelakuId: $admin->id
        );

        $this->assertInstanceOf(AuditLog::class, $log);
        $this->assertDatabaseHas('audit_log', [
            'id' => $log->id,
            'aksi' => 'UBAH_PENGATURAN_SISTEM',
            'pelaku_id' => $admin->id,
            'alasan' => 'Penyesuaian batas SLA respons',
        ]);
        $this->assertEquals(['nilai' => '3'], $log->nilai_lama);
        $this->assertEquals(['nilai' => '5'], $log->nilai_baru);
    }

    public function test_tabel_audit_log_menolak_operasi_update_melalui_trigger_anti_tamper(): void
    {
        $admin = User::factory()->admin()->create();

        $log = AuditLogService::catat(
            aksi: 'BUAT_AKUN_PETUGAS',
            objekTipe: 'User',
            objekId: 2,
            nilaiLama: null,
            nilaiBaru: ['username' => 'petugas_baru'],
            alasan: 'Inisialisasi akun',
            pelakuId: $admin->id
        );

        $this->expectException(QueryException::class);
        $log->update(['alasan' => 'Mencoba memalsukan jejak audit']);
    }

    public function test_tabel_audit_log_menolak_operasi_delete_melalui_trigger_anti_tamper(): void
    {
        $admin = User::factory()->admin()->create();

        $log = AuditLogService::catat(
            aksi: 'BUAT_AKUN_PETUGAS',
            objekTipe: 'User',
            objekId: 3,
            nilaiLama: null,
            nilaiBaru: ['username' => 'petugas_lain'],
            alasan: 'Inisialisasi akun',
            pelakuId: $admin->id
        );

        $this->expectException(QueryException::class);
        $log->delete();
    }
}

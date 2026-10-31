<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AuditLogViewerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_dan_auditor_dapat_melihat_log_audit(): void
    {
        $admin = User::factory()->admin()->create();
        $auditor = User::factory()->auditor()->create();

        AuditLogService::catat(
            aksi: 'UBAH_PENGATURAN_SISTEM',
            objekTipe: 'Pengaturan',
            objekId: 1,
            nilaiLama: null,
            nilaiBaru: ['test' => 1],
            alasan: 'Uji coba audit log viewer',
            pelakuId: $admin->id
        );

        // 1. Admin melihat /admin/audit-log
        $resAdmin = $this->actingAs($admin)->get('/admin/audit-log');
        $resAdmin->assertOk();
        $resAdmin->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/audit-log')
            ->has('logs.data')
            ->has('filters')
        );

        // 2. Auditor melihat /auditor/audit-log
        $resAuditor = $this->actingAs($auditor)->get('/auditor/audit-log');
        $resAuditor->assertOk();
        $resAuditor->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auditor/audit-log')
            ->has('logs.data')
            ->has('filters')
        );
    }

    public function test_warga_dan_guest_ditolak_mengakses_log_audit(): void
    {
        $warga = User::factory()->warga()->create();

        $this->get('/admin/audit-log')->assertRedirect('/login');
        $this->actingAs($warga)->get('/admin/audit-log')->assertForbidden();
        $this->actingAs($warga)->get('/auditor/audit-log')->assertForbidden();
    }

    public function test_filter_audit_log_berfungsi_dengan_benar(): void
    {
        $admin = User::factory()->admin()->create();

        AuditLogService::catat(
            aksi: 'DISPOSISI_ROUTING_MANUAL',
            objekTipe: 'Laporan',
            objekId: 10,
            alasan: 'Disposisi khusus filter',
            pelakuId: $admin->id
        );

        $response = $this->actingAs($admin)->get('/admin/audit-log?aksi=DISPOSISI_ROUTING_MANUAL');
        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/audit-log')
            ->where('filters.aksi', 'DISPOSISI_ROUTING_MANUAL')
        );
    }
}

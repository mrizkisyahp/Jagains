import { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AuditLogFilterBar from '@/components/admin/AuditLogFilterBar';
import AuditLogTable from '@/components/admin/AuditLogTable';
import { AuditLogItem, AuditLogFilterState, PaginatedData } from '@/types/audit';
import { ShieldCheck } from 'lucide-react';

interface AuditLogPageProps {
    logs: PaginatedData<AuditLogItem>;
    filters: AuditLogFilterState;
    daftarAksi: string[];
}

export default function AuditLogPage({ logs, filters, daftarAksi }: AuditLogPageProps) {
    return (
        <div className="space-y-6 w-full min-w-0">
            <Head title="Log Audit Sistem - Jagains Admin" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Log Audit Sistem
                    </h1>
                    <p className="text-sm text-slate-500">
                        Pencatatan riwayat append-only terlindungi pemicu basis data. Operasi manipulasi (UPDATE, DELETE, TRUNCATE) ditolak mutlak (FR-ADM-07).
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Append-Only Immutability Terproteksi</span>
                </div>
            </div>

            {/* Filter Bar */}
            <AuditLogFilterBar
                filters={filters}
                daftarAksi={daftarAksi}
                routeUrl="/admin/audit-log"
            />

            {/* Audit Log Table */}
            <AuditLogTable logs={logs} />
        </div>
    );
}

AuditLogPage.layout = (page: ReactNode) => (
    <InternalLayout title="Log Audit Sistem" breadcrumb="Admin > Sistem > Log Audit">
        {page}
    </InternalLayout>
);

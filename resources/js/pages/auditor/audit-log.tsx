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

export default function AuditorAuditLogPage({ logs, filters, daftarAksi }: AuditLogPageProps) {
    return (
        <div className="space-y-6 w-full min-w-0">
            <Head title="Log Audit Pengawasan - Jagains Auditor" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Log Audit Pengawasan
                    </h1>
                    <p className="text-sm text-slate-500">
                        Inspeksi seluruh mutasi status, alur disposisi, pembuatan kredensial, dan intervensi investigasi.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-3.5 py-1.5 text-xs font-semibold text-purple-800">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span>Pengawasan Ombudsman</span>
                </div>
            </div>

            {/* Filter Bar */}
            <AuditLogFilterBar
                filters={filters}
                daftarAksi={daftarAksi}
                routeUrl="/auditor/audit-log"
            />

            {/* Audit Log Table */}
            <AuditLogTable logs={logs} />
        </div>
    );
}

AuditorAuditLogPage.layout = (page: ReactNode) => (
    <InternalLayout title="Log Audit Pengawasan" breadcrumb="Auditor > Pengawasan > Log Audit">
        {page}
    </InternalLayout>
);

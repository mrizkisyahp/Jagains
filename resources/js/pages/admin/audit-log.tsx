import { type ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AuditLogFilterBar from '@/components/admin/AuditLogFilterBar';
import AuditLogTable from '@/components/admin/AuditLogTable';
import {
    AuditLogFilterState,
    AuditLogItem,
    PaginatedData,
} from '@/types/audit';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLogPageProps {
    logs: PaginatedData<AuditLogItem>;
    filters: AuditLogFilterState;
    daftarAksi: string[];
}

export default function AuditLogPage({
    logs,
    filters,
    daftarAksi,
}: AuditLogPageProps) {
    return (
        <div className="w-full min-w-0 space-y-6">
            <Head title="Log Audit Sistem - Jagains Admin" />

            {/* Header & Immutability Indicator */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-body-large font-display font-semibold text-foreground">
                        Log Audit Forensik Sistem
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Pencatatan riwayat append-only terlindungi pemicu basis
                        data untuk transparansi dan akuntabilitas tindakan.
                    </p>
                </div>
                <div>
                    <Badge
                        variant="outline"
                        className="gap-1.5 border-border bg-muted/40 py-1 text-caption-xs text-foreground"
                    >
                        <ShieldCheck
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span className="hidden sm:inline">
                            Append-Only Immutability Terproteksi
                        </span>
                        <span className="sm:hidden">Append-Only</span>
                    </Badge>
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
    <InternalLayout title="Log Audit" breadcrumb="Admin > Sistem > Log Audit">
        {page}
    </InternalLayout>
);

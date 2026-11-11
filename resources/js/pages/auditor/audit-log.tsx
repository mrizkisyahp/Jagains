import { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AuditorAuditLogCard from '@/components/auditor/AuditorAuditLogCard';
import {
    AuditLogItem,
    AuditLogFilterState,
    PaginatedData,
} from '@/types/audit';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLogPageProps {
    logs: PaginatedData<AuditLogItem>;
    filters: AuditLogFilterState;
    daftarAksi: string[];
}

export default function AuditorAuditLogPage({
    logs,
    filters,
    daftarAksi,
}: AuditLogPageProps) {
    return (
        <div className="w-full min-w-0 space-y-6">
            <Head title="Log audit pengawasan" />

            {/* Header Konteks */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-display-sm font-display font-semibold tracking-tight text-foreground">
                        Log Audit Pengawasan
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Inspeksi seluruh mutasi status, alur disposisi,
                        pembuatan kredensial, dan intervensi investigasi.
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className="h-8 gap-1.5 border-border bg-muted/40 px-3 py-1 text-caption-xs text-foreground"
                >
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <span>Pengawasan Independen</span>
                </Badge>
            </div>

            {/* Card Terpadu: Filter di Header Card, Tabel di Body, Paginasi di Footer */}
            <AuditorAuditLogCard
                logs={logs}
                filters={filters}
                daftarAksi={daftarAksi}
            />
        </div>
    );
}

AuditorAuditLogPage.layout = (page: ReactNode) => (
    <InternalLayout
        title="Log audit pengawasan"
        breadcrumb="Auditor > Log audit"
    >
        {page}
    </InternalLayout>
);

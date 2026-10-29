import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AuditorAuditLogPage() {
    return (
        <BlankPanel
            title="Log Audit Pengawasan"
            requirementCode="FR-ADM-07 / FR-ADM-08"
            description="Peninjauan log audit independen dan otorisasi pemeriksaan identitas pelapor pada tiket spesifik dengan kewajiban input alasan formal."
        />
    );
}

AuditorAuditLogPage.layout = (page: ReactNode) => (
    <InternalLayout title="Log Audit" breadcrumb="Auditor > Pengawasan">
        {page}
    </InternalLayout>
);

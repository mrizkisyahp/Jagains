import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AuditLogPage() {
    return (
        <BlankPanel
            title="Log Audit Sistem"
            requirementCode="FR-ADM-07"
            description="Pencatatan riwayat audit tak dapat diubah (append-only) untuk seluruh aktivitas administratif, perubahan konfigurasi, dan pembuatan akun."
        />
    );
}

AuditLogPage.layout = (page: ReactNode) => (
    <InternalLayout title="Log Audit" breadcrumb="Admin > Sistem">
        {page}
    </InternalLayout>
);

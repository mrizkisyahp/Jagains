import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function KonfigurasiPage() {
    return (
        <BlankPanel
            title="Parameter & Aturan Sistem"
            requirementCode="FR-ADM-02 / FR-ADM-03"
            description="Konfigurasi parameter batas waktu SLA kerja, formula kuorum voting verifikasi warga, dan matriks pemetaan routing."
        />
    );
}

KonfigurasiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Parameter" breadcrumb="Admin > Pengaturan">
        {page}
    </InternalLayout>
);

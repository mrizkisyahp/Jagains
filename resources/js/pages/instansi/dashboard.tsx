import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function DashboardInstansiPage() {
    return (
        <BlankPanel
            title="Dashboard Kinerja"
            requirementCode="FR-DSH-02"
            description="Ringkasan indikator kinerja instansi teknis: tiket berjalan, kepatuhan batas waktu SLA, dan rasio ketepatan pemenuhan janji target anggaran."
        />
    );
}

DashboardInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Dashboard Kinerja" breadcrumb="Instansi > Analitik">
        {page}
    </InternalLayout>
);

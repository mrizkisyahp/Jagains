import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AntreanInstansiPage() {
    return (
        <BlankPanel
            title="Antrean Tiket"
            requirementCode="FR-TIK-02"
            description="Daftar laporan masyarakat yang dialirkan ke instansi teknis Anda, diurutkan berdasarkan batas waktu SLA paling mendesak."
        />
    );
}

AntreanInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean Tiket" breadcrumb="Instansi > Operasional">
        {page}
    </InternalLayout>
);

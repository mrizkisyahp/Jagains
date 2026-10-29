import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AntreanRoutingPage() {
    return (
        <BlankPanel
            title="Perlu Routing"
            requirementCode="FR-ADM-05"
            description="Antrean tiket laporan masyarakat yang membutuhkan penetapan instansi teknis penanggung jawab secara manual."
        />
    );
}

AntreanRoutingPage.layout = (page: ReactNode) => (
    <InternalLayout title="Perlu Routing" breadcrumb="Admin > Operasional">
        {page}
    </InternalLayout>
);

import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AntreanAuditorPage() {
    return (
        <BlankPanel
            title="Antrean Eskalasi"
            requirementCode="FR-AUD-01 / FR-AUD-02"
            description="Penanganan eskalasi tiket terbuka akibat keterlambatan SLA, sanggahan dinas, sengketa warga berulang, atau ketiadaan kuorum verifikasi."
        />
    );
}

AntreanAuditorPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean Eskalasi" breadcrumb="Auditor > Eskalasi">
        {page}
    </InternalLayout>
);

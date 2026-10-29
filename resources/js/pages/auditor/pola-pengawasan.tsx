import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function PolaPengawasanPage() {
    return (
        <BlankPanel
            title="Pola Pengawasan"
            requirementCode="FR-AUD-03"
            description="Analitik pola pengalihan tiket, rasio penolakan laporan antarinstansi, serta evaluasi komitmen anggaran perbaikan fisik."
        />
    );
}

PolaPengawasanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Pola Pengawasan" breadcrumb="Auditor > Analitik">
        {page}
    </InternalLayout>
);

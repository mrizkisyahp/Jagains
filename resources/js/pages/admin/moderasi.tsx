import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function ModerasiPage() {
    return (
        <BlankPanel
            title="Moderasi Konten"
            requirementCode="FR-ADM-06"
            description="Peninjauan laporan warga terhadap konten atau foto yang melanggar ketentuan dan potensi pembekuan akun."
        />
    );
}

ModerasiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Moderasi Konten" breadcrumb="Admin > Moderasi">
        {page}
    </InternalLayout>
);

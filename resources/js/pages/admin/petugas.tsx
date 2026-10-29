import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function PetugasPage() {
    return (
        <BlankPanel
            title="Manajemen Akun Staf"
            requirementCode="FR-ADM-04"
            description="Pengelolaan akun petugas Instansi Teknis dan Auditor: pendaftaran, penugasan dinas, dan pengaturan kredensial."
        />
    );
}

PetugasPage.layout = (page: ReactNode) => (
    <InternalLayout title="Akun Staf" breadcrumb="Admin > Manajemen">
        {page}
    </InternalLayout>
);

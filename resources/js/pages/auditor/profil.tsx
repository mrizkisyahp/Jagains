import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function AuditorProfilPage() {
    return (
        <BlankPanel
            title="Profil Auditor"
            requirementCode="FR-AKN-05"
            description="Informasi akun petugas pengawas independen dan pembaruan kata sandi akses operasional."
        />
    );
}

AuditorProfilPage.layout = (page: ReactNode) => (
    <InternalLayout title="Profil Auditor" breadcrumb="Auditor > Akun">
        {page}
    </InternalLayout>
);

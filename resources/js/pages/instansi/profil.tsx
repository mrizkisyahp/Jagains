import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function ProfilInstansiPage() {
    return (
        <BlankPanel
            title="Profil Dinas Instansi"
            requirementCode="FR-AKN-05"
            description="Detail informasi akun petugas, identitas dinas teknis naungan, dan pembaharuan kata sandi akun operasional."
        />
    );
}

ProfilInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Profil Dinas" breadcrumb="Instansi > Akun">
        {page}
    </InternalLayout>
);

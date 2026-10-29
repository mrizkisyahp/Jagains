import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function SengketaInstansiPage() {
    return (
        <BlankPanel
            title="Tiket Sengketa"
            requirementCode="FR-VER-06"
            description="Tiket yang disengketakan oleh kuorum warga sekitar. Pilih tindakan dalam 7 hari kerja: kerjakan ulang perbaikan atau ajukan sanggahan resmi."
        />
    );
}

SengketaInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Tiket Sengketa" breadcrumb="Instansi > Sengketa">
        {page}
    </InternalLayout>
);

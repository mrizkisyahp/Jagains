import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function PetaLaporanPage() {
    return (
        <BlankPanel
            title="Peta Laporan Fasilitas"
            requirementCode="FR-PET-01 / FR-PET-02"
            description="Peta interaktif sebaran laporan kerusakan fasilitas publik di Kota Depok dengan indikator batas waktu SLA dan status tindak lanjut."
        />
    );
}

PetaLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Peta Laporan" breadcrumb="Warga > Peta">
        {page}
    </InternalLayout>
);

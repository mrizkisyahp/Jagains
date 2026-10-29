import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function LaporKerusakanPage() {
    return (
        <BlankPanel
            title="Laporkan Kerusakan Fasilitas"
            requirementCode="FR-LAP-01 s.d. FR-LAP-05"
            description="Formulir pelaporan kerusakan fasilitas publik: foto kamera langsung (anti-EXIF), titik GPS interaktif, kategori kerusakan, dan deteksi laporan serupa."
        />
    );
}

LaporKerusakanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Laporkan Kerusakan" breadcrumb="Warga > Lapor">
        {page}
    </InternalLayout>
);

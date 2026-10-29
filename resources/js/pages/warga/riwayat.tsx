import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function RiwayatLaporanPage() {
    return (
        <BlankPanel
            title="Riwayat Laporan & Dukungan"
            requirementCode="FR-LAP-01 / FR-INT-01"
            description="Daftar laporan fasilitas yang Anda ajukan atau dukung beserta status pengerjaan fisik dan penghitung mundur batas waktu layanan."
        />
    );
}

RiwayatLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Riwayat Laporan" breadcrumb="Warga > Riwayat">
        {page}
    </InternalLayout>
);

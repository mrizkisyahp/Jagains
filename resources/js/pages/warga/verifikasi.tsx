import { ReactNode } from 'react';
import InternalLayout from '@/layouts/InternalLayout';
import BlankPanel from '@/components/common/BlankPanel';

export default function VerifikasiWargaPage() {
    return (
        <BlankPanel
            title="Verifikasi Hasil Perbaikan"
            requirementCode="FR-VER-01 s.d. FR-VER-04"
            description="Antrean tiket yang telah diajukan selesai oleh instansi di kelurahan Anda. Berikan konfirmasi suara Jalur A (kamera di lokasi + GPS) atau Jalur B."
        />
    );
}

VerifikasiWargaPage.layout = (page: ReactNode) => (
    <InternalLayout title="Verifikasi Warga" breadcrumb="Warga > Verifikasi">
        {page}
    </InternalLayout>
);

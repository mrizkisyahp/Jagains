import { Head } from '@inertiajs/react';
import { MasterFilterPeta } from '@/types/peta';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import AlurSection from '@/components/landing/AlurSection';
import PilarSection from '@/components/landing/PilarSection';
import PrivasiSection from '@/components/landing/PrivasiSection';
import KinerjaSection from '@/components/landing/KinerjaSection';
import CtaBannerSection from '@/components/landing/CtaBannerSection';
import LandingFooter from '@/components/landing/LandingFooter';

interface LandingPageProps {
    masterFilter: MasterFilterPeta;
}

export default function LandingPage({ masterFilter }: LandingPageProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>
                    Jagains — Platform Pengawasan Fasilitas Publik Jabodetabek
                </title>
                <meta
                    name="description"
                    content="Lapor kerusakan fasilitas publik di sekitarmu, pantau janji instansi secara terbuka, dan pastikan sendiri hasilnya bersama kuorum warga Jabodetabek."
                />
            </Head>

            {/* 1. Header & Navigasi Publik */}
            <LandingNavbar />

            <main className="flex-1">
                {/* 2. Hero Section: "Lapor. Pantau. Pastikan." + Peta Interaktif Leaflet + Filter Minimalis */}
                <HeroSection masterFilter={masterFilter} />

                {/* 3. Seksi 4 Langkah: "4 Langkah Mudah, Suara Anda yang Menentukan" */}
                <AlurSection />

                {/* 4. Seksi 3 Pilar Transparansi: "Tiada Laporan Sepihak" */}
                <PilarSection />

                {/* 5. Seksi Keamanan & Anonimitas: "Suara Anda Terdengar, Identitas Anda Terkunci Aman" */}
                <PrivasiSection />

                {/* 6. Seksi Metrik Kinerja: "Ukur Kinerja Layanan Publik Berbasis Data Nyata" */}
                <KinerjaSection statistik={masterFilter?.statistik} />

                {/* 7. Banner Call to Action Bawah: "Lihat kerusakan di sekitar Anda? Laporkan sekarang." */}
                <CtaBannerSection />
            </main>

            {/* 9. Footer Publik */}
            <LandingFooter />
        </div>
    );
}

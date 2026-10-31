import { Head } from '@inertiajs/react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import BantuanPrivasiContent from '@/components/landing/BantuanPrivasiContent';

interface BantuanPageProps {
    transparansiData: {
        disimpan: string[];
        tidakDisimpan: string[];
        batasDiakui: string[];
    };
}

export default function BantuanPage({ transparansiData }: BantuanPageProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Head title="Bantuan & Kebijakan Privasi - Jagains" />

            <LandingNavbar />

            <main className="flex-1 py-12 sm:py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <BantuanPrivasiContent transparansiData={transparansiData} />
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}

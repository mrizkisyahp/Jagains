import { useState } from 'react';
import { Head } from '@inertiajs/react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import DashboardFilterTabs from '@/components/dashboard/DashboardFilterTabs';
import DashboardComparisonTable from '@/components/dashboard/DashboardComparisonTable';
import {
    MatriksKinerjaRow,
    PeriodeDashboard,
    SegmenDashboard,
} from '@/types/dashboard';
import { TrendingUp, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DashboardPageProps {
    dataKecamatan: MatriksKinerjaRow[];
    dataInstansi: MatriksKinerjaRow[];
    periodeAktif: PeriodeDashboard;
    ambangBatas: number;
}

export default function DashboardPage({
    dataKecamatan,
    dataInstansi,
    periodeAktif,
    ambangBatas,
}: DashboardPageProps) {
    const [segmen, setSegmen] = useState<SegmenDashboard>('kecamatan');

    // Ringkasan Agregat Seluruh Wilayah
    const totalSemuaTiket = dataKecamatan.reduce(
        (acc, k) => acc + k.total_tiket,
        0,
    );
    const totalTiketSelesai = dataKecamatan.reduce(
        (acc, k) => acc + k.tiket_selesai,
        0,
    );
    const totalAnggaranGantung = dataKecamatan.reduce(
        (acc, k) => acc + k.anggaran_menggantung_total,
        0,
    );

    const activeRows = segmen === 'kecamatan' ? dataKecamatan : dataInstansi;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Head title="Dashboard Komparasi Kinerja Publik - Jagains" />

            <LandingNavbar />

            <main className="flex-1 py-10 sm:py-14 lg:py-16">
                <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
                    {/* Header Deskripsi */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-caption-xs font-semibold text-primary">
                            <TrendingUp className="size-3.5" />
                            <span>
                                Dashboard Objektif Akuntabilitas Publik
                            </span>
                        </div>
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                            Komparasi Kinerja Layanan Publik Jabodetabek
                        </h1>
                        <p className="max-w-3xl text-body-base leading-relaxed text-muted-foreground">
                            Peringkat dan evaluasi komparatif performa
                            penanganan fasilitas publik antarkecamatan dan
                            antarinstansi perangkat daerah berbasis data riil
                            tanpa manipulasi.
                        </p>
                    </div>

                    {/* Ringkasan KPI Kota */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DashboardMetricCard
                            title="Total Aduan Masuk"
                            value={totalSemuaTiket.toString()}
                            description="Akumulasi seluruh aduan fasilitas publik yang masuk ke sistem"
                            icon={Clock}
                            colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        />
                        <DashboardMetricCard
                            title="Telah Diselesaikan"
                            value={totalTiketSelesai.toString()}
                            description="Aduan sah disetujui kuorum warga atau putusan auditor"
                            icon={CheckCircle2}
                            colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        />
                        <DashboardMetricCard
                            title="Anggaran Menggantung"
                            value={totalAnggaranGantung.toString()}
                            description="Tiket beranggaran yang melewati tanggal target awal"
                            icon={TrendingUp}
                            colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        />
                        <DashboardMetricCard
                            title="Audit Privasi"
                            value="100%"
                            description="Seluruh metrik agregat terhitung tanpa mengekspos data pribadi"
                            icon={ShieldCheck}
                            colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        />
                    </div>

                    {/* Filter Bar & Tabs */}
                    <DashboardFilterTabs
                        segmenAktif={segmen}
                        onSelectSegmen={setSegmen}
                        periodeAktif={periodeAktif}
                    />

                    {/* Tabel Perbandingan */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-caption-xs text-muted-foreground">
                            <span>
                                Menampilkan perbandingan{' '}
                                <strong>{activeRows.length}</strong>{' '}
                                {segmen === 'kecamatan'
                                    ? 'Kecamatan di Jabodetabek'
                                    : 'Instansi Perangkat Daerah'}
                            </span>
                            <span>
                                Klik pada judul kolom tabel untuk mengurutkan
                                nilai
                            </span>
                        </div>
                        <DashboardComparisonTable
                            rows={activeRows}
                            ambangBatas={ambangBatas}
                        />
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}

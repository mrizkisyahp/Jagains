import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, MapPin, Clock, AlertTriangle } from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';
import InstansiTrenKecepatanChart from '@/components/instansi/InstansiTrenKecepatanChart';
import InstansiIndikatorCards from '@/components/instansi/InstansiIndikatorCards';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const InstansiOverviewMap = lazy(
    () => import('@/components/instansi/InstansiOverviewMap'),
);

interface AntreanTiketItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    status: string;
    kelurahan: string;
    kategori?: string | null;
    sisa_hari?: number | null;
    sisa_hari_sla?: number | null;
    is_lewat_sla: boolean;
    urgensi?: string;
    lintang: number | null;
    bujur: number | null;
}

interface MapPointItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    status: string;
    lat: number;
    lng: number;
}

interface DashboardInstansiProps {
    instansi?: {
        id: number;
        nama: string;
        singkatan?: string | null;
    };
    statistik: {
        tiket_aktif: number;
        menunggu_verifikasi: number;
        perbaikan_disengketa: number;
        lewat_sla: number;
        tiket_selesai: number;
    };
    antrean_tiket: AntreanTiketItem[];
    peta_titik: MapPointItem[];
    indikator_kinerja: {
        janji_ditepati: {
            persen: number;
            label_tingkat: string;
            tepat_waktu: number;
            terlambat: number;
        };
        persentase_verifikasi: {
            persen: number;
            label_tingkat: string;
            diverifikasi: number;
            ditolak: number;
        };
        anggaran_menggantung: {
            total_tiket: number;
            rata_rata_keterlambatan_hari: number;
        };
    };
    tren_kecepatan: {
        labels: string[];
        median_diterima: number[];
        median_selesai: number[];
    };
}

export default function DashboardInstansiPage({
    instansi,
    statistik,
    antrean_tiket,
    peta_titik,
    indikator_kinerja,
    tren_kecepatan,
}: DashboardInstansiProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const formatStat = (num: number) => {
        return (num ?? 0).toLocaleString('id-ID');
    };

    const namaSapaan = instansi?.singkatan || instansi?.nama || 'Instansi';

    return (
        <InternalLayout title="Beranda" breadcrumb="Instansi > Beranda">
            <div className="w-full space-y-8 pb-24">
                <Head title="Beranda Instansi - Jagains" />

                {/* Sapaan Header Sesuai Wireframe */}
                <div className="space-y-1">
                    <h1 className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-sm">
                        Hai {namaSapaan}
                    </h1>
                    <p className="text-body-sm font-medium text-muted-foreground">
                        Selamat Datang di Jagains
                    </p>
                </div>

                {/* 5 Kartu Statistik Utama (Wireframe Gambar 1) */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                    {/* Kartu 1: Tiket Aktif */}
                    <Link
                        href="/instansi/antrean?status=AKTIF"
                        className="group flex min-h-[110px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/40 sm:min-h-[125px] sm:p-5"
                    >
                        <span className="text-caption-xs font-display font-bold text-foreground sm:text-body-sm">
                            Tiket Aktif
                        </span>
                        <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                            {formatStat(statistik?.tiket_aktif ?? 0)}
                        </div>
                    </Link>

                    {/* Kartu 2: Menunggu Verifikasi Warga */}
                    <Link
                        href="/instansi/antrean?status=MENUNGGU_VERIFIKASI"
                        className="group flex min-h-[110px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/40 sm:min-h-[125px] sm:p-5"
                    >
                        <span className="text-caption-xs font-display font-bold text-foreground sm:text-body-sm">
                            Menunggu Verifikasi Warga
                        </span>
                        <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                            {formatStat(statistik?.menunggu_verifikasi ?? 0)}
                        </div>
                    </Link>

                    {/* Kartu 3: Perbaikan Disengketa */}
                    <Link
                        href="/instansi/antrean?status=DISENGKETAKAN"
                        className="group flex min-h-[110px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/40 sm:min-h-[125px] sm:p-5"
                    >
                        <span className="text-caption-xs font-display font-bold text-foreground sm:text-body-sm">
                            Perbaikan Disengketa
                        </span>
                        <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                            {formatStat(statistik?.perbaikan_disengketa ?? 0)}
                        </div>
                    </Link>

                    {/* Kartu 4: Lewat Batas Waktu */}
                    <Link
                        href="/instansi/antrean?status=LEWAT_SLA"
                        className="group flex min-h-[110px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/40 sm:min-h-[125px] sm:p-5"
                    >
                        <span className="text-caption-xs font-display font-bold text-foreground sm:text-body-sm">
                            Lewat Batas Waktu
                        </span>
                        <div className="text-display-xs font-display font-bold tracking-tight text-destructive sm:text-display-md">
                            {formatStat(statistik?.lewat_sla ?? 0)}
                        </div>
                    </Link>

                    {/* Kartu 5: Tiket Selesai */}
                    <Link
                        href="/instansi/antrean?status=SELESAI"
                        className="group col-span-2 flex min-h-[110px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/40 sm:col-span-1 sm:min-h-[125px] sm:p-5"
                    >
                        <span className="text-caption-xs font-display font-bold text-foreground sm:text-body-sm">
                            Tiket Selesai
                        </span>
                        <div className="text-display-xs font-display font-bold tracking-tight text-emerald-600 sm:text-display-md dark:text-emerald-400">
                            {formatStat(statistik?.tiket_selesai ?? 0)}
                        </div>
                    </Link>
                </div>

                {/* BAGIAN 1: LAPORAN (Antrean Tiket Laporan di Kiri, Peta di Kanan) */}
                <div className="space-y-4">
                    <h2 className="text-body-base font-display font-bold text-foreground sm:text-body-lg">
                        Laporan
                    </h2>

                    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
                        {/* Kolom Kiri: Antrean Tiket Laporan (lg:col-span-7) */}
                        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6 lg:col-span-7">
                            <div className="space-y-4">
                                {/* Header Card Antrean */}
                                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                    <h3 className="text-body-base font-display font-bold text-foreground">
                                        Antrean Tiket Laporan
                                    </h3>
                                    <Link
                                        href="/instansi/antrean"
                                        className="inline-flex items-center gap-1.5 text-caption-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:text-body-sm"
                                    >
                                        <span>Lihat lainnya</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>

                                {/* List Tiket Sesuai Wireframe */}
                                {!antrean_tiket ||
                                antrean_tiket.length === 0 ? (
                                    <div className="py-8 text-center text-body-sm text-muted-foreground">
                                        Belum ada tiket aktif dalam antrean.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/60">
                                        {antrean_tiket.map((tiket) => (
                                            <div
                                                key={tiket.id}
                                                onClick={() =>
                                                    router.visit(
                                                        `/tiket/${encodeURIComponent(tiket.nomor_tiket)}`,
                                                    )
                                                }
                                                className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-3.5 transition-colors first:pt-1 last:pb-1 hover:bg-muted/30"
                                            >
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <h4 className="truncate text-body-sm font-display font-bold text-foreground group-hover:underline">
                                                        {tiket.judul}
                                                    </h4>
                                                    <p className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                        <span>
                                                            {tiket.kelurahan}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <InstansiStatusBadge
                                                        status={tiket.status}
                                                    />
                                                    {(() => {
                                                        const sisa =
                                                            tiket.sisa_hari ??
                                                            tiket.sisa_hari_sla;
                                                        if (
                                                            typeof sisa !==
                                                            'number'
                                                        )
                                                            return null;
                                                        return (
                                                            <span
                                                                className={cn(
                                                                    'font-mono text-[11px] font-medium',
                                                                    tiket.is_lewat_sla
                                                                        ? 'font-bold text-destructive'
                                                                        : 'text-muted-foreground',
                                                                )}
                                                            >
                                                                {tiket.is_lewat_sla
                                                                    ? `Lewat: ${sisa} hr`
                                                                    : `Sisa Hari: ${sisa}`}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan: Peta (non-interactable) (lg:col-span-5) */}
                        <div className="flex min-h-[340px] lg:col-span-5">
                            {isMounted ? (
                                <Suspense
                                    fallback={
                                        <div className="size-full min-h-[340px] animate-pulse rounded-2xl border border-border/80 bg-muted/20" />
                                    }
                                >
                                    <InstansiOverviewMap
                                        points={peta_titik ?? []}
                                        className="size-full"
                                    />
                                </Suspense>
                            ) : (
                                <div className="size-full min-h-[340px] animate-pulse rounded-2xl border border-border/80 bg-muted/20" />
                            )}
                        </div>
                    </div>
                </div>

                {/* BAGIAN 2: INDIKATOR KINERJA PELAYANAN (Gambar 2 Wireframe) */}
                <div className="space-y-5 pt-4">
                    <h2 className="text-body-base font-display font-bold text-foreground sm:text-body-lg">
                        Indikator Kinerja Pelayanan
                    </h2>

                    {/* Chart Tren Kecepatan Penanganan */}
                    {tren_kecepatan && (
                        <InstansiTrenKecepatanChart data={tren_kecepatan} />
                    )}

                    {/* 3 Donut & Metrik Cards di Bawah */}
                    {indikator_kinerja && (
                        <InstansiIndikatorCards
                            janjiDitepati={indikator_kinerja.janji_ditepati}
                            persentaseVerifikasi={
                                indikator_kinerja.persentase_verifikasi
                            }
                            anggaranMenggantung={
                                indikator_kinerja.anggaran_menggantung
                            }
                        />
                    )}
                </div>
            </div>
        </InternalLayout>
    );
}

import { useMemo } from 'react';
import { MasterFilterStatistik } from '@/types/peta';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, ResponsiveContainer, XAxis } from 'recharts';
import { ArrowUpRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface KinerjaSectionProps {
    statistik?: MasterFilterStatistik;
}

export default function KinerjaSection({ statistik }: KinerjaSectionProps) {
    // 1. Data Respon Awal (<menit> Rata-rata Respon Awal dari image 15.png)
    const responMenit = statistik?.rata_rata_respon_menit ?? 42;
    const responData = useMemo(() => {
        return (
            statistik?.tren_mingguan?.respon ?? [
                { hari: 'Sen', nilai: 54 },
                { hari: 'Sel', nilai: 48 },
                { hari: 'Rab', nilai: 45 },
                { hari: 'Kam', nilai: 41 },
                { hari: 'Jum', nilai: 38 },
                { hari: 'Sab', nilai: 42 },
                { hari: 'Min', nilai: responMenit },
            ]
        );
    }, [statistik, responMenit]);

    // 2. Data Laporan Terlacak (<%> Laporan Terlacak Real-time dari image 15.png)
    const terlacakPersen = statistik?.persentase_terlacak ?? 100;
    const terlacakData = useMemo(() => {
        return (
            statistik?.tren_mingguan?.terlacak ?? [
                { hari: 'Sen', nilai: 98 },
                { hari: 'Sel', nilai: 99 },
                { hari: 'Rab', nilai: 100 },
                { hari: 'Kam', nilai: 100 },
                { hari: 'Jum', nilai: 100 },
                { hari: 'Sab', nilai: 100 },
                { hari: 'Min', nilai: terlacakPersen },
            ]
        );
    }, [statistik, terlacakPersen]);

    // 3. Data Rasio Selesai (<%> Rasio Laporan Diselesaikan per Minggu dari image 15.png)
    const rasioSelesai = statistik?.rasio_selesai_mingguan ?? 85;
    const rasioData = useMemo(() => {
        return (
            statistik?.tren_mingguan?.rasio ?? [
                { hari: 'Sen', nilai: 72 },
                { hari: 'Sel', nilai: 76 },
                { hari: 'Rab', nilai: 80 },
                { hari: 'Kam', nilai: 83 },
                { hari: 'Jum', nilai: 85 },
                { hari: 'Sab', nilai: 87 },
                { hari: 'Min', nilai: rasioSelesai },
            ]
        );
    }, [statistik, rasioSelesai]);

    const chartConfigRespon = {
        nilai: {
            label: 'Respon (Menit)',
            color: 'var(--color-primary)',
        },
    } satisfies ChartConfig;

    const chartConfigTerlacak = {
        nilai: {
            label: 'Terlacak (%)',
            color: 'var(--color-chart-1)',
        },
    } satisfies ChartConfig;

    const chartConfigRasio = {
        nilai: {
            label: 'Selesai (%)',
            color: 'var(--color-chart-5)',
        },
    } satisfies ChartConfig;

    return (
        <section id="kinerja" className="bg-background py-20 sm:py-28">
            <div className="mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
                {/* Header Seksi */}
                <div className="mx-auto max-w-3xl space-y-4 text-center">
                    <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-4xl">
                        Ukur Kinerja Layanan Publik Berbasis Data Nyata
                    </h2>
                    <p className="sm:text-body-large text-body-base text-muted-foreground">
                        Statistik transparan dihitung langsung dari aktivitas
                        sistem laporan dan SLA di wilayah Jabodetabek.
                    </p>
                </div>

                {/* 3 Cards Grid Sesuai Referensi image 16.png & Konten image 15.png */}
                <div className="grid grid-cols-1 items-stretch gap-6 sm:gap-8 md:grid-cols-3">
                    {/* Card 1: Rata-rata Respon Awal (<menit>) */}
                    <Card className="flex flex-col justify-between space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:shadow-md sm:p-7">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-body-sm font-display font-bold text-foreground">
                                <Clock className="size-4 text-primary" />
                                Kecepatan Respon
                            </span>
                            <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 text-caption-xs font-semibold"
                            >
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="block text-caption-xs font-medium text-muted-foreground">
                                Rata-rata Respon Awal
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                                    {responMenit}
                                </span>
                                <span className="font-display text-xl font-bold text-muted-foreground">
                                    Menit
                                </span>
                                <span className="ml-1.5 inline-flex items-center text-xs font-bold text-primary">
                                    <ArrowUpRight className="inline size-4" />{' '}
                                    +18%
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer
                                config={chartConfigRespon}
                                className="aspect-auto h-full w-full"
                            >
                                <AreaChart
                                    data={responData}
                                    margin={{
                                        top: 10,
                                        right: 8,
                                        left: 8,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="fillRespon"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-primary)"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-primary)"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Area
                                        type="natural"
                                        dataKey="nilai"
                                        stroke="var(--color-primary)"
                                        strokeWidth={2.5}
                                        fill="url(#fillRespon)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>

                        {/* Bottom Insight Bar Sesuai image 16.png */}
                        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                            <p className="flex-1 text-caption-xs leading-relaxed text-muted-foreground">
                                Tanggapan awal dinas tercatat dalam hitungan
                                menit sejak tiket diverifikasi sistem.
                            </p>
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Laporan Terlacak Real-time (<%>) */}
                    <Card className="flex flex-col justify-between space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:shadow-md sm:p-7">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-body-sm font-display font-bold text-foreground">
                                <ShieldCheck className="size-4 text-chart-1" />
                                Pelacakan Titik
                            </span>
                            <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 text-caption-xs font-semibold"
                            >
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="block text-caption-xs font-medium text-muted-foreground">
                                Laporan Terlacak Real-time
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                                    {terlacakPersen}%
                                </span>
                                <span className="ml-1.5 inline-flex items-center text-xs font-bold text-chart-1">
                                    <ArrowUpRight className="inline size-4" />{' '}
                                    Aktif
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer
                                config={chartConfigTerlacak}
                                className="aspect-auto h-full w-full"
                            >
                                <AreaChart
                                    data={terlacakData}
                                    margin={{
                                        top: 10,
                                        right: 8,
                                        left: 8,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="fillTerlacak"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-chart-1)"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-chart-1)"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="nilai"
                                        stroke="var(--color-chart-1)"
                                        strokeWidth={2.5}
                                        fill="url(#fillTerlacak)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>

                        {/* Bottom Insight Bar Sesuai image 16.png */}
                        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                            <p className="flex-1 text-caption-xs leading-relaxed text-muted-foreground">
                                100% aduan terikat titik koordinat GPS akurat
                                dan riwayat audit tanpa manipulasi.
                            </p>
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-1/10 text-chart-1">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>

                    {/* Card 3: Rasio Laporan Diselesaikan per Minggu (<%>) */}
                    <Card className="flex flex-col justify-between space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:shadow-md sm:p-7">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-body-sm font-display font-bold text-foreground">
                                <CheckCircle2 className="size-4 text-chart-5" />
                                Rasio Penyelesaian
                            </span>
                            <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 text-caption-xs font-semibold"
                            >
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="block text-caption-xs font-medium text-muted-foreground">
                                Rasio Selesai per Minggu
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                                    {rasioSelesai}%
                                </span>
                                <span className="ml-1.5 inline-flex items-center text-xs font-bold text-chart-5">
                                    <ArrowUpRight className="inline size-4" />{' '}
                                    +12%
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer
                                config={chartConfigRasio}
                                className="aspect-auto h-full w-full"
                            >
                                <AreaChart
                                    data={rasioData}
                                    margin={{
                                        top: 10,
                                        right: 8,
                                        left: 8,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="fillRasio"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-chart-5)"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-chart-5)"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Area
                                        type="natural"
                                        dataKey="nilai"
                                        stroke="var(--color-chart-5)"
                                        strokeWidth={2.5}
                                        fill="url(#fillRasio)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>

                        {/* Bottom Insight Bar Sesuai image 16.png */}
                        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                            <p className="flex-1 text-caption-xs leading-relaxed text-muted-foreground">
                                Tiket berhasil diperbaiki tuntas dan disahkan
                                langsung oleh kuorum warga kelurahan.
                            </p>
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-5/10 text-chart-5">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
}

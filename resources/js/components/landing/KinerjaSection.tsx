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
        <section id="kinerja" className="py-20 sm:py-28 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
                {/* Header Seksi */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                        Ukur Kinerja Layanan Publik Berbasis Data Nyata
                    </h2>
                    <p className="text-body-base sm:text-body-large text-muted-foreground">
                        Statistik transparan dihitung langsung dari aktivitas sistem laporan dan SLA di Kota Depok.
                    </p>
                </div>

                {/* 3 Cards Grid Sesuai Referensi image 16.png & Konten image 15.png */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                    {/* Card 1: Rata-rata Respon Awal (<menit>) */}
                    <Card className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="font-display text-body-sm font-bold text-foreground flex items-center gap-1.5">
                                <Clock className="size-4 text-primary" />
                                Kecepatan Respon
                            </span>
                            <Badge variant="secondary" className="text-caption-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="text-caption-xs text-muted-foreground font-medium block">
                                Rata-rata Respon Awal
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                                    {responMenit}
                                </span>
                                <span className="font-display text-xl font-bold text-muted-foreground">
                                    Menit
                                </span>
                                <span className="inline-flex items-center text-xs font-bold text-primary ml-1.5">
                                    <ArrowUpRight className="size-4 inline" /> +18%
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer config={chartConfigRespon} className="h-full w-full aspect-auto">
                                <AreaChart data={responData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fillRespon" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-4">
                            <p className="text-caption-xs text-muted-foreground leading-relaxed flex-1">
                                Tanggapan awal dinas tercatat dalam hitungan menit sejak tiket diverifikasi sistem.
                            </p>
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Laporan Terlacak Real-time (<%>) */}
                    <Card className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="font-display text-body-sm font-bold text-foreground flex items-center gap-1.5">
                                <ShieldCheck className="size-4 text-chart-1" />
                                Pelacakan Titik
                            </span>
                            <Badge variant="secondary" className="text-caption-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="text-caption-xs text-muted-foreground font-medium block">
                                Laporan Terlacak Real-time
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                                    {terlacakPersen}%
                                </span>
                                <span className="inline-flex items-center text-xs font-bold text-chart-1 ml-1.5">
                                    <ArrowUpRight className="size-4 inline" /> Aktif
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer config={chartConfigTerlacak} className="h-full w-full aspect-auto">
                                <AreaChart data={terlacakData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fillTerlacak" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-4">
                            <p className="text-caption-xs text-muted-foreground leading-relaxed flex-1">
                                100% aduan terikat titik koordinat GPS akurat dan riwayat audit tanpa manipulasi.
                            </p>
                            <div className="size-8 rounded-full bg-chart-1/10 text-chart-1 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>

                    {/* Card 3: Rasio Laporan Diselesaikan per Minggu (<%>) */}
                    <Card className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                        {/* Top Bar: Title & Filter Mingguan */}
                        <div className="flex items-center justify-between">
                            <span className="font-display text-body-sm font-bold text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 text-chart-5" />
                                Rasio Penyelesaian
                            </span>
                            <Badge variant="secondary" className="text-caption-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Mingguan ▾
                            </Badge>
                        </div>

                        {/* Metric & Trend */}
                        <div className="space-y-1">
                            <span className="text-caption-xs text-muted-foreground font-medium block">
                                Rasio Selesai per Minggu
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                                    {rasioSelesai}%
                                </span>
                                <span className="inline-flex items-center text-xs font-bold text-chart-5 ml-1.5">
                                    <ArrowUpRight className="size-4 inline" /> +12%
                                </span>
                            </div>
                        </div>

                        {/* Chart Area shadcn/ui Recharts */}
                        <div className="h-32 w-full pt-2">
                            <ChartContainer config={chartConfigRasio} className="h-full w-full aspect-auto">
                                <AreaChart data={rasioData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fillRasio" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" hide />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-4">
                            <p className="text-caption-xs text-muted-foreground leading-relaxed flex-1">
                                Tiket berhasil diperbaiki tuntas dan disahkan langsung oleh kuorum warga kelurahan.
                            </p>
                            <div className="size-8 rounded-full bg-chart-5/10 text-chart-5 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
}

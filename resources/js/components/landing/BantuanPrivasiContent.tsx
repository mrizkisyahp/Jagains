import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BantuanPrivasiContentProps {
    transparansiData: {
        disimpan: string[];
        tidakDisimpan: string[];
        batasDiakui: string[];
    };
}

export default function BantuanPrivasiContent({
    transparansiData,
}: BantuanPrivasiContentProps) {
    return (
        <div className="space-y-12">
            {/* Header Deskripsi */}
            <div className="mx-auto max-w-3xl space-y-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-caption-xs font-semibold text-primary">
                    <ShieldCheck className="size-4" />
                    <span>
                        Transparansi Tata Kelola Data & Kepatuhan UU PDP
                    </span>
                </div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Bantuan & Kebijakan Privasi
                </h1>
                <p className="text-body-base leading-relaxed text-muted-foreground">
                    Platform Jagains dirancang dengan prinsip perlindungan
                    privasi menyeluruh. Kami membuktikan akuntabilitas pelayanan
                    publik tanpa pernah memperjualbelikan, mengumpulkan, atau
                    mengekspos identitas pribadi warga pelapor.
                </p>
            </div>

            {/* Grid Komparasi: Disimpan vs Tidak Disimpan */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Kolom Hijau: Data Disimpan */}
                <Card className="space-y-6 rounded-3xl border-emerald-500/30 bg-emerald-500/5 p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-heading-md font-display font-bold text-foreground">
                                Data yang Disimpan
                            </h2>
                            <p className="text-caption-sm text-muted-foreground">
                                Hanya data minimal yang dibutuhkan untuk
                                operasional kuorum dan verifikasi.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-3.5">
                        {transparansiData.disimpan.map((item, idx) => (
                            <li
                                key={idx}
                                className="text-caption-sm flex items-start gap-3 text-foreground/90"
                            >
                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Kolom Merah: Data Tidak Disimpan */}
                <Card className="space-y-6 rounded-3xl border-rose-500/30 bg-rose-500/5 p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                            <XCircle className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-heading-md font-display font-bold text-foreground">
                                Data yang TIDAK Disimpan
                            </h2>
                            <p className="text-caption-sm text-muted-foreground">
                                Perlindungan total dari risiko doxxing,
                                intimidasi, atau kebocoran data.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-3.5">
                        {transparansiData.tidakDisimpan.map((item, idx) => (
                            <li
                                key={idx}
                                className="text-caption-sm flex items-start gap-3 text-foreground/90"
                            >
                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {/* Disclaimer Batas yang Diakui */}
            <Card className="space-y-6 rounded-3xl border-amber-500/30 bg-amber-500/5 p-6 md:p-8">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-6" />
                    </div>
                    <div>
                        <h2 className="text-heading-md font-display font-bold text-foreground">
                            Batas yang Diakui Secara Terbuka (System
                            Limitations)
                        </h2>
                        <p className="text-caption-sm text-muted-foreground">
                            Komitmen kejujuran teknis terhadap batas sistem demi
                            transparansi mutlak.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {transparansiData.batasDiakui.map((batas, idx) => (
                        <div
                            key={idx}
                            className="space-y-1 rounded-2xl border border-amber-500/20 bg-background/80 p-4"
                        >
                            <span className="text-caption-xs font-bold text-amber-600 uppercase">
                                Poin #{idx + 1}
                            </span>
                            <p className="text-caption-sm leading-relaxed text-foreground">
                                {batas}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

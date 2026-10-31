import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
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
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-caption-xs font-semibold text-primary border border-primary/20">
                    <ShieldCheck className="size-4" />
                    <span>Transparansi Tata Kelola Data & Kepatuhan UU PDP</span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                    Bantuan & Kebijakan Privasi
                </h1>
                <p className="text-body-base text-muted-foreground leading-relaxed">
                    Platform Jagains dirancang dengan arsitektur <strong>Zero-Knowledge Privacy</strong>. Kami membuktikan akuntabilitas pelayanan publik tanpa pernah memperjualbelikan, mengumpulkan, atau mengekspos identitas pribadi warga pelapor.
                </p>
            </div>

            {/* Grid Komparasi: Disimpan vs Tidak Disimpan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Hijau: Data Disimpan */}
                <Card className="p-6 md:p-8 rounded-3xl border-emerald-500/30 bg-emerald-500/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                            <h2 className="font-display text-heading-md font-bold text-foreground">
                                Data yang Disimpan
                            </h2>
                            <p className="text-caption-sm text-muted-foreground">
                                Hanya data minimal yang dibutuhkan untuk operasional kuorum dan verifikasi.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-3.5">
                        {transparansiData.disimpan.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-caption-sm text-foreground/90">
                                <span className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Kolom Merah: Data Tidak Disimpan */}
                <Card className="p-6 md:p-8 rounded-3xl border-rose-500/30 bg-rose-500/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <XCircle className="size-6" />
                        </div>
                        <div>
                            <h2 className="font-display text-heading-md font-bold text-foreground">
                                Data yang TIDAK Disimpan
                            </h2>
                            <p className="text-caption-sm text-muted-foreground">
                                Perlindungan total dari risiko doxxing, intimidasi, atau kebocoran data.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-3.5">
                        {transparansiData.tidakDisimpan.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-caption-sm text-foreground/90">
                                <span className="size-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {/* Disclaimer Batas yang Diakui */}
            <Card className="p-6 md:p-8 rounded-3xl border-amber-500/30 bg-amber-500/5 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-6" />
                    </div>
                    <div>
                        <h2 className="font-display text-heading-md font-bold text-foreground">
                            Batas yang Diakui Secara Terbuka (System Limitations)
                        </h2>
                        <p className="text-caption-sm text-muted-foreground">
                            Komitmen kejujuran teknis terhadap batas sistem demi transparansi mutlak.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transparansiData.batasDiakui.map((batas, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-background/80 border border-amber-500/20 space-y-1">
                            <span className="text-caption-xs font-bold text-amber-600 uppercase">
                                Poin #{idx + 1}
                            </span>
                            <p className="text-caption-sm text-foreground leading-relaxed">
                                {batas}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

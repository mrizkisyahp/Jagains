import {
    Scale,
    Calendar,
    AlertOctagon,
    CheckCheck,
    RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CatatanAuditorItem } from '@/types/tiket';

interface TiketAuditorNotesCardProps {
    catatanAuditor: CatatanAuditorItem[];
}

export default function TiketAuditorNotesCard({
    catatanAuditor,
}: TiketAuditorNotesCardProps) {
    if (!catatanAuditor || catatanAuditor.length === 0) {
        return null;
    }

    const getDecisionBadge = (jenis: string) => {
        switch (jenis) {
            case 'PERINTAH':
                return (
                    <Badge className="flex items-center gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <AlertOctagon className="size-3" />
                        <span>Perintah Kerja Khusus</span>
                    </Badge>
                );
            case 'KERJAKAN_ULANG':
                return (
                    <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                    >
                        <RotateCcw className="size-3" />
                        <span>Instruksi Kerjakan Ulang</span>
                    </Badge>
                );
            case 'PERBAIKAN_SAH':
            default:
                return (
                    <Badge className="flex items-center gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <CheckCheck className="size-3" />
                        <span>Perbaikan Dinyatakan Sah</span>
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                    <Scale className="size-4" />
                </div>
                <div>
                    <h3 className="font-display text-sm font-bold text-foreground">
                        Catatan Keputusan Auditor Independen
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Intervensi pengawasan arbitrase resmi demi menjaga
                        akuntabilitas penanganan fasilitas publik.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {catatanAuditor.map((item) => (
                    <div
                        key={item.id}
                        className="space-y-2.5 rounded-xl border border-border/70 bg-card p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            {getDecisionBadge(item.jenis)}
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="size-3" />
                                <span>
                                    {new Date(item.waktu).toLocaleDateString(
                                        'id-ID',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    )}
                                </span>
                            </span>
                        </div>

                        {item.alasan && (
                            <div className="text-xs">
                                <p className="mb-0.5 font-semibold text-foreground">
                                    Pertimbangan Auditor:
                                </p>
                                <p className="leading-relaxed text-muted-foreground">
                                    {item.alasan}
                                </p>
                            </div>
                        )}

                        {item.perintah && (
                            <div className="rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs">
                                <p className="mb-0.5 font-semibold text-foreground">
                                    Perintah Kerja Dinas:
                                </p>
                                <p className="leading-relaxed text-muted-foreground">
                                    {item.perintah}
                                </p>
                            </div>
                        )}

                        {item.tenggat && (
                            <div className="border-t border-border/40 pt-1 text-[11px] font-medium text-muted-foreground">
                                Tenggat Penyelesaian Baru:{' '}
                                <strong className="text-foreground">
                                    {new Date(item.tenggat).toLocaleDateString(
                                        'id-ID',
                                        {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        },
                                    )}
                                </strong>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

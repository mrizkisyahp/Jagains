import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgeSlaCountdownProps {
    tahap: string | null;
    jatuhTempo: string | null;
    sisaHari: number | null;
    persenSla: number | null;
}

export default function BadgeSlaCountdown({
    tahap,
    jatuhTempo,
    sisaHari,
    persenSla,
}: BadgeSlaCountdownProps) {
    if (!tahap || !jatuhTempo || sisaHari === null) {
        return (
            <Badge variant="outline" className="text-muted-foreground font-mono text-caption-xs">
                Tidak Terikat SLA
            </Badge>
        );
    }

    // Semantik warna SLA Jagains (FR-TIK-10 & P-25)
    // Merah: Terlambat / lewat jatuh tempo (sisaHari < 0)
    // Kuning: Sisa waktu <= 50% atau sisa <= 1 hari
    // Hijau: Sisa waktu > 50%
    const isOverdue = sisaHari < 0;
    const isWarning = !isOverdue && (sisaHari <= 1 || (persenSla !== null && persenSla <= 50));

    let badgeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    let icon = <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />;
    let label = `Sisa ${sisaHari} Hari`;

    if (isOverdue) {
        badgeClass = 'border-destructive/30 bg-destructive/10 text-destructive';
        icon = <AlertCircle className="size-3 text-destructive animate-pulse" />;
        label = `Lewat ${Math.abs(sisaHari)} Hari`;
    } else if (isWarning) {
        badgeClass = 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';
        icon = <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />;
        label = sisaHari === 0 ? 'Hari Ini' : `Sisa ${sisaHari} Hari`;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption-xs font-semibold border ${badgeClass} cursor-help transition-colors`}>
                        {icon}
                        <span className="font-mono">{label}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-caption-xs space-y-1">
                    <p className="font-semibold">Batas Waktu Tahap: {tahap}</p>
                    <p className="text-muted-foreground">Tenggat resmi: {jatuhTempo}</p>
                    {persenSla !== null && (
                        <p className="text-muted-foreground">Sisa alokasi waktu: {persenSla}%</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

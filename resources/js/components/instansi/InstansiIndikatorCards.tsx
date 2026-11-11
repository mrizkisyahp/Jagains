import { cn } from '@/lib/utils';

interface IndikatorKinerjaProps {
    janjiDitepati: {
        persen: number;
        label_tingkat: string;
        tepat_waktu: number;
        terlambat: number;
    };
    persentaseVerifikasi: {
        persen: number;
        label_tingkat: string;
        diverifikasi: number;
        ditolak: number;
    };
    anggaranMenggantung: {
        total_tiket: number;
        rata_rata_keterlambatan_hari: number;
    };
    className?: string;
}

export default function InstansiIndikatorCards({
    janjiDitepati,
    persentaseVerifikasi,
    anggaranMenggantung,
    className,
}: IndikatorKinerjaProps) {
    // Helper untuk Donut SVG Circular Progress
    const renderDonut = (persen: number, mainColorClass: string) => {
        const radius = 38;
        const circumference = 2 * Math.PI * radius; // ~238.76
        const safePercent = Math.min(100, Math.max(0, persen));
        const strokeDashoffset =
            circumference - (safePercent / 100) * circumference;

        return (
            <div className="relative flex size-24 shrink-0 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        className="stroke-muted/80"
                        strokeWidth="11"
                    />
                    {/* Value Arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        className={mainColorClass}
                        strokeWidth="11"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        );
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('id-ID');
    };

    return (
        <div className={cn('grid grid-cols-1 gap-5 md:grid-cols-3', className)}>
            {/* CARD 1: Tingkat Janji Ditepati */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                <h4 className="text-body-base font-display font-bold text-foreground">
                    Tingkat Janji Ditepati
                </h4>

                <div className="flex items-center gap-4 sm:gap-5">
                    {renderDonut(
                        janjiDitepati.persen,
                        'stroke-emerald-600 dark:stroke-emerald-500',
                    )}

                    <div className="space-y-1">
                        <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-sm">
                            {Math.round(janjiDitepati.persen)}%
                        </div>
                        <p className="text-caption-xs font-semibold text-muted-foreground">
                            {janjiDitepati.label_tingkat}
                        </p>
                    </div>
                </div>

                {/* Legend di Bawah */}
                <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2 text-caption-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-muted-foreground/40" />
                            <span>Terlambat</span>
                        </span>
                        <span className="font-mono font-medium text-foreground">
                            {janjiDitepati.terlambat}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                            <span>Tepat waktu</span>
                        </span>
                        <span className="font-mono font-medium text-foreground">
                            {janjiDitepati.tepat_waktu}%
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 2: Presentase Verifikasi */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                <h4 className="text-body-base font-display font-bold text-foreground">
                    Presentase Verifikasi
                </h4>

                <div className="flex items-center gap-4 sm:gap-5">
                    {renderDonut(
                        persentaseVerifikasi.persen,
                        'stroke-blue-600 dark:stroke-blue-500',
                    )}

                    <div className="space-y-1">
                        <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-sm">
                            {Math.round(persentaseVerifikasi.persen)}%
                        </div>
                        <p className="text-caption-xs font-semibold text-muted-foreground">
                            {persentaseVerifikasi.label_tingkat}
                        </p>
                    </div>
                </div>

                {/* Legend di Bawah */}
                <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2 text-caption-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
                            <span>Diverifikasi</span>
                        </span>
                        <span className="font-mono font-medium text-foreground">
                            {persentaseVerifikasi.diverifikasi}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-muted-foreground/40" />
                            <span>Ditolak</span>
                        </span>
                        <span className="font-mono font-medium text-foreground">
                            {persentaseVerifikasi.ditolak}%
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 3: Anggaran Menggantung */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                <h4 className="text-body-base font-display font-bold text-foreground">
                    Anggaran Menggantung
                </h4>

                <div className="space-y-1 py-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                            {formatNumber(anggaranMenggantung.total_tiket)}
                        </span>
                        <span className="text-body-sm font-medium text-muted-foreground">
                            Tiket
                        </span>
                    </div>
                    <p className="text-caption-xs text-muted-foreground">
                        Tiket terjadwal anggaran melewati batas target
                    </p>
                </div>

                <div className="border-t border-border/60 pt-2 text-caption-xs text-muted-foreground">
                    <span>Rata-rata Keterlambatan: </span>
                    <strong className="font-mono font-semibold text-foreground">
                        {anggaranMenggantung.rata_rata_keterlambatan_hari.toLocaleString(
                            'id-ID',
                            { minimumFractionDigits: 1 },
                        )}{' '}
                        hari
                    </strong>
                </div>
            </div>
        </div>
    );
}

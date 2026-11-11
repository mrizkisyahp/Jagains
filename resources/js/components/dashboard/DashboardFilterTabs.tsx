import { router } from '@inertiajs/react';
import { SegmenDashboard, PeriodeDashboard } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar } from 'lucide-react';

interface DashboardFilterTabsProps {
    segmenAktif: SegmenDashboard;
    onSelectSegmen: (segmen: SegmenDashboard) => void;
    periodeAktif: PeriodeDashboard;
}

export default function DashboardFilterTabs({
    segmenAktif,
    onSelectSegmen,
    periodeAktif,
}: DashboardFilterTabsProps) {
    const handlePeriodeChange = (periode: string) => {
        router.get(
            '/dashboard',
            { periode },
            { preserveState: true, replace: true },
        );
    };

    return (
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-2 sm:flex-row sm:items-center">
            {/* Toggle Segmen: Kecamatan vs Instansi */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/80 p-1">
                <Button
                    type="button"
                    variant={segmenAktif === 'kecamatan' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectSegmen('kecamatan')}
                    className="h-9 rounded-lg px-4 text-caption-xs font-semibold transition-all"
                >
                    <MapPin className="mr-1.5 size-3.5" />
                    Antarkecamatan (11 Wilayah)
                </Button>
                <Button
                    type="button"
                    variant={segmenAktif === 'instansi' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectSegmen('instansi')}
                    className="h-9 rounded-lg px-4 text-caption-xs font-semibold transition-all"
                >
                    <Building2 className="mr-1.5 size-3.5" />
                    Antarinstansi OPD
                </Button>
            </div>

            {/* Filter Rentang Periode */}
            <div className="flex items-center gap-2 px-2">
                <Calendar className="hidden size-4 shrink-0 text-muted-foreground sm:inline" />
                <span className="hidden text-caption-xs font-medium text-muted-foreground sm:inline">
                    Periode:
                </span>
                <div className="flex items-center gap-1">
                    {[
                        { label: '30 Hari', value: '30_hari' },
                        { label: '90 Hari', value: '90_hari' },
                        { label: 'Semua', value: 'semua' },
                    ].map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => handlePeriodeChange(p.value)}
                            className={`rounded-lg px-3 py-1.5 text-caption-xs font-semibold transition-colors ${
                                periodeAktif === p.value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

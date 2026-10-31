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
            { preserveState: true, replace: true }
        );
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-muted/40 border border-border">
            {/* Toggle Segmen: Kecamatan vs Instansi */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-border/60">
                <Button
                    type="button"
                    variant={segmenAktif === 'kecamatan' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectSegmen('kecamatan')}
                    className="h-9 px-4 rounded-lg font-semibold text-caption-xs transition-all"
                >
                    <MapPin className="size-3.5 mr-1.5" />
                    Antarkecamatan (11 Wilayah)
                </Button>
                <Button
                    type="button"
                    variant={segmenAktif === 'instansi' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectSegmen('instansi')}
                    className="h-9 px-4 rounded-lg font-semibold text-caption-xs transition-all"
                >
                    <Building2 className="size-3.5 mr-1.5" />
                    Antarinstansi OPD
                </Button>
            </div>

            {/* Filter Rentang Periode */}
            <div className="flex items-center gap-2 px-2">
                <Calendar className="size-4 text-muted-foreground shrink-0 hidden sm:inline" />
                <span className="text-caption-xs font-medium text-muted-foreground hidden sm:inline">
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
                            className={`px-3 py-1.5 rounded-lg text-caption-xs font-semibold transition-colors ${
                                periodeAktif === p.value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
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

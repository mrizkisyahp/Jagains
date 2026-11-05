import type { ComponentType } from 'react';
import { EskalasiItem, PemicuEskalasi } from '@/types/auditor';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Building2,
    Clock,
    MapPin,
    Scale,
    ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export interface PemicuBadgeInfo {
    label: string;
    icon: ComponentType<{ className?: string }>;
    variant:
        | 'destructive'
        | 'sla-warn'
        | 'sla-late'
        | 'stage-audit'
        | 'secondary'
        | 'default'
        | 'outline';
}

export function getPemicuBadge(pemicu: PemicuEskalasi): PemicuBadgeInfo {
    switch (pemicu) {
        case 'SLA':
            return {
                label: 'Keterlambatan SLA',
                icon: Clock,
                variant: 'destructive',
            };
        case 'SANGGAHAN':
            return {
                label: 'Sanggahan Instansi',
                icon: ShieldAlert,
                variant: 'stage-audit',
            };
        case 'RONDE':
            return {
                label: 'Sengketa Ronde 4x',
                icon: AlertTriangle,
                variant: 'sla-warn',
            };
        case 'TANPA_KUORUM':
            return {
                label: '14 Hari Tanpa Kuorum',
                icon: AlertCircle,
                variant: 'secondary',
            };
    }
}

interface KartuEskalasiProps {
    eskalasi: EskalasiItem;
    onBukaPerkara?: (eskalasiId: number) => void;
}

export default function KartuEskalasi({
    eskalasi,
    onBukaPerkara,
}: KartuEskalasiProps) {
    const badge = getPemicuBadge(eskalasi.pemicu);
    const BadgeIcon = badge.icon;
    const { laporan } = eskalasi;

    const formattedDate = new Date(eskalasi.created_at).toLocaleDateString(
        'id-ID',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    );

    return (
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
            <div>
                {/* Header: Pemicu Badge & Waktu Masuk */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-1.5">
                        <Badge variant={badge.variant} className="gap-1 text-caption-xs font-semibold">
                            <BadgeIcon className="size-3" />
                            {badge.label}
                        </Badge>
                        {eskalasi.tahap && (
                            <Badge variant="outline" className="text-caption-xs font-normal">
                                Tahap {eskalasi.tahap}
                            </Badge>
                        )}
                    </div>
                    <span className="text-caption-xs tabular-nums text-muted-foreground">
                        {formattedDate}
                    </span>
                </div>

                {/* Nomor Tiket & Judul */}
                <div className="mt-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                            {laporan.nomor_tiket}
                        </span>
                        {laporan.kategori && (
                            <span className="text-caption-xs text-muted-foreground">
                                {laporan.kategori.nama}
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 line-clamp-1 text-body-sm font-semibold text-foreground">
                        {laporan.judul}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-caption-sm text-muted-foreground">
                        {laporan.keterangan}
                    </p>
                </div>

                {/* Lokasi & Instansi */}
                <div className="mt-3 space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-caption-sm">
                    <div className="flex items-center gap-2 text-foreground">
                        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">
                            {laporan.instansi?.nama || 'Instansi Terkait'}
                        </span>
                        {laporan.instansi?.singkatan && (
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                {laporan.instansi.singkatan}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            Kelurahan {laporan.kelurahan?.nama || '-'}
                        </span>
                    </div>
                </div>

                {/* Info Keterlambatan SLA */}
                {eskalasi.pemicu === 'SLA' && eskalasi.hari_terlambat > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-caption-xs font-medium text-destructive">
                        <Clock className="size-3.5 shrink-0" />
                        <span>
                            Terlambat <strong className="tabular-nums">{eskalasi.hari_terlambat} hari kerja</strong> dari SLA.
                        </span>
                    </div>
                )}
            </div>

            {/* Tombol Aksi */}
            <div className="mt-4 border-t border-border pt-3">
                <Link
                    href={`/auditor/antrean/${eskalasi.id}`}
                    className={cn(
                        buttonVariants({ variant: 'default', size: 'sm' }),
                        'w-full gap-2 text-xs font-semibold',
                    )}
                >
                    <Scale className="size-3.5" />
                    <span>Telaah Perkara & Putuskan</span>
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>
        </div>
    );
}

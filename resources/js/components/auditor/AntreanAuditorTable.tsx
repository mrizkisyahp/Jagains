import { EskalasiItem } from '@/types/auditor';
import { Clock, ExternalLink, Scale } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getPemicuBadge } from './KartuEskalasi';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface AntreanAuditorTableProps {
    data: EskalasiItem[];
    onBukaPerkara?: (id: number) => void;
}

export default function AntreanAuditorTable({
    data,
    onBukaPerkara,
}: AntreanAuditorTableProps) {
    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="w-full min-w-0 overflow-x-auto">
            <Table className="w-full min-w-[760px] table-fixed">
                <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[35%] min-w-[220px] text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Perkara & Laporan
                        </TableHead>
                        <TableHead className="w-[18%] min-w-[130px] text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Pemicu & Tahap
                        </TableHead>
                        <TableHead className="w-[20%] min-w-[140px] text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Instansi Pelaksana
                        </TableHead>
                        <TableHead className="w-[15%] min-w-[110px] text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status Keterlambatan
                        </TableHead>
                        <TableHead className="w-[12%] min-w-[105px] text-right text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Aksi
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => {
                        const badge = getPemicuBadge(item.pemicu);
                        const BadgeIcon = badge.icon;
                        const { laporan } = item;

                        return (
                            <TableRow
                                key={item.id}
                                className="border-b border-border transition-colors hover:bg-muted/20"
                            >
                                {/* Perkara & Laporan */}
                                <TableCell className="min-w-0 py-3.5 align-top">
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-foreground">
                                                {laporan.nomor_tiket}
                                            </span>
                                            {laporan.kategori && (
                                                <span className="truncate text-caption-xs text-muted-foreground">
                                                    • {laporan.kategori.nama}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className="truncate text-body-sm font-medium text-foreground"
                                            title={laporan.judul}
                                        >
                                            {laporan.judul}
                                        </p>
                                        <div className="flex items-center gap-2 text-caption-xs text-muted-foreground">
                                            <span className="truncate">
                                                Kel.{' '}
                                                {laporan.kelurahan?.nama || '-'}
                                            </span>
                                            <span>•</span>
                                            <span className="shrink-0 tabular-nums">
                                                Masuk{' '}
                                                {formatTanggal(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Pemicu & Tahap */}
                                <TableCell className="min-w-0 py-3.5 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        <Badge
                                            variant={badge.variant}
                                            className="w-fit gap-1 text-caption-xs font-semibold"
                                        >
                                            <BadgeIcon className="size-3" />
                                            {badge.label}
                                        </Badge>
                                        {item.tahap && (
                                            <span className="text-caption-xs text-muted-foreground">
                                                Tahap {item.tahap}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Instansi Pelaksana */}
                                <TableCell className="min-w-0 py-3.5 align-top">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span
                                            className="truncate text-body-sm font-medium text-foreground"
                                            title={
                                                laporan.instansi?.nama || '-'
                                            }
                                        >
                                            {laporan.instansi?.nama || '-'}
                                        </span>
                                        {laporan.instansi?.singkatan && (
                                            <span className="py-0.2 w-fit rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                                                {laporan.instansi.singkatan}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Status Keterlambatan / Waktu Masuk */}
                                <TableCell className="min-w-0 py-3.5 align-top">
                                    {item.pemicu === 'SLA' &&
                                    item.hari_terlambat > 0 ? (
                                        <div className="flex items-center gap-1.5 text-caption-xs font-semibold text-destructive">
                                            <Clock className="size-3.5 shrink-0" />
                                            <span>
                                                Terlambat{' '}
                                                <strong className="tabular-nums">
                                                    {item.hari_terlambat} hari
                                                </strong>
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-caption-xs text-muted-foreground">
                                            {item.pemicu === 'SANGGAHAN'
                                                ? 'Menunggu putusan sanggahan'
                                                : item.pemicu === 'RONDE'
                                                  ? 'Kebuntuan 4 ronde'
                                                  : 'Menunggu kuorum 14 hari'}
                                        </span>
                                    )}
                                </TableCell>

                                {/* Aksi */}
                                <TableCell className="py-3.5 text-right align-top whitespace-nowrap">
                                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                                        <Link
                                            href={`/auditor/antrean/${item.id}`}
                                            className={cn(
                                                buttonVariants({
                                                    variant: 'default',
                                                    size: 'sm',
                                                }),
                                                'h-8 shrink-0 gap-1.5 px-3 text-xs font-semibold whitespace-nowrap',
                                            )}
                                        >
                                            <Scale className="size-3.5 shrink-0" />
                                            <span>Telaah</span>
                                        </Link>

                                        <Link
                                            href={`/tiket/${laporan.nomor_tiket}`}
                                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            title="Lihat detail tiket publik"
                                            aria-label={`Lihat detail tiket ${laporan.nomor_tiket}`}
                                        >
                                            <ExternalLink className="size-3.5" />
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

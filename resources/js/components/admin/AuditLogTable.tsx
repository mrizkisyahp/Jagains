import { useState } from 'react';
import { AuditLogItem, PaginatedData } from '@/types/audit';
import { Eye, ShieldCheck } from 'lucide-react';
import { router } from '@inertiajs/react';
import ModalDetailAuditLog from './ModalDetailAuditLog';
import AdminEmptyState from './AdminEmptyState';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditLogTableProps {
    logs: PaginatedData<AuditLogItem>;
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatJam = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getAksiBadgeVariant = (aksi: string) => {
        if (aksi.includes('BUKA_IDENTITAS')) {
            return 'sla-warn' as const;
        }
        if (aksi.includes('MODERASI') || aksi.includes('SEMBUNYIKAN')) {
            return 'destructive' as const;
        }
        if (aksi.includes('ROUTING') || aksi.includes('DISPOSISI')) {
            return 'stage-verify' as const;
        }
        if (aksi.includes('GANTI_SANDI') || aksi.includes('BUAT_AKUN')) {
            return 'secondary' as const;
        }
        return 'outline' as const;
    };

    return (
        <div className="w-full min-w-0 space-y-4">
            <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
                <Table className="min-w-[760px]">
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Waktu (WIB)
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Pelaku
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Jenis Aksi
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Objek / Entitas
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Tiket Terkait
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Alasan Tindakan
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Rincian
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-40 text-center"
                                >
                                    <AdminEmptyState
                                        icon={ShieldCheck}
                                        title="Log Audit Kosong"
                                        description="Tidak ada catatan log audit forensik yang cocok dengan kriteria pencarian ini."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.data.map((log) => (
                                <TableRow
                                    key={log.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <TableCell className="font-mono whitespace-nowrap">
                                        <div className="text-body-sm font-semibold text-foreground tabular-nums">
                                            {formatTanggal(log.waktu)}
                                        </div>
                                        <div className="text-caption-xs text-muted-foreground tabular-nums">
                                            {formatJam(log.waktu)} WIB
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-body-sm font-semibold text-foreground">
                                            {log.pelaku?.username ?? 'Sistem'}
                                        </div>
                                        {log.pelaku?.peran && (
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                {log.pelaku.peran}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getAksiBadgeVariant(
                                                log.aksi,
                                            )}
                                            className="font-mono text-[11px]"
                                        >
                                            {log.aksi}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-foreground">
                                        {log.objek_tipe ? (
                                            <span>
                                                <strong className="font-semibold text-foreground">
                                                    {log.objek_tipe}
                                                </strong>
                                                {log.objek_id && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        #{log.objek_id}
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono">
                                        {log.laporan ? (
                                            <a
                                                href={`/tiket/${log.laporan.nomor_tiket}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-semibold text-primary hover:underline"
                                            >
                                                {log.laporan.nomor_tiket}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className="max-w-xs truncate text-body-sm text-muted-foreground"
                                        title={log.alasan ?? '-'}
                                    >
                                        {log.alasan || (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedLog(log)}
                                            title={`Lihat rincian log #${log.id}`}
                                            aria-label={`Lihat rincian log #${log.id}`}
                                        >
                                            <Eye
                                                className="size-3 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <span className="hidden sm:inline">
                                                Lihat
                                            </span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {logs.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-4 text-caption-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            Menampilkan{' '}
                            <strong className="font-medium text-foreground">
                                {logs.from ?? 0}
                            </strong>{' '}
                            -{' '}
                            <strong className="font-medium text-foreground">
                                {logs.to ?? 0}
                            </strong>{' '}
                            dari total{' '}
                            <strong className="font-medium text-foreground">
                                {logs.total}
                            </strong>{' '}
                            rekaman
                        </div>
                        {logs.links && logs.links.length > 3 && (
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => {
                                    if (!link.url && !link.active) {
                                        return null;
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.get(
                                                    link.url,
                                                    {},
                                                    {
                                                        preserveState: true,
                                                        replace: true,
                                                    },
                                                )
                                            }
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label
                                                        .replace('&laquo;', '‹')
                                                        .replace(
                                                            '&raquo;',
                                                            '›',
                                                        ),
                                                }}
                                            />
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalDetailAuditLog
                log={selectedLog}
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}

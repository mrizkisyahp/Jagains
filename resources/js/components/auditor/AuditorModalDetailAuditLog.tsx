import { AuditLogItem } from '@/types/audit';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    FileText,
    Globe,
    Monitor,
    ShieldCheck,
    User,
} from 'lucide-react';

interface AuditorModalDetailAuditLogProps {
    log: AuditLogItem | null;
    open: boolean;
    onClose: () => void;
}

export default function AuditorModalDetailAuditLog({
    log,
    open,
    onClose,
}: AuditorModalDetailAuditLogProps) {
    if (!log) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <DialogHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className="text-caption-xs font-mono font-semibold"
                        >
                            ID #{log.id}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="text-caption-xs font-mono font-semibold"
                        >
                            {log.aksi}
                        </Badge>
                    </div>
                    <DialogTitle className="text-body-large pt-1 font-bold tracking-tight text-foreground">
                        Rincian Log Forensik Pengawasan
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-1.5 pt-0.5 text-caption-xs text-muted-foreground">
                        <ShieldCheck
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span>
                            Rekaman append-only terlindungi pemicu integritas
                            basis data.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-4 text-caption-xs sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <User
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                                Pelaku:
                            </span>
                            <strong className="truncate font-semibold text-foreground">
                                {log.pelaku?.username ?? 'Sistem / Anonim'}
                            </strong>
                            {log.pelaku?.peran && (
                                <Badge
                                    variant="outline"
                                    className="shrink-0 text-[10px] font-semibold uppercase"
                                >
                                    {log.pelaku.peran}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                                Waktu:
                            </span>
                            <span className="font-mono font-medium text-foreground tabular-nums">
                                {new Date(log.waktu).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'medium',
                                })}
                            </span>
                        </div>

                        {log.laporan && (
                            <div className="col-span-1 flex min-w-0 items-center gap-2 sm:col-span-2">
                                <FileText
                                    className="size-3.5 shrink-0 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <span className="shrink-0 text-muted-foreground">
                                    Tiket Terkait:
                                </span>
                                <a
                                    href={`/tiket/${log.laporan.nomor_tiket}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 font-mono font-bold text-primary hover:underline"
                                >
                                    {log.laporan.nomor_tiket}
                                </a>
                                <span className="truncate text-muted-foreground">
                                    ({log.laporan.judul})
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Globe
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                                Alamat IP:
                            </span>
                            <code className="text-caption-xs font-mono text-foreground">
                                {log.konteks?.ip ?? '-'}
                            </code>
                        </div>

                        <div className="flex items-center gap-2 truncate">
                            <Monitor
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                                User-Agent:
                            </span>
                            <span
                                className="truncate font-mono text-muted-foreground"
                                title={log.konteks?.user_agent ?? '-'}
                            >
                                {log.konteks?.user_agent ?? '-'}
                            </span>
                        </div>
                    </div>

                    {/* Alasan Tindakan */}
                    <div className="rounded-xl border border-border p-4">
                        <span className="text-caption-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Alasan Tindakan
                        </span>
                        <p className="mt-1.5 text-body-sm leading-relaxed text-foreground">
                            {log.alasan || (
                                <span className="text-muted-foreground italic">
                                    Tidak ada catatan alasan yang dilampirkan.
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Snapshot Perubahan Nilai (Lama vs Baru) */}
                    {(log.nilai_lama || log.nilai_baru) && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border p-3.5">
                                <span className="text-caption-xs font-bold tracking-wider text-destructive uppercase">
                                    Nilai Sebelumnya
                                </span>
                                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/40 p-2.5 font-mono text-[11px] text-muted-foreground">
                                    {log.nilai_lama
                                        ? JSON.stringify(
                                              log.nilai_lama,
                                              null,
                                              2,
                                          )
                                        : '— (Baru Dibuat)'}
                                </pre>
                            </div>

                            <div className="rounded-xl border border-border p-3.5">
                                <span className="text-caption-xs font-bold tracking-wider text-primary uppercase">
                                    Nilai Sesudahnya
                                </span>
                                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/40 p-2.5 font-mono text-[11px] text-foreground">
                                    {log.nilai_baru
                                        ? JSON.stringify(
                                              log.nilai_baru,
                                              null,
                                              2,
                                          )
                                        : '— (Dihapus)'}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

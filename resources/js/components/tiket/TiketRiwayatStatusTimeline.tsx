import { History, ArrowRight, Building2, Clock, GitFork, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RiwayatStatusItem, PengalihanItem } from '@/types/tiket';

interface TiketRiwayatStatusTimelineProps {
    riwayatStatus: RiwayatStatusItem[];
    pengalihan: PengalihanItem[];
}

export default function TiketRiwayatStatusTimeline({
    riwayatStatus,
    pengalihan,
}: TiketRiwayatStatusTimelineProps) {
    if ((!riwayatStatus || riwayatStatus.length === 0) && (!pengalihan || pengalihan.length === 0)) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                Belum ada catatan mutasi status untuk laporan ini.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <History className="size-5 text-primary" />
                    <span>Linimasa Riwayat Penanganan Status</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                    Jejak audit transisi status (T-01 s/d T-20) yang tercatat secara kekal dan transparan.
                </p>
            </div>

            {/* Riwayat Pengalihan Antar-Dinas jika ada */}
            {pengalihan && pengalihan.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                        <GitFork className="size-4" />
                        <span>Catatan Pengalihan Kewenangan Dinas ({pengalihan.length})</span>
                    </div>

                    <div className="space-y-2">
                        {pengalihan.map((p) => (
                            <div key={p.id} className="rounded-lg bg-card p-3 border border-border/60 text-xs space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {p.instansi_asal} &rarr; {p.instansi_tujuan}
                                    </span>
                                    <span>
                                        {new Date(p.waktu).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <p className="text-muted-foreground italic">&ldquo;{p.alasan}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Linimasa Vertikal */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                {riwayatStatus.map((rs, index) => (
                    <div key={rs.id} className="relative group">
                        {/* Dot penanda */}
                        <div className="absolute -left-6 top-1.5 size-5 rounded-full border-2 border-background bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                            <span className="size-1.5 rounded-full bg-white" />
                        </div>

                        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-2 transition-all group-hover:border-primary/40">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                                        {rs.kode_transisi}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        {rs.status_lama && (
                                            <>
                                                <span className="text-muted-foreground font-normal">
                                                    {rs.status_lama.replace(/_/g, ' ')}
                                                </span>
                                                <ArrowRight className="size-3 text-muted-foreground" />
                                            </>
                                        )}
                                        <span className="text-primary">
                                            {rs.status_baru.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>

                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>
                                        {new Date(rs.waktu).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </span>
                            </div>

                            {rs.catatan && (
                                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap leading-relaxed">
                                    {rs.catatan}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1">
                                <span className="flex items-center gap-1">
                                    <Building2 className="size-3" />
                                    <span>{rs.instansi_nama || 'Sistem Otomatis Jagains'}</span>
                                </span>
                                <span className="capitalize">
                                    Oleh: {rs.peran_pelaku === 'sistem' ? 'Sistem' : `Petugas ${rs.peran_pelaku}`}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

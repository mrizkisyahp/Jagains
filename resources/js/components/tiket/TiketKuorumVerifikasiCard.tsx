import { Users, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KuorumVerifikasiData } from '@/types/tiket';

interface TiketKuorumVerifikasiCardProps {
    kuorum: KuorumVerifikasiData | null;
}

export default function TiketKuorumVerifikasiCard({ kuorum }: TiketKuorumVerifikasiCardProps) {
    if (!kuorum) {
        return null;
    }

    const getStatusLabel = () => {
        switch (kuorum.hasil) {
            case 'setuju':
                return {
                    label: 'Lolos Verifikasi Warga (Sah)',
                    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                };
            case 'tolak':
                return {
                    label: 'Ditolak Warga (Disengketakan)',
                    color: 'bg-destructive/15 text-destructive border-destructive/30',
                };
            case 'kedaluwarsa':
                return {
                    label: 'Kedaluwarsa (14 Hari Habis)',
                    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                };
            default:
                return {
                    label: 'Ronde Verifikasi Sedang Berjalan',
                    color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
                };
        }
    };

    const statusBadge = getStatusLabel();

    return (
        <div className="rounded-2xl border border-blue-500/30 bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                        <Users className="size-4" />
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-bold text-foreground">
                            Kuorum Verifikasi Warga — Ronde {kuorum.nomor_ronde}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                            Persetujuan warga kelurahan dengan sistem bobot Jalur A (foto kamera & GPS) dan Jalur B.
                        </p>
                    </div>
                </div>

                <Badge className={`text-xs font-semibold ${statusBadge.color}`}>
                    {statusBadge.label}
                </Badge>
            </div>

            {/* Progres Kuorum Terhadap Target K */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                        Akumulasi Suara Setuju: <strong className="text-primary">{kuorum.suara_setuju_bobot}</strong> / Target {kuorum.target_k} K
                    </span>
                    <span className="font-bold text-foreground">
                        {kuorum.persentase_setuju}%
                    </span>
                </div>
                <Progress value={kuorum.persentase_setuju} className="h-2" />
            </div>

            {/* Statistik Suara */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/30 p-2.5 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Pemilih</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{kuorum.total_pemilih} Warga</p>
                </div>
                <div className="rounded-lg bg-emerald-500/5 p-2.5 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3" />
                        <span>Bobot Setuju</span>
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                        +{kuorum.suara_setuju_bobot}
                    </p>
                </div>
                <div className="rounded-lg bg-destructive/5 p-2.5 border border-destructive/20">
                    <p className="text-[10px] text-destructive uppercase font-semibold flex items-center justify-center gap-1">
                        <XCircle className="size-3" />
                        <span>Bobot Tolak</span>
                    </p>
                    <p className="font-bold text-destructive text-sm mt-0.5">
                        -{kuorum.suara_tolak_bobot}
                    </p>
                </div>
            </div>

            {/* Batas Waktu 14 Hari */}
            {kuorum.batas_waktu && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>
                        Batas waktu ronde: {new Date(kuorum.batas_waktu).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })} (Jendela 14 hari kalender)
                    </span>
                </div>
            )}

            {/* Daftar Alasan Penolakan Warga jika ada */}
            {kuorum.alasan_penolakan && kuorum.alasan_penolakan.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                        <AlertTriangle className="size-3.5" />
                        <span>Catatan Keberatan Warga ({kuorum.alasan_penolakan.length}):</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {kuorum.alasan_penolakan.map((item, idx) => (
                            <div key={idx} className="rounded-lg bg-card p-2 border border-border/60 text-xs space-y-1">
                                <p className="text-muted-foreground italic">&ldquo;{item.alasan}&rdquo;</p>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                                    <span>Jalur {item.jalur} (Bobot {item.jalur === 'A' ? '1.0' : '0.5'})</span>
                                    <span>{new Date(item.waktu).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

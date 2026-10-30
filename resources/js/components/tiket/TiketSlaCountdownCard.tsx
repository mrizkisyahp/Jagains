import { Clock, AlertTriangle, ShieldAlert, Users, CheckCircle2, Info } from 'lucide-react';
import { TiketDetail } from '@/types/tiket';

interface TiketSlaCountdownCardProps {
    tiket: TiketDetail;
}

export default function TiketSlaCountdownCard({ tiket }: TiketSlaCountdownCardProps) {
    const getCardTheme = () => {
        switch (tiket.kondisi_sla) {
            case 'dalam_sla':
                return {
                    border: 'border-emerald-500/30',
                    bg: 'bg-emerald-500/5',
                    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                    icon: <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />,
                    title: 'Dalam Batas Waktu Layanan (SLA)',
                    desc: tiket.sisa_sla_teks || 'Instansi sedang menjalankan penanganan sesuai jadwal kerja resmi.',
                };
            case 'hampir_lewat':
                return {
                    border: 'border-amber-500/30',
                    bg: 'bg-amber-500/5',
                    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                    icon: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />,
                    title: 'Peringatan: Batas Waktu Segera Berakhir',
                    desc: tiket.sisa_sla_teks || 'Tersisa kurang dari separuh alokasi waktu kerja standar untuk tahap ini.',
                };
            case 'lewat_sla':
                return {
                    border: 'border-destructive/30',
                    bg: 'bg-destructive/5',
                    badgeBg: 'bg-destructive/15 text-destructive',
                    icon: <ShieldAlert className="size-5 text-destructive" />,
                    title: 'Keterlambatan SLA Terekam Terbuka',
                    desc: tiket.sisa_sla_teks || 'Batas waktu pengerjaan telah terlewati. Data keterlambatan dicatat ke audit log publik dan diteruskan ke Auditor Independen.',
                };
            case 'menunggu_warga':
                return {
                    border: 'border-blue-500/30',
                    bg: 'bg-blue-500/5',
                    badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
                    icon: <Users className="size-5 text-blue-600 dark:text-blue-400" />,
                    title: 'Menunggu Keputusan Kuorum Warga',
                    desc: tiket.sisa_sla_teks || 'Pekerjaan fisik dinas telah diajukan. Penutupan tiket bergantung sepenuhnya pada verifikasi warga kelurahan setempat.',
                };
            case 'selesai':
            default:
                return {
                    border: 'border-slate-500/30',
                    bg: 'bg-slate-500/5',
                    badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
                    icon: <CheckCircle2 className="size-5 text-slate-600 dark:text-slate-400" />,
                    title: tiket.status === 'DITOLAK' ? 'Laporan Ditolak Instansi' : 'Penanganan Selesai dan Sah',
                    desc: tiket.sisa_sla_teks || 'Seluruh tahapan perbaikan telah terpenuhi dan disahkan.',
                };
        }
    };

    const theme = getCardTheme();

    return (
        <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 transition-all`}>
            <div className="flex items-start gap-4">
                <div className="rounded-xl bg-background p-2.5 shadow-2xs shrink-0 border border-border/50">
                    {theme.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display text-sm md:text-base font-bold text-foreground">
                            {theme.title}
                        </h2>
                        {tiket.sisa_hari_sla !== null && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${theme.badgeBg}`}>
                                {tiket.sisa_hari_sla > 0
                                    ? `Sisa ${tiket.sisa_hari_sla} Hari Kerja`
                                    : tiket.sisa_hari_sla === 0
                                    ? 'Hari Terakhir SLA'
                                    : `Terlambat ${Math.abs(tiket.sisa_hari_sla)} Hari Kerja`}
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {theme.desc}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2.5">
                        <Info className="size-3.5 shrink-0" />
                        <span>
                            SLA dihitung berdasarkan hari kerja resmi (Senin–Jumat) di luar akhir pekan dan hari libur nasional Kota Depok.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

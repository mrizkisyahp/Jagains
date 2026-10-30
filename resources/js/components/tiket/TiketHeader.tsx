import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    MapPin,
    Share2,
    ThumbsUp,
    Flag,
    Copy,
    Check,
    Calendar,
    Building2,
    ShieldAlert,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Users,
    Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { TiketDetail } from '@/types/tiket';

interface TiketHeaderProps {
    tiket: TiketDetail;
    onToggleDukungan: () => void;
    onOpenLaporKonten: () => void;
    loadingDukungan?: boolean;
    userRole?: string | null;
}

export default function TiketHeader({
    tiket,
    onToggleDukungan,
    onOpenLaporKonten,
    loadingDukungan = false,
    userRole,
}: TiketHeaderProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyNomor = () => {
        navigator.clipboard.writeText(tiket.nomor_tiket);
        setCopied(true);
        toast.success('Nomor Tiket Disalin', `Kode ${tiket.nomor_tiket} siap digunakan.`);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: `Tiket Aduan Jagains: ${tiket.nomor_tiket}`,
            text: `Pantau penanganan aduan fasilitas publik "${tiket.judul}" di Kelurahan ${tiket.kelurahan_nama}, Kota Depok:`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                toast.success('Tautan Dibagikan');
                return;
            } catch {
                // User cancelled or fallback
            }
        }

        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Tautan Disalin ke Clipboard', 'Tautan detail tiket publik dapat Anda bagikan.');
    };

    const getKeparahanBadge = (keparahan: string) => {
        switch (keparahan) {
            case 'berat':
                return <Badge variant="destructive" className="capitalize text-[11px] font-semibold">Tingkat Berat</Badge>;
            case 'sedang':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 capitalize text-[11px] font-semibold">Tingkat Sedang</Badge>;
            default:
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 capitalize text-[11px] font-semibold">Tingkat Ringan</Badge>;
        }
    };

    const getSlaBadge = (kondisi: string) => {
        switch (kondisi) {
            case 'dalam_sla':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1.5 py-1 px-2.5">
                        <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Dalam SLA</span>
                    </Badge>
                );
            case 'hampir_lewat':
                return (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1.5 py-1 px-2.5">
                        <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Hampir Lewat SLA</span>
                    </Badge>
                );
            case 'lewat_sla':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5">
                        <ShieldAlert className="size-3.5" />
                        <span>Lewat SLA (Terekam)</span>
                    </Badge>
                );
            case 'menunggu_warga':
                return (
                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 flex items-center gap-1.5 py-1 px-2.5">
                        <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Kuorum Warga</span>
                    </Badge>
                );
            case 'selesai':
            default:
                return (
                    <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 flex items-center gap-1.5 py-1 px-2.5">
                        <CheckCircle2 className="size-3.5 text-slate-600 dark:text-slate-400" />
                        <span>Selesai</span>
                    </Badge>
                );
        }
    };

    const isFinalStatus = ['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR', 'DITOLAK'].includes(tiket.status);

    return (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
            {/* Baris Atas: Nomor Tiket & Aksi Cepat */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Kode Tiket:
                    </span>
                    <button
                        type="button"
                        onClick={handleCopyNomor}
                        className="group inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold text-foreground hover:bg-muted/80 transition-colors cursor-pointer border border-border/60"
                        title="Klik untuk menyalin nomor tiket"
                    >
                        <span>{tiket.nomor_tiket}</span>
                        {copied ? (
                            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <Copy className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Tombol Bagikan */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                    >
                        <Share2 className="size-3.5" />
                        <span>Bagikan</span>
                    </Button>

                    {/* Tombol Dukungan Warga (hanya jika warga atau publik tamu) */}
                    {(!userRole || userRole === 'warga') && (
                        <Button
                            variant={tiket.sudah_didukung ? 'default' : 'outline'}
                            size="sm"
                            onClick={onToggleDukungan}
                            disabled={loadingDukungan || isFinalStatus}
                            className={`h-8 gap-1.5 text-xs font-medium cursor-pointer ${
                                tiket.sudah_didukung
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'hover:border-primary hover:text-primary'
                            }`}
                            title={
                                isFinalStatus
                                    ? 'Tiket telah berstatus final'
                                    : tiket.sudah_didukung
                                    ? 'Batalkan dukungan'
                                    : 'Dukung laporan ini'
                            }
                        >
                            <ThumbsUp className={`size-3.5 ${tiket.sudah_didukung ? 'fill-current' : ''}`} />
                            <span>{tiket.sudah_didukung ? 'Didukung' : 'Dukung'}</span>
                            <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-bold">
                                {tiket.total_dukungan}
                            </span>
                        </Button>
                    )}

                    {/* Tombol Lapor Pelanggaran Konten */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenLaporKonten}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Laporkan konten ini jika melanggar pedoman"
                    >
                        <Flag className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Judul & Status Dua Lapisan */}
            <div className="pt-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Layer 1: Status Administratif */}
                    <Badge variant="outline" className="font-semibold text-xs tracking-wide py-1 px-2.5 bg-background">
                        {tiket.status.replace(/_/g, ' ')}
                    </Badge>

                    {/* Layer 2: Status Kondisi SLA Semantik */}
                    {getSlaBadge(tiket.kondisi_sla)}

                    {/* Badge Keparahan */}
                    {getKeparahanBadge(tiket.keparahan)}
                </div>

                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                    {tiket.judul}
                </h1>
            </div>

            {/* Meta Informasi & Tombol Navigasi Spasial */}
            <div className="pt-4 mt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    {/* Kategori Fasilitas */}
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{tiket.kategori_nama}</span>
                    </div>

                    <span className="text-border">•</span>

                    {/* Instansi Penanggung Jawab */}
                    <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span>{tiket.instansi_nama || 'Menunggu Disposisi Dinas'}</span>
                    </div>

                    <span className="text-border">•</span>

                    {/* Wilayah */}
                    <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>Kel. {tiket.kelurahan_nama}, Kec. {tiket.kecamatan_nama}</span>
                    </div>

                    <span className="text-border">•</span>

                    {/* Waktu Pelaporan */}
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>{new Date(tiket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* Tombol Deep Linking ke Peta */}
                <Link
                    href={`/peta?fokus=${encodeURIComponent(tiket.nomor_tiket)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
                >
                    <MapPin className="size-3.5 transition-transform group-hover:scale-110" />
                    <span>Lihat Titik di Peta Kota</span>
                </Link>
            </div>
        </div>
    );
}

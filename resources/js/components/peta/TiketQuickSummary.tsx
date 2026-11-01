import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { TitikLaporanPeta } from '@/types/peta';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    MapPin,
    Clock,
    ThumbsUp,
    ExternalLink,
    Share2,
    Check,
    X,
    Building2,
    ShieldAlert,
    ShieldCheck,
    Hourglass,
    AlertTriangle,
    Users,
    CheckCheck,
} from 'lucide-react';
import { cn } from 'cn';

interface TiketQuickSummaryProps {
    tiket: TitikLaporanPeta | null;
    onClose: () => void;
    className?: string;
}

export default function TiketQuickSummary({ tiket, onClose, className }: TiketQuickSummaryProps) {
    const [copied, setCopied] = useState(false);

    if (!tiket) return null;

    const handleCopyLink = () => {
        const url = `${window.location.origin}/tiket/${tiket.nomor_tiket}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Render Icon SLA
    const renderSlaIcon = () => {
        switch (tiket.kondisi_sla) {
            case 'lewat_sla':
                return <AlertTriangle className="size-4 shrink-0 text-rose-500" />;
            case 'hampir_lewat':
                return <Hourglass className="size-4 shrink-0 text-amber-500" />;
            case 'menunggu_warga':
                return <Users className="size-4 shrink-0 text-blue-500" />;
            case 'selesai':
                return <CheckCheck className="size-4 shrink-0 text-slate-500" />;
            case 'dalam_sla':
            default:
                return <ShieldCheck className="size-4 shrink-0 text-emerald-500" />;
        }
    };

    return (
        <div className={cn("fixed inset-x-0 bottom-0 z-1000 p-3 sm:p-4 md:absolute md:inset-auto md:bottom-6 md:left-6 md:w-[420px] pointer-events-none transition-all duration-300", className)}>
            <Card className="pointer-events-auto bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl overflow-hidden p-4 sm:p-5 space-y-4">
                {/* Header: Nomor Tiket & Tombol Tutup */}
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-body-sm font-bold text-primary tracking-wide">
                            {tiket.nomor_tiket}
                        </span>
                        <Badge variant="outline" className="text-caption-xs font-semibold px-2 py-0.5 rounded-md border-border">
                            {tiket.kategori_nama}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyLink}
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Salin Tautan Tiket"
                        >
                            {copied ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Tutup Ringkasan"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Judul Laporan */}
                <div>
                    <h3 className="font-display text-body-medium font-bold text-foreground leading-snug">
                        {tiket.judul}
                    </h3>
                    <p className="flex items-center gap-1.5 text-caption-xs text-muted-foreground mt-1">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                        <span>
                            Kel. {tiket.kelurahan_nama}, Kec. {tiket.kecamatan_nama}
                        </span>
                    </p>
                </div>

                {/* Indikator Status Dua Lapisan (Sistem & Fisik/SLA) */}
                <div className="p-3 bg-muted/50 rounded-xl border border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-caption-xs">
                        <span className="text-muted-foreground font-medium">Status Administrasi:</span>
                        <Badge variant="secondary" className="font-semibold text-caption-xs uppercase tracking-wider px-2 py-0.5">
                            {tiket.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-caption-xs pt-1 border-t border-border/40">
                        <span className="text-muted-foreground font-medium">Kondisi Batas Waktu SLA:</span>
                        <div className="flex items-center gap-1.5">
                            <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: tiket.warna_sla }}
                            />
                            <span
                                className="font-bold text-caption-xs"
                                style={{ color: tiket.warna_sla }}
                            >
                                {tiket.label_sla}
                            </span>
                        </div>
                    </div>

                    {/* Deskripsi Sisa Waktu SLA */}
                    <div className="flex items-start gap-2 pt-1 text-caption-xs text-muted-foreground font-medium">
                        {renderSlaIcon()}
                        <span className="leading-tight">{tiket.sisa_sla_teks}</span>
                    </div>
                </div>

                {/* Info Instansi & Dukungan Warga */}
                <div className="flex items-center justify-between text-caption-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                        <Building2 className="size-3.5 shrink-0" />
                        <span className="truncate">{tiket.instansi_nama || 'Belum Ditugaskan'}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-semibold text-foreground">
                        <ThumbsUp className="size-3.5 text-primary" />
                        <span>{tiket.jumlah_dukungan} Dukungan</span>
                    </div>
                </div>

                {/* Tombol Aksi Detail Tiket Publik (FR-TKT-01) */}
                <div className="pt-1">
                    <Link
                        href={`/tiket/${tiket.nomor_tiket}`}
                        className={cn(
                            buttonVariants({ variant: 'default' }),
                            'w-full h-10 font-semibold gap-2 shadow-sm rounded-xl'
                        )}
                    >
                        <span>Lihat Detail Lengkap</span>
                        <ExternalLink className="size-4" />
                    </Link>
                </div>
            </Card>
        </div>
    );
}

import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { TitikLaporanPeta } from '@/types/peta';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    MapPin,
    ThumbsUp,
    ArrowRight,
    Share2,
    Check,
    X,
    ShieldCheck,
    AlertTriangle,
    Hourglass,
    Users,
    CheckCheck,
    ImageIcon,
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

    // Helper variant & label badge SLA
    const getBadgeConfig = () => {
        switch (tiket.kondisi_sla) {
            case 'lewat_sla':
                return {
                    variant: 'sla-late' as const,
                    icon: <AlertTriangle className="size-3 shrink-0" />,
                    label: tiket.label_sla || 'Lewat SLA',
                };
            case 'hampir_lewat':
                return {
                    variant: 'sla-warn' as const,
                    icon: <Hourglass className="size-3 shrink-0" />,
                    label: tiket.label_sla || 'Mendekati Batas',
                };
            case 'menunggu_warga':
                return {
                    variant: 'stage-verify' as const,
                    icon: <Users className="size-3 shrink-0" />,
                    label: tiket.label_sla || 'Verifikasi Warga',
                };
            case 'selesai':
                return {
                    variant: 'closed' as const,
                    icon: <CheckCheck className="size-3 shrink-0" />,
                    label: 'Selesai Diverifikasi',
                };
            case 'dalam_sla':
            default:
                return {
                    variant: 'sla-safe' as const,
                    icon: <ShieldCheck className="size-3 shrink-0" />,
                    label: tiket.label_sla || 'Aman SLA',
                };
        }
    };

    const badgeConfig = getBadgeConfig();

    return (
        <div
            className={cn(
                'fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 md:right-16 sm:w-[320px] md:w-[340px] pointer-events-none transition-all duration-300',
                className
            )}
        >
            <Card className="pointer-events-auto overflow-hidden rounded-2xl bg-card border border-border shadow-2xl p-0 transition-all duration-200">
                {/* 1. Gambar Laporan (Sesuai Referensi image 21.png) */}
                <div className="relative w-full h-44 sm:h-48 bg-muted overflow-hidden flex items-center justify-center">
                    {tiket.foto_url ? (
                        <img
                            src={tiket.foto_url}
                            alt={tiket.judul}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                                // Fallback jika gambar gagal dimuat
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/50 text-muted-foreground p-4">
                            <ImageIcon className="size-10 mb-2 opacity-40 text-foreground" />
                            <span className="text-caption-xs font-medium text-center">
                                Dokumentasi Titik Laporan
                            </span>
                        </div>
                    )}

                    {/* Tombol Aksi di Sudut Atas Gambar */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={handleCopyLink}
                            className="size-8 rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-sm hover:bg-background"
                            title="Salin Tautan Tiket"
                        >
                            {copied ? <Check className="size-3.5 text-sla-safe" /> : <Share2 className="size-3.5" />}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={onClose}
                            className="size-8 rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-sm hover:bg-background"
                            title="Tutup Ringkasan"
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>

                    {/* Kategori Badge di Kiri Atas */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                        <Badge variant="outline" className="bg-background/90 backdrop-blur-md text-caption-xs font-semibold px-2 py-0.5 rounded-full border-border">
                            {tiket.kategori_nama}
                        </Badge>
                    </div>
                </div>

                {/* Konten Utama Card: Judul, Lokasi, Status, Dukungan */}
                <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Status SLA */}
                    <div className="flex items-center justify-between gap-2">
                        <Badge variant={badgeConfig.variant} className="text-caption-xs font-semibold gap-1.5 px-2.5 py-0.5">
                            {badgeConfig.icon}
                            <span>{badgeConfig.label}</span>
                        </Badge>
                        <span className="font-mono text-caption-xs font-semibold text-muted-foreground">
                            {tiket.nomor_tiket}
                        </span>
                    </div>

                    {/* 2. Judul Laporan */}
                    <h3 className="font-display text-body-base font-bold text-foreground leading-snug line-clamp-2">
                        {tiket.judul}
                    </h3>

                    {/* 3. Lokasi */}
                    <p className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                            Kel. {tiket.kelurahan_nama}, Kec. {tiket.kecamatan_nama}
                        </span>
                    </p>

                    {/* 4. Jumlah Dukungan & Instansi */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-caption-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <ThumbsUp className="size-3.5 text-primary" />
                            <span>{tiket.jumlah_dukungan} Dukungan Warga</span>
                        </div>
                    </div>

                    {/* 5. Aksi Lihat Detail Lengkap */}
                    <div className="pt-1">
                        <Link
                            href={`/tiket/${tiket.nomor_tiket}`}
                            className={cn(
                                buttonVariants({ variant: 'default' }),
                                'w-full h-10 font-semibold gap-2 shadow-xs rounded-xl justify-center'
                            )}
                        >
                            <span>Lihat Detail Lengkap</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

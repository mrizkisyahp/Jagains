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

export default function TiketQuickSummary({
    tiket,
    onClose,
    className,
}: TiketQuickSummaryProps) {
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
                'pointer-events-none fixed inset-x-4 bottom-4 z-40 transition-all duration-300 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[320px] md:right-16 md:w-[340px]',
                className,
            )}
        >
            <Card className="pointer-events-auto overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl transition-all duration-200">
                {/* 1. Gambar Laporan (Sesuai Referensi image 21.png) */}
                <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-muted sm:h-48">
                    {tiket.foto_url ? (
                        <img
                            src={tiket.foto_url}
                            alt={tiket.judul}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                                // Fallback jika gambar gagal dimuat
                                (e.target as HTMLElement).style.display =
                                    'none';
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/50 p-4 text-muted-foreground">
                            <ImageIcon className="mb-2 size-10 text-foreground opacity-40" />
                            <span className="text-center text-caption-xs font-medium">
                                Dokumentasi Titik Laporan
                            </span>
                        </div>
                    )}

                    {/* Tombol Aksi di Sudut Atas Gambar */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={handleCopyLink}
                            className="size-8 rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
                            title="Salin Tautan Tiket"
                        >
                            {copied ? (
                                <Check className="size-3.5 text-sla-safe" />
                            ) : (
                                <Share2 className="size-3.5" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={onClose}
                            className="size-8 rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
                            title="Tutup Ringkasan"
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>

                    {/* Kategori Badge di Kiri Atas */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                        <Badge
                            variant="outline"
                            className="rounded-full border-border bg-background/90 px-2 py-0.5 text-caption-xs font-semibold backdrop-blur-md"
                        >
                            {tiket.kategori_nama}
                        </Badge>
                    </div>
                </div>

                {/* Konten Utama Card: Judul, Lokasi, Status, Dukungan */}
                <div className="space-y-3.5 p-4 sm:p-5">
                    {/* Status SLA & Nomor Tiket */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <Badge
                            variant={badgeConfig.variant}
                            className="shrink-0 gap-1.5 px-2.5 py-0.5 text-caption-xs font-semibold"
                        >
                            {badgeConfig.icon}
                            <span>{badgeConfig.label}</span>
                        </Badge>
                        <span className="text-caption-xs font-mono font-semibold whitespace-nowrap text-muted-foreground">
                            #{tiket.nomor_tiket}
                        </span>
                    </div>

                    {/* 2. Judul Laporan */}
                    <h3 className="line-clamp-2 text-body-base font-display leading-snug font-bold text-foreground">
                        {tiket.judul}
                    </h3>

                    {/* 3. Lokasi */}
                    <p className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            Kel. {tiket.kelurahan_nama}, Kec.{' '}
                            {tiket.kecamatan_nama}
                        </span>
                    </p>

                    {/* 4. Jumlah Dukungan & Instansi */}
                    <div className="flex items-center justify-between border-t border-border/60 pt-2 text-caption-xs">
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
                                'h-10 w-full justify-center gap-2 rounded-xl font-semibold shadow-xs',
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

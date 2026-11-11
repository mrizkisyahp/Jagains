import { useState } from 'react';
import {
    ThumbsUp,
    AlertCircle,
    ArrowRight,
    ShieldCheck,
    MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface LaporanKandidat {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    status: string;
    jarak_m: number;
    jumlah_dukungan: number;
    foto_url: string | null;
}

interface SimilarReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    kandidat: LaporanKandidat[];
    onSupportExisting: (laporanId: number) => Promise<void>;
    onProceedNewReport: () => void;
    isSubmitting: boolean;
}

export default function SimilarReportsModal({
    isOpen,
    onClose,
    kandidat,
    onSupportExisting,
    onProceedNewReport,
    isSubmitting,
}: SimilarReportsModalProps) {
    const [supportingId, setSupportingId] = useState<number | null>(null);

    const handleSupport = async (id: number) => {
        setSupportingId(id);
        try {
            await onSupportExisting(id);
        } finally {
            setSupportingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90dvh] w-full min-w-0 gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <DialogHeader className="min-w-0">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <AlertCircle className="size-5 shrink-0" />
                        <DialogTitle className="text-display-md font-display font-bold">
                            Ditemukan Laporan Serupa di Dekat Anda
                        </DialogTitle>
                    </div>
                    <DialogDescription className="pt-1 text-body-sm break-words text-muted-foreground">
                        Sistem mendeteksi ada aduan terbuka berkategori sama
                        dalam radius lokasi Anda. Anda dapat{' '}
                        <strong>mendukung aduan yang sudah ada</strong> untuk
                        mempercepat penanganan dinas, atau tetap membuat aduan
                        baru jika kerusakannya berbeda.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 w-full min-w-0 space-y-3.5">
                    {kandidat.map((item) => (
                        <div
                            key={item.id}
                            className="w-full min-w-0 space-y-2.5 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/50"
                        >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="shrink-0 text-caption-xs font-mono font-bold text-primary">
                                            {item.nomor_tiket}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="h-4 shrink-0 py-0 text-[10px]"
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <h4 className="line-clamp-1 text-body-medium font-display font-semibold break-words text-foreground">
                                        {item.judul}
                                    </h4>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2.5 py-0.5 text-caption-xs font-medium text-muted-foreground">
                                    <MapPin className="size-3 text-destructive" />
                                    ~{Math.round(item.jarak_m)} m
                                </span>
                            </div>

                            <p className="line-clamp-3 text-body-sm leading-relaxed [overflow-wrap:anywhere] break-words text-muted-foreground">
                                {item.keterangan}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-2">
                                <span className="flex shrink-0 items-center gap-1.5 text-body-sm text-muted-foreground">
                                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    {item.jumlah_dukungan} warga mendukung
                                </span>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSupport(item.id)}
                                    disabled={
                                        isSubmitting || supportingId !== null
                                    }
                                    className="h-9 gap-1.5 font-medium"
                                >
                                    <ThumbsUp className="size-3.5" />
                                    {supportingId === item.id
                                        ? 'Mendukung...'
                                        : 'Dukung Aduan Ini'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onProceedNewReport}
                        disabled={isSubmitting || supportingId !== null}
                        className="order-2 gap-1.5 text-body-sm text-muted-foreground hover:text-foreground sm:order-1"
                    >
                        Kerusakan Berbeda, Tetap Buat Laporan Baru
                        <ArrowRight className="size-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

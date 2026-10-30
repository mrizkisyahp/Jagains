import { useState } from 'react';
import { ThumbsUp, AlertCircle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
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
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <AlertCircle className="size-5" />
                        <DialogTitle className="font-display text-display-md font-bold">
                            Ditemukan Laporan Serupa di Dekat Anda
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-body-sm text-muted-foreground pt-1">
                        Sistem mendeteksi ada aduan terbuka berkategori sama dalam radius lokasi Anda (FR-LAP-05). 
                        Anda dapat <strong>mendukung aduan yang sudah ada</strong> untuk mempercepat penanganan dinas, 
                        atau tetap membuat aduan baru jika kerusakannya berbeda.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 my-2">
                    {kandidat.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors space-y-2.5 shadow-xs"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-caption-xs font-bold text-primary">
                                            {item.nomor_tiket}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <h4 className="font-display text-body-medium font-semibold text-foreground line-clamp-1">
                                        {item.judul}
                                    </h4>
                                </div>
                                <span className="inline-flex items-center gap-1 text-caption-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md shrink-0">
                                    <MapPin className="size-3 text-destructive" />
                                    ~{Math.round(item.jarak_m)} m
                                </span>
                            </div>

                            <p className="text-body-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {item.keterangan}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-border/80">
                                <span className="text-body-sm text-muted-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    {item.jumlah_dukungan} warga mendukung
                                </span>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSupport(item.id)}
                                    disabled={isSubmitting || supportingId !== null}
                                    className="gap-1.5 font-medium h-9"
                                >
                                    <ThumbsUp className="size-3.5" />
                                    {supportingId === item.id ? 'Mendukung...' : 'Dukung Aduan Ini'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onProceedNewReport}
                        disabled={isSubmitting || supportingId !== null}
                        className="text-body-sm gap-1.5 order-2 sm:order-1 text-muted-foreground hover:text-foreground"
                    >
                        Kerusakan Berbeda, Tetap Buat Laporan Baru
                        <ArrowRight className="size-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


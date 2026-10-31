import { useState } from 'react';
import { router } from '@inertiajs/react';
import { MessageSquareText, Loader2, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

interface ModalTanggapanResmiProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalTanggapanResmi({
    open,
    onClose,
    laporan,
}: ModalTanggapanResmiProps) {
    const [tanggapan, setTanggapan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tanggapan.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/tanggapan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ tanggapan: tanggapan.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Tanggapan Terbit', data.pesan);
                onClose();
                setTanggapan('');
                router.reload({ only: ['antrean'] });
            } else {
                toast.error('Gagal Mengunggah Tanggapan', data.message || 'Terjadi kesalahan sistem.');
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
                            <MessageSquareText className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Terbitkan Tanggapan Resmi</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Pernyataan resmi instansi akan disematkan secara terbuka pada linimasa tiket publik untuk dibaca warga pelapor dan masyarakat luas (FR-TIK-09).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="teks-tanggapan" className="text-body-sm font-semibold">
                                Pernyataan Resmi Dinas <span className="text-destructive">*</span>
                            </Label>
                            <span className={`text-caption-xs ${tanggapan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                {tanggapan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - tanggapan.trim().length} lagi)`}
                            </span>
                        </div>
                        <Textarea
                            id="teks-tanggapan"
                            placeholder="Tuliskan pernyataan resmi instansi terkait progres lapangan, koordinasi lintas dinas, atau penjelasan teknis kepada publik..."
                            value={tanggapan}
                            onChange={(e) => setTanggapan(e.target.value)}
                            rows={4}
                            className="text-body-sm rounded-xl resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || tanggapan.trim().length < 10}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menerbitkan...
                                </>
                            ) : (
                                <>
                                    Terbitkan Tanggapan
                                    <Send className="size-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

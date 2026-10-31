import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Hammer, Loader2, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

interface ModalMulaiPengerjaanProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalMulaiPengerjaan({
    open,
    onClose,
    laporan,
}: ModalMulaiPengerjaanProps) {
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/mulai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ catatan: catatan.trim() || undefined }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Pengerjaan Dimulai', data.pesan);
                onClose();
                setCatatan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Memulai Pengerjaan', data.message || 'Terjadi kesalahan sistem.');
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
                        <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                            <Hammer className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Mulai Pengerjaan Fisik</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Status tiket akan diperbarui menjadi <span className="font-semibold text-foreground">DIKERJAKAN</span>. Tim teknis di lapangan dapat menerbitkan Berita Acara berkala dan memotret bukti perbaikan fisik di lokasi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="catatan-mulai" className="text-body-sm font-semibold">
                            Catatan Pengerjaan Lapangan <span className="text-caption-xs text-muted-foreground font-normal">(Opsional)</span>
                        </Label>
                        <Textarea
                            id="catatan-mulai"
                            placeholder="Contoh: Alat berat dan armada pengangkut material telah tiba di lokasi. Pengerjaan dimulai..."
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={3}
                            className="text-body-sm rounded-xl resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    Mulai Pengerjaan
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

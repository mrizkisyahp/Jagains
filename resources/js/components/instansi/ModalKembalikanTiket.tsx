import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Undo2, AlertCircle, Loader2 } from 'lucide-react';
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

interface ModalKembalikanTiketProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalKembalikanTiket({
    open,
    onClose,
    laporan,
}: ModalKembalikanTiketProps) {
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (alasan.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/kembalikan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ alasan: alasan.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Tiket Dikembalikan', data.pesan);
                onClose();
                setAlasan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Mengembalikan Tiket', data.message || 'Terjadi kesalahan sistem.');
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
                        <div className="size-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mb-2">
                            <Undo2 className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Kembalikan ke Admin</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Tiket akan berstatus <span className="font-semibold text-foreground">PERLU_ROUTING</span> dan masuk ke meja Administrator Sistem untuk penentuan ulang dinas penanggung jawab (FR-ADM-05).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="alasan-kembalikan" className="text-body-sm font-semibold">
                                Alasan Pengembalian ke Admin <span className="text-destructive">*</span>
                            </Label>
                            <span className={`text-caption-xs ${alasan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                {alasan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - alasan.trim().length} lagi)`}
                            </span>
                        </div>
                        <Textarea
                            id="alasan-kembalikan"
                            placeholder="Jelaskan kendala penetapan kewenangan, aset lintas instansi, atau alasan penugasan administratif lainnya..."
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                            rows={3}
                            className="text-body-sm rounded-xl resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isSubmitting || alasan.trim().length < 10}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Mengembalikan...
                                </>
                            ) : (
                                <>
                                    Konfirmasi Kembalikan
                                    <Undo2 className="size-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

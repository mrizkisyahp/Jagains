import { useState } from 'react';
import { router } from '@inertiajs/react';
import { ClipboardCheck, Loader2, ArrowRight } from 'lucide-react';
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

interface ModalSurveiSelesaiProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalSurveiSelesai({
    open,
    onClose,
    laporan,
}: ModalSurveiSelesaiProps) {
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/survei`, {
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
                toast.success('Survei Ditandai Selesai', data.pesan);
                onClose();
                setCatatan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Menyelesaikan Survei', data.message || 'Terjadi kesalahan sistem.');
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
                            <ClipboardCheck className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Tandai Survei Selesai</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Status tiket akan diperbarui menjadi <span className="font-semibold text-foreground">DISURVEI</span>. SLA tahap penjadwalan anggaran (<span className="font-semibold text-foreground">10 hari kerja</span>) resmi dimulai.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="catatan-survei" className="text-body-sm font-semibold">
                            Catatan Temuan Lapangan & Dimensi Kerusakan <span className="text-caption-xs text-muted-foreground font-normal">(Opsional)</span>
                        </Label>
                        <Textarea
                            id="catatan-survei"
                            placeholder="Contoh: Telah disurvei tim teknis. Estimasi luas jalan berlubang 4x3 meter, kedalaman 8 cm, membutuhkan perkerasan agregat B..."
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
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    Selesaikan Survei
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

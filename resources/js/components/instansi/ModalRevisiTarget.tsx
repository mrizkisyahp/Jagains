import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CalendarClock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';

interface ModalRevisiTargetProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        tanggal_target: string | null;
        tanggal_target_format: string | null;
    } | null;
}

export default function ModalRevisiTarget({
    open,
    onClose,
    laporan,
}: ModalRevisiTargetProps) {
    const [tanggalTargetBaru, setTanggalTargetBaru] = useState('');
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tanggalTargetBaru || alasan.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/revisi-target`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    tanggal_target_baru: tanggalTargetBaru,
                    alasan: alasan.trim(),
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Tanggal Target Direvisi', data.pesan);
                onClose();
                setTanggalTargetBaru('');
                setAlasan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Merevisi Target', data.message || 'Terjadi kesalahan sistem.');
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
                            <CalendarClock className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Revisi Janji Tanggal Target</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Sesuai Parameter P-16, perpanjangan janji tanggal penyelesaian hanya dapat dilakukan <span className="font-semibold text-foreground">maksimal 2 kali</span> per tiket dengan alasan wajib yang transparan ke publik.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-caption-xs text-muted-foreground">Nomor Tiket:</span>
                            <span className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-caption-xs text-muted-foreground">Target Saat Ini:</span>
                            <span className="font-semibold text-foreground">{laporan.tanggal_target_format || laporan.tanggal_target}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tanggal-target-baru" className="text-body-sm font-semibold">
                            Tanggal Target Baru <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="tanggal-target-baru"
                            type="date"
                            min={today}
                            max={maxDateStr}
                            value={tanggalTargetBaru}
                            onChange={(e) => setTanggalTargetBaru(e.target.value)}
                            required
                            className="h-10 text-body-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="alasan-revisi" className="text-body-sm font-semibold">
                                Alasan Keterlambatan / Revisi <span className="text-destructive">*</span>
                            </Label>
                            <span className={`text-caption-xs ${alasan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                {alasan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - alasan.trim().length} lagi)`}
                            </span>
                        </div>
                        <Textarea
                            id="alasan-revisi"
                            placeholder="Jelaskan alasan kendala cuaca, keterlambatan pasokan material, atau hambatan teknis lainnya..."
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
                            disabled={isSubmitting || !tanggalTargetBaru || alasan.trim().length < 10}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    Simpan Revisi Target
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

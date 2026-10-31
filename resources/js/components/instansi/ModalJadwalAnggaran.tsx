import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CalendarDays, Coins, Loader2, ArrowRight } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

interface ModalJadwalAnggaranProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalJadwalAnggaran({
    open,
    onClose,
    laporan,
}: ModalJadwalAnggaranProps) {
    const [jenisPendanaan, setJenisPendanaan] = useState<string>('APBD_KOTA');
    const [tanggalTarget, setTanggalTarget] = useState<string>('');
    const [catatan, setCatatan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    // Batas maksimal 180 hari (P-15)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jenisPendanaan || !tanggalTarget) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/anggaran`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    jenis_pendanaan: jenisPendanaan,
                    tanggal_target: tanggalTarget,
                    catatan: catatan.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Jadwal Anggaran Ditetapkan', data.pesan);
                onClose();
                setTanggalTarget('');
                setCatatan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Menetapkan Anggaran', data.message || 'Terjadi kesalahan sistem.');
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
                        <div className="size-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 mb-2">
                            <Coins className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Jadwalkan Anggaran & Janji Target</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Status tiket akan menjadi <span className="font-semibold text-foreground">TERJADWAL_ANGGARAN</span>. Tanggal target menjadi komitmen publik yang transparan pada detail tiket (maksimal 180 hari sesuai Parameter P-15).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jenis-pendanaan" className="text-body-sm font-semibold">
                            Sumber Pendanaan <span className="text-destructive">*</span>
                        </Label>
                        <Select value={jenisPendanaan} onValueChange={(val) => setJenisPendanaan(val ?? 'APBD_KOTA')}>
                            <SelectTrigger id="jenis-pendanaan" className="w-full h-10 text-body-sm">
                                <SelectValue placeholder="Pilih Jenis Pendanaan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APBD_KOTA">APBD Kota / Pemda Setempat</SelectItem>
                                <SelectItem value="APBD_PROVINSI">APBD Provinsi</SelectItem>
                                <SelectItem value="APBN">APBN / Kementerian</SelectItem>
                                <SelectItem value="LAINNYA">Lainnya / Swasta / CSR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tanggal-target" className="text-body-sm font-semibold">
                            Janji Tanggal Target Selesai <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="tanggal-target"
                            type="date"
                            min={today}
                            max={maxDateStr}
                            value={tanggalTarget}
                            onChange={(e) => setTanggalTarget(e.target.value)}
                            required
                            className="h-10 text-body-sm"
                        />
                        <p className="text-caption-xs text-muted-foreground">
                            Maksimal s.d. {maxDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (180 hari).
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="catatan-anggaran" className="text-body-sm font-semibold">
                            Keterangan Rencana Kegiatan <span className="text-caption-xs text-muted-foreground font-normal">(Opsional)</span>
                        </Label>
                        <Textarea
                            id="catatan-anggaran"
                            placeholder="Contoh: Pekerjaan diplot pada mata anggaran pemeliharaan berkala triwulan berjalan..."
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={2}
                            className="text-body-sm rounded-xl resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !jenisPendanaan || !tanggalTarget} className="gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menetapkan...
                                </>
                            ) : (
                                <>
                                    Tetapkan Janji Target
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

import { useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowRightLeft, AlertTriangle, Loader2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';

interface InstansiItem {
    id: number;
    nama: string;
    singkatan: string;
}

interface ModalAlihkanTiketProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        jumlah_pengalihan: number;
    } | null;
    instansiList: InstansiItem[];
}

export default function ModalAlihkanTiket({
    open,
    onClose,
    laporan,
    instansiList,
}: ModalAlihkanTiketProps) {
    const [instansiTujuanId, setInstansiTujuanId] = useState<string>('');
    const [alasan, setAlasan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const sisaPengalihan = 2 - laporan.jumlah_pengalihan;
    const isMaksimal = sisaPengalihan <= 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isMaksimal || !instansiTujuanId || alasan.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/alihkan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    instansi_tujuan_id: Number(instansiTujuanId),
                    alasan: alasan.trim(),
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Pengalihan Berhasil', data.pesan);
                onClose();
                setInstansiTujuanId('');
                setAlasan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Mengalihkan Tiket', data.message || 'Terjadi kesalahan validasi.');
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
                            <ArrowRightLeft className="size-5" />
                        </div>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-body-large font-bold">Alihkan ke Instansi Lain</DialogTitle>
                            <Badge variant={isMaksimal ? 'destructive' : 'secondary'} className="font-mono text-caption-xs">
                                Pengalihan: {laporan.jumlah_pengalihan} / 2
                            </Badge>
                        </div>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Alihkan tanggung jawab penanganan ke OPD teknis berwenang lainnya sesuai Parameter P-07 (maksimal 2 kali pengalihan per tiket).
                        </DialogDescription>
                    </DialogHeader>

                    {isMaksimal ? (
                        <Alert variant="destructive" className="rounded-xl">
                            <AlertTriangle className="size-4" />
                            <AlertDescription className="text-body-sm space-y-1">
                                <p className="font-semibold">Batas Pengalihan Telah Habis</p>
                                <p className="text-caption-xs">
                                    Tiket ini telah dialihkan sebanyak 2 kali. Sesuai aturan akuntabilitas publik (ST-02), tiket tidak dapat dialihkan lagi. Anda dapat memprosesnya atau mengembalikannya ke Admin.
                                </p>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                                <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                                <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                                <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instansi-tujuan" className="text-body-sm font-semibold">
                                    Instansi Teknis Tujuan <span className="text-destructive">*</span>
                                </Label>
                                <Select value={instansiTujuanId} onValueChange={(val) => setInstansiTujuanId(val ?? '')}>
                                    <SelectTrigger id="instansi-tujuan" className="w-full h-10 text-body-sm">
                                        <SelectValue placeholder="-- Pilih Instansi Tujuan --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {instansiList.map((inst) => (
                                            <SelectItem key={inst.id} value={String(inst.id)} className="text-body-sm">
                                                {inst.nama} ({inst.singkatan})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="alasan-alihkan" className="text-body-sm font-semibold">
                                        Alasan Pengalihan Teknis <span className="text-destructive">*</span>
                                    </Label>
                                    <span className={`text-caption-xs ${alasan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                        {alasan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - alasan.trim().length} lagi)`}
                                    </span>
                                </div>
                                <Textarea
                                    id="alasan-alihkan"
                                    placeholder="Jelaskan alasan pengalihan, dasar kewenangan peraturan, atau koordinasi antar-dinas..."
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    rows={3}
                                    className="text-body-sm rounded-xl resize-none"
                                />
                            </div>
                        </>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        {!isMaksimal && (
                            <Button
                                type="submit"
                                disabled={isSubmitting || !instansiTujuanId || alasan.trim().length < 10}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Mengalihkan...
                                    </>
                                ) : (
                                    <>
                                        Konfirmasi Pengalihan
                                        <ArrowRightLeft className="size-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

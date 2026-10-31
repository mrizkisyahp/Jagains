import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    RotateCcw,
    Scale,
    Loader2,
    ShieldAlert,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { TiketDetail } from '@/types/tiket';

interface ModalResponsSengketaProps {
    open: boolean;
    onClose: () => void;
    laporan: TiketDetail | null;
    onSuccess?: () => void;
}

export default function ModalResponsSengketa({
    open,
    onClose,
    laporan,
    onSuccess,
}: ModalResponsSengketaProps) {
    const [pilihan, setPilihan] = useState<'kerjakan_ulang' | 'sanggah' | null>(null);
    const [alasanSanggah, setAlasanSanggah] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleClose = () => {
        setPilihan(null);
        setAlasanSanggah('');
        onClose();
    };

    const isReady =
        pilihan === 'kerjakan_ulang' ||
        (pilihan === 'sanggah' && alasanSanggah.trim().length >= 10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReady) return;

        setIsSubmitting(true);

        router.post(
            `/instansi/tiket/${laporan.nomor_tiket}/respons-sengketa`,
            {
                pilihan: pilihan,
                alasan_sanggah: pilihan === 'sanggah' ? alasanSanggah.trim() : null,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    toast.success('Jawaban sengketa resmi instansi berhasil diserahkan.');
                    handleClose();
                    onSuccess?.();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errs)[0];
                    toast.error(msg || 'Gagal mengirimkan tanggapan sengketa.');
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
            <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-1 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {laporan.nomor_tiket}
                        </Badge>
                        <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[11px] font-bold">
                            Tahap Sengketa Warga
                        </Badge>
                    </div>
                    <DialogTitle className="font-display text-lg font-bold text-foreground">
                        Respons Sengketa Penolakan Warga
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Hasil perbaikan fisik ditolak oleh kuorum warga setempat. Instansi memiliki waktu 7 hari kerja untuk memberikan respons resmi.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    {/* Ringkasan Laporan */}
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                            <ShieldAlert className="size-4 shrink-0" />
                            <span>Kuorum Penolakan Warga Terpenuhi</span>
                        </div>
                        <p className="text-xs font-bold text-foreground">{laporan.judul}</p>
                        <p className="text-[11px] text-muted-foreground">
                            Warga menilai pekerjaan belum tuntas atau tidak sesuai standar kontrak. Sesuai aturan P-04, Anda wajib memilih apakah bersedia melakukan pengerjaan ulang atau mengajukan sanggahan formal ke Auditor Independen.
                        </p>
                    </div>

                    {/* Dua Pilihan Sikap Instansi */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground">
                            Pilih Sikap Resmi Instansi:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPilihan('kerjakan_ulang')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    pilihan === 'kerjakan_ulang'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:border-primary/40'
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                                            <RotateCcw className="size-3.5 text-primary" /> Kerjakan Ulang
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Instansi menerima catatan warga dan berkomitmen memperbaiki ulang fisik di lapangan (Maksimal 3x).
                                    </p>
                                </div>
                                <span className="text-[10px] font-semibold text-primary pt-2">
                                    Status kembali DIKERJAKAN
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPilihan('sanggah')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    pilihan === 'sanggah'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:border-primary/40'
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                                            <Scale className="size-3.5 text-amber-600" /> Sanggah Penolakan
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Instansi menyatakan pekerjaan sudah sesuai spesifikasi dan meminta Auditor Independen memutuskan.
                                    </p>
                                </div>
                                <span className="text-[10px] font-semibold text-amber-600 pt-2">
                                    Dialihkan ke meja Auditor
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Form Alasan Sanggahan Teknis */}
                    {pilihan === 'sanggah' && (
                        <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <AlertTriangle className="size-3.5 text-amber-600" /> Alasan Sanggahan Teknis (Wajib):
                                </label>
                                <span
                                    className={`text-[10px] font-mono ${
                                        alasanSanggah.trim().length >= 10 ? 'text-emerald-600 font-semibold' : 'text-destructive'
                                    }`}
                                >
                                    {alasanSanggah.trim().length} / 10 karakter minimum
                                </span>
                            </div>
                            <Textarea
                                rows={3}
                                placeholder="Jelaskan spesifikasi teknis, bukti pengujian, atau justifikasi resmi mengapa klaim penolakan warga tidak berdasar..."
                                value={alasanSanggah}
                                onChange={(e) => setAlasanSanggah(e.target.value)}
                                className="text-xs bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Sanggahan dan alasan teknis Anda akan dicatat dalam audit log serta ditampilkan secara terbuka di linimasa publik.
                            </p>
                        </div>
                    )}

                    {/* Tombol Aksi Bawah */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!isReady || isSubmitting}
                            className="text-xs font-bold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Memproses...
                                </>
                            ) : (
                                'Kirim Respons Resmi'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

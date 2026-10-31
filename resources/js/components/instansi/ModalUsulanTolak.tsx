import { useState } from 'react';
import { router } from '@inertiajs/react';
import { ShieldX, Loader2, ArrowRight } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

interface ModalUsulanTolakProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalUsulanTolak({
    open,
    onClose,
    laporan,
}: ModalUsulanTolakProps) {
    const [alasanBaku, setAlasanBaku] = useState<string>('bukan_fasilitas_publik');
    const [keterangan, setKeterangan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!alasanBaku || keterangan.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/usul-tolak`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    alasan_baku: alasanBaku,
                    keterangan: keterangan.trim(),
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Usulan Penolakan Diajukan', data.pesan);
                onClose();
                setKeterangan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Mengajukan Penolakan', data.message || 'Terjadi kesalahan sistem.');
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
                            <ShieldX className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Usulkan Penolakan Tiket</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Status tiket akan menjadi <span className="font-semibold text-foreground">USULAN_TOLAK</span> dan diteruskan ke meja Auditor Independen untuk dinilai kepatutan hukumnya (FR-AUD-02).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                        <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                        <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                        <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="alasan-baku" className="text-body-sm font-semibold">
                            Kategori Alasan Baku <span className="text-destructive">*</span>
                        </Label>
                        <Select value={alasanBaku} onValueChange={(val) => setAlasanBaku(val ?? 'bukan_fasilitas_publik')}>
                            <SelectTrigger id="alasan-baku" className="w-full h-10 text-body-sm">
                                <SelectValue placeholder="Pilih Kategori Alasan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bukan_fasilitas_publik">Bukan Objek Fasilitas Publik</SelectItem>
                                <SelectItem value="lahan_privat">Berada di Lahan Privat / Perumahan Non-PSU</SelectItem>
                                <SelectItem value="laporan_fiktif">Objek Laporan Fiktif / Tidak Ditemukan</SelectItem>
                                <SelectItem value="dalam_sengketa_hukum">Sedang Dalam Sengketa Hukum / Kepolisian</SelectItem>
                                <SelectItem value="lainnya">Lainnya (Wajib Keterangan Rinci)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="keterangan-usul-tolak" className="text-body-sm font-semibold">
                                Uraian Keterangan Pendukung <span className="text-destructive">*</span>
                            </Label>
                            <span className={`text-caption-xs ${keterangan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                {keterangan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - keterangan.trim().length} lagi)`}
                            </span>
                        </div>
                        <Textarea
                            id="keterangan-usul-tolak"
                            placeholder="Uraikan fakta penolakan, nomor sertifikat/status PSU, atau bukti lain yang akan diperiksa oleh Auditor..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
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
                            disabled={isSubmitting || !alasanBaku || keterangan.trim().length < 10}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Meneruskan...
                                </>
                            ) : (
                                <>
                                    Kirim Usulan Tolak
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

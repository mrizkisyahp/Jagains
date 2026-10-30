import { useState } from 'react';
import { AlertTriangle, Flag, Loader2 } from 'lucide-react';
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

interface ModalLaporKontenProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nomorTiket: string;
    onBerhasil?: () => void;
}

const ALASAN_OPTIONS = [
    { value: 'sara_ujaran_kebencian', label: 'SARA atau Ujaran Kebencian', desc: 'Menghina suku, agama, ras, atau antargolongan.' },
    { value: 'foto_tidak_senonoh', label: 'Foto Tidak Senonoh / Asusila', desc: 'Memuat gambar vulgar, tidak pantas, atau kekerasan.' },
    { value: 'spam_promosi', label: 'Spam atau Promosi Komersial', desc: 'Tautan judi online, iklan produk, atau pesan berulang.' },
    { value: 'informasi_palsu', label: 'Informasi Palsu / Hoaks', desc: 'Foto tidak sesuai lokasi nyata atau laporan manipulatif.' },
    { value: 'pelanggaran_privasi', label: 'Pelanggaran Data Pribadi', desc: 'Menampilkan NIK, nomor telepon, atau wajah tanpa izin.' },
    { value: 'lainnya', label: 'Pelanggaran Lainnya', desc: 'Pelanggaran pedoman komunitas lainnya.' },
];

export default function ModalLaporKonten({
    open,
    onOpenChange,
    nomorTiket,
    onBerhasil,
}: ModalLaporKontenProps) {
    const [alasan, setAlasan] = useState('');
    const [catatan, setCatatan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!alasan) {
            setError('Pilihlah salah satu alasan pelanggaran yang sesuai.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/tiket/${nomorTiket}/lapor-konten`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    alasan,
                    catatan: catatan.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const pesan = data.pesan || (data.errors ? Object.values(data.errors)[0] : 'Gagal mengirim laporan.');
                setError(typeof pesan === 'string' ? pesan : (pesan as string[])[0]);
                toast.error('Gagal Melaporkan', typeof pesan === 'string' ? pesan : (pesan as string[])[0]);
                return;
            }

            toast.success('Laporan Diterima', 'Laporan Anda telah diteruskan ke antrean moderasi Administrator.');
            onOpenChange(false);
            setAlasan('');
            setCatatan('');
            onBerhasil?.();
        } catch {
            setError('Terjadi kendala jaringan saat mengirim laporan. Silakan coba lagi.');
            toast.error('Kesalahan Jaringan', 'Periksa koneksi Anda dan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive font-display text-lg">
                            <Flag className="size-5" />
                            Laporkan Konten Aduan
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm pt-1">
                            Bantu kami menjaga ruang pelaporan tetap aman dan kondusif. Aduan yang melanggar akan segera ditinjau oleh Administrator sistem.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">
                                Kategori Pelanggaran <span className="text-destructive">*</span>
                            </Label>
                            <div className="space-y-2">
                                {ALASAN_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm cursor-pointer transition-all ${
                                            alasan === opt.value
                                                ? 'border-primary bg-primary/5 text-foreground'
                                                : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="alasan"
                                            value={opt.value}
                                            checked={alasan === opt.value}
                                            onChange={() => {
                                                setAlasan(opt.value);
                                                setError(null);
                                            }}
                                            className="mt-1 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="font-medium text-foreground text-xs leading-none">{opt.label}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label htmlFor="catatan" className="text-xs font-semibold text-foreground">
                                    Keterangan Tambahan (Opsional)
                                </Label>
                                <span className="text-[11px] text-muted-foreground">{catatan.length}/500</span>
                            </div>
                            <Textarea
                                id="catatan"
                                placeholder="Jelaskan detail bagian foto atau kalimat yang melanggar pedoman..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value.slice(0, 500))}
                                rows={3}
                                className="text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={loading || !alasan}
                            className="gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Mengirim Laporan...
                                </>
                            ) : (
                                <>
                                    <Flag className="size-4" />
                                    Kirim Laporan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

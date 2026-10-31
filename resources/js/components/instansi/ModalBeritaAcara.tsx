import { useState } from 'react';
import { router } from '@inertiajs/react';
import { FileText, History, Plus, Loader2, ArrowRight } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';

interface BeritaAcaraItem {
    versi: number;
    kegiatan: string;
    hasil: string;
    hambatan?: string | null;
    waktu: string;
}

interface ModalBeritaAcaraProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        total_berita_acara: number;
        semua_berita_acara?: BeritaAcaraItem[];
    } | null;
}

export default function ModalBeritaAcara({
    open,
    onClose,
    laporan,
}: ModalBeritaAcaraProps) {
    const [tabActive, setTabActive] = useState<'baru' | 'riwayat'>('baru');
    const [kegiatan, setKegiatan] = useState('');
    const [hasil, setHasil] = useState('');
    const [hambatan, setHambatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!laporan) return null;

    const riwayatList = laporan.semua_berita_acara || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (kegiatan.trim().length < 10 || hasil.trim().length < 10) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/berita-acara`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    kegiatan: kegiatan.trim(),
                    hasil: hasil.trim(),
                    hambatan: hambatan.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Berita Acara Diterbitkan', data.pesan);
                onClose();
                setKegiatan('');
                setHasil('');
                setHambatan('');
                router.reload({ only: ['antrean'] });
            } else {
                toast.error('Gagal Menerbitkan Berita Acara', data.message || 'Terjadi kesalahan sistem.');
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="shrink-0">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <FileText className="size-5" />
                    </div>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-body-large font-bold">Berita Acara Lapangan (FR-TIK-07)</DialogTitle>
                        <Badge variant="secondary" className="font-mono text-caption-xs">
                            {riwayatList.length} Versi Tercatat
                        </Badge>
                    </div>
                    <DialogDescription className="text-body-sm text-muted-foreground">
                        Catatan kemajuan fisik append-only yang membentuk riwayat audit multi-versi dan dapat ditinjau oleh kuorum warga saat verifikasi.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tabActive} onValueChange={(v) => setTabActive(v as 'baru' | 'riwayat')} className="w-full flex-1 flex flex-col min-h-0 mt-2">
                    <TabsList className="grid grid-cols-2 shrink-0">
                        <TabsTrigger value="baru" className="gap-1.5 text-body-sm font-semibold">
                            <Plus className="size-3.5" />
                            Terbitkan Versi Baru
                        </TabsTrigger>
                        <TabsTrigger value="riwayat" className="gap-1.5 text-body-sm font-semibold">
                            <History className="size-3.5" />
                            Riwayat Versi ({riwayatList.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB TERBITKAN BERITA ACARA BARU */}
                    <TabsContent value="baru" className="flex-1 overflow-y-auto pr-1 mt-3 space-y-4">
                        <form onSubmit={handleSubmit} id="form-berita-acara" className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                                <p className="text-caption-xs text-muted-foreground">Nomor Tiket:</p>
                                <p className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</p>
                                <p className="text-caption-xs text-muted-foreground line-clamp-1">{laporan.judul}</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="ba-kegiatan" className="text-body-sm font-semibold">
                                        Kegiatan Fisik yang Dilaksanakan <span className="text-destructive">*</span>
                                    </Label>
                                    <span className={`text-caption-xs ${kegiatan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                        {kegiatan.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - kegiatan.trim().length} lagi)`}
                                    </span>
                                </div>
                                <Textarea
                                    id="ba-kegiatan"
                                    placeholder="Contoh: Penggalian permukaan aspal amblas, pemadatan pondasi agregat kelas A..."
                                    value={kegiatan}
                                    onChange={(e) => setKegiatan(e.target.value)}
                                    rows={3}
                                    className="text-body-sm rounded-xl resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="ba-hasil" className="text-body-sm font-semibold">
                                        Hasil Capaian Pekerjaan <span className="text-destructive">*</span>
                                    </Label>
                                    <span className={`text-caption-xs ${hasil.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive'}`}>
                                        {hasil.trim().length >= 10 ? '✓ Memenuhi syarat' : `Min. 10 karakter (${10 - hasil.trim().length} lagi)`}
                                    </span>
                                </div>
                                <Textarea
                                    id="ba-hasil"
                                    placeholder="Contoh: Permukaan aspal baru telah di-overlay setebal 5 cm, saluran air di tepi jalan dinormalisasi..."
                                    value={hasil}
                                    onChange={(e) => setHasil(e.target.value)}
                                    rows={3}
                                    className="text-body-sm rounded-xl resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ba-hambatan" className="text-body-sm font-semibold">
                                    Kendala Lapangan <span className="text-caption-xs text-muted-foreground font-normal">(Opsional)</span>
                                </Label>
                                <Textarea
                                    id="ba-hambatan"
                                    placeholder="Contoh: Arus lalu lintas padat sehingga pengerjaan digeser ke shift malam..."
                                    value={hambatan}
                                    onChange={(e) => setHambatan(e.target.value)}
                                    rows={2}
                                    className="text-body-sm rounded-xl resize-none"
                                />
                            </div>
                        </form>
                    </TabsContent>

                    {/* TAB RIWAYAT BERITA ACARA SEBELUMNYA */}
                    <TabsContent value="riwayat" className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
                        {riwayatList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="size-8 mx-auto opacity-30 mb-2" />
                                <p className="text-body-sm">Belum ada Berita Acara yang diterbitkan untuk tiket ini.</p>
                            </div>
                        ) : (
                            riwayatList.map((ba) => (
                                <div key={ba.versi} className="p-4 rounded-xl border border-border bg-card space-y-2">
                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                        <Badge variant="outline" className="font-mono font-bold">
                                            Versi {ba.versi}
                                        </Badge>
                                        <span className="text-caption-xs text-muted-foreground">{ba.waktu}</span>
                                    </div>
                                    <div className="text-body-sm space-y-1">
                                        <p className="font-semibold text-foreground">Kegiatan:</p>
                                        <p className="text-muted-foreground text-caption-xs">{ba.kegiatan}</p>
                                    </div>
                                    <div className="text-body-sm space-y-1">
                                        <p className="font-semibold text-foreground">Hasil:</p>
                                        <p className="text-muted-foreground text-caption-xs">{ba.hasil}</p>
                                    </div>
                                    {ba.hambatan && (
                                        <div className="text-body-sm space-y-1">
                                            <p className="font-semibold text-amber-600 dark:text-amber-400">Kendala:</p>
                                            <p className="text-muted-foreground text-caption-xs">{ba.hambatan}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Tutup
                    </Button>
                    {tabActive === 'baru' && (
                        <Button
                            type="submit"
                            form="form-berita-acara"
                            disabled={isSubmitting || kegiatan.trim().length < 10 || hasil.trim().length < 10}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Menerbitkan...
                                </>
                            ) : (
                                <>
                                    Terbitkan Versi Baru
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

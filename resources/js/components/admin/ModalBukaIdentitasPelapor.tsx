import { type FormEvent, useState } from 'react';
import { AlertTriangle, Eye, Lock, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';

interface PelaporInfo {
    id: number;
    username: string;
    status_akun: string;
    poin_peringatan: number;
    kelurahan: string | null;
    jumlah_laporan: number;
    terdaftar_pada: string;
}

interface ModalBukaIdentitasPelaporProps {
    nomorTiket: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ModalBukaIdentitasPelapor({
    nomorTiket,
    isOpen,
    onClose,
}: ModalBukaIdentitasPelaporProps) {
    const [alasan, setAlasan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pelaporData, setPelaporData] = useState<PelaporInfo | null>(null);

    const handleTutup = () => {
        setAlasan('');
        setError(null);
        setPelaporData(null);
        onClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content;

            const response = await fetch(
                `/api/tiket/${nomorTiket}/buka-identitas`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': token || '',
                    },
                    body: JSON.stringify({ alasan }),
                },
            );

            const resData = await response.json();

            if (!response.ok) {
                if (resData.errors?.alasan) {
                    setError(resData.errors.alasan[0]);
                } else {
                    setError(
                        resData.message ||
                            resData.pesan ||
                            'Gagal membuka identitas.',
                    );
                }
                setLoading(false);
                return;
            }

            setPelaporData(resData.pelapor);
        } catch {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleTutup()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock
                            className="size-5 text-destructive"
                            aria-hidden="true"
                        />
                        <span>Pembukaan Identitas Pelapor (Investigasi)</span>
                    </DialogTitle>
                    <DialogDescription>
                        Akses khusus pembukaan data identitas pelapor tiket
                        nomor{' '}
                        <strong className="font-mono text-foreground">
                            {nomorTiket}
                        </strong>
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-1">
                    {/* Hasil Tampil Data Pelapor */}
                    {pelaporData ? (
                        <div className="space-y-4">
                            <Alert
                                variant="default"
                                className="border-sla-safe/30 bg-sla-safe/10 text-sla-safe"
                            >
                                <AlertDescription className="text-caption-xs font-medium">
                                    Identitas pelapor berhasil dibuka dan
                                    tindakan ini telah dicatat permanen pada Log
                                    Audit Sistem.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <User
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-body-medium font-bold text-foreground">
                                            {pelaporData.username}
                                        </div>
                                        <div className="text-caption-xs font-mono text-muted-foreground">
                                            ID Pengguna: #{pelaporData.id}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-caption-xs">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Status Akun:
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="mt-0.5 block w-fit capitalize"
                                        >
                                            {pelaporData.status_akun}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Poin Peringatan:
                                        </span>
                                        <span className="mt-0.5 block font-semibold text-foreground">
                                            {pelaporData.poin_peringatan} poin
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Wilayah Domisili:
                                        </span>
                                        <span className="mt-0.5 block font-medium text-foreground">
                                            {pelaporData.kelurahan
                                                ? `Kel. ${pelaporData.kelurahan}`
                                                : '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Total Aduan Dikirim:
                                        </span>
                                        <span className="mt-0.5 block font-medium text-foreground">
                                            {pelaporData.jumlah_laporan} tiket
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">
                                            Terdaftar Sejak:
                                        </span>
                                        <span className="mt-0.5 block font-medium text-foreground">
                                            {formatTanggal(
                                                pelaporData.terdaftar_pada,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={handleTutup}
                                    className="w-full"
                                >
                                    Selesai
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        /* Form Alasan Investigasi */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Alert variant="destructive" className="space-y-1">
                                <AlertTitle className="flex items-center gap-1.5 text-caption-xs font-semibold">
                                    <AlertTriangle
                                        className="size-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        Peringatan Privasi & Kepatuhan Hukum
                                    </span>
                                </AlertTitle>
                                <AlertDescription className="text-caption-xs leading-relaxed">
                                    Sistem Jagains melindungi kerahasiaan
                                    identitas pelapor. Tindakan ini hanya boleh
                                    dilakukan untuk keperluan investigasi hukum
                                    atau audit resmi. Aksi ini, identitas Anda,
                                    dan alasan tertulis akan dicatat secara
                                    permanen di Log Audit Anti-Tamper.
                                </AlertDescription>
                            </Alert>

                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="alasan-investigasi">
                                    Alasan Investigasi Hukum / Audit{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="alasan-investigasi"
                                    maxLength={256}
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    rows={3}
                                    placeholder="Tuliskan nomor surat tugas, dasar hukum, atau alasan audit resmi (maksimal 256 karakter)..."
                                    className="resize-none"
                                />
                                <div className="flex justify-between text-caption-xs text-muted-foreground">
                                    <span>Minimal 10 karakter</span>
                                    <span
                                        className={
                                            alasan.trim().length < 10
                                                ? 'font-medium text-sla-warn'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {alasan.length}/256 karakter
                                    </span>
                                </div>
                                {error && <FieldError>{error}</FieldError>}
                            </Field>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTutup}
                                    disabled={loading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={
                                        loading || alasan.trim().length < 10
                                    }
                                >
                                    <Eye
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        {loading
                                            ? 'Membuka...'
                                            : 'Buka Identitas & Catat Audit'}
                                    </span>
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

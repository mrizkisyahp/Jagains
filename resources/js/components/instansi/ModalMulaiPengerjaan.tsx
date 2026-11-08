import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { mulai } from '@/routes/instansi/tiket';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, ArrowRight } from 'lucide-react';
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
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { toast } from '@/components/ui/toast';

interface ModalMulaiPengerjaanProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalMulaiPengerjaan({
    open,
    onClose,
    laporan,
}: ModalMulaiPengerjaanProps) {
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const res = await fetch(mulai.url(laporan.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify({ catatan: catatan.trim() || undefined }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (res.ok && data.sukses) {
                toast.success(
                    'Pengerjaan Dimulai',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setCatatan('');
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                setFieldErrors(
                    Object.fromEntries(
                        Object.entries(data.errors ?? {}).map(
                            ([name, messages]) => [
                                name,
                                messages.map(formatInstansiMessage),
                            ],
                        ),
                    ),
                );
                setSubmissionError(
                    formatInstansiMessage(data.message) ||
                        'Permintaan belum berhasil. Periksa isian dan coba lagi.',
                );
                if (!data.errors)
                    toast.error(
                        'Gagal Memulai Pengerjaan',
                        formatInstansiMessage(data.message) ||
                            'Terjadi kesalahan sistem.',
                    );
            }
        } catch {
            setSubmissionError(
                'Gagal menghubungi server. Periksa koneksi lalu kirim kembali; isian Anda tetap tersedia.',
            );
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <FieldGroup className="gap-6">
                        <DialogHeader>
                            <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                                Mulai Pengerjaan Fisik
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Konfirmasikan bahwa tim mulai memperbaiki
                                kerusakan di lapangan. Catat kegiatan dan
                                hasilnya dalam berita acara sebelum mengajukan
                                selesai.
                            </DialogDescription>
                        </DialogHeader>
                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) =>
                                                !['catatan'].includes(name),
                                        )
                                        .flatMap(([name, messages]) =>
                                            messages.map((message, index) => (
                                                <p key={`${name}-${index}`}>
                                                    {message}
                                                </p>
                                            )),
                                        )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <InstansiTicketContext
                            nomorTiket={laporan.nomor_tiket}
                            judul={laporan.judul}
                        />

                        <Field className="gap-2">
                            <div className="flex items-center justify-between">
                                <FieldLabel
                                    htmlFor="catatan-mulai"
                                    className="text-body-base font-semibold"
                                >
                                    Catatan Pengerjaan Lapangan{' '}
                                    <span className="text-body-sm font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <span className="text-caption-xs text-muted-foreground">
                                    {catatan.length}/256
                                </span>
                            </div>
                            <Textarea
                                id="catatan-mulai"
                                maxLength={256}
                                placeholder="Contoh: Alat berat dan armada pengangkut material telah tiba di lokasi. Pengerjaan dimulai (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.catatan)}
                                aria-describedby="error-ModalMulaiPengerjaan-catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalMulaiPengerjaan-catatan"
                                errors={fieldErrors.catatan?.map((message) => ({
                                    message,
                                }))}
                            />
                        </Field>

                        <DialogFooter className="gap-3 border-t border-border pt-6">
                            <Button
                                className="h-11 text-body-medium shadow-none md:h-10"
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Mulai Pengerjaan
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}

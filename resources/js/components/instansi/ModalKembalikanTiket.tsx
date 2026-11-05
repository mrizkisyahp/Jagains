import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { kembalikan } from '@/routes/instansi/tiket';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Undo2, Loader2 } from 'lucide-react';
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

interface ModalKembalikanTiketProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalKembalikanTiket({
    open,
    onClose,
    laporan,
}: ModalKembalikanTiketProps) {
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (alasan.trim().length < 10) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(kembalikan.url(laporan.id), {
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
                body: JSON.stringify({ alasan: alasan.trim() }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (res.ok && data.sukses) {
                toast.success(
                    'Tiket Dikembalikan',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setAlasan('');
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
                        'Gagal Mengembalikan Tiket',
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
                                Kembalikan ke Admin
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Kembalikan tiket kepada Admin agar ditugaskan
                                ulang ke instansi yang berwenang. Jelaskan
                                alasan tiket tidak dapat ditangani instansi
                                Anda.
                            </DialogDescription>
                        </DialogHeader>
                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) =>
                                                !['alasan'].includes(name),
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
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <FieldLabel
                                    htmlFor="alasan-kembalikan"
                                    className="text-body-base font-semibold"
                                >
                                    Alasan Pengembalian ke Admin{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <span
                                    className={cn(
                                        'text-body-sm',
                                        alasan.trim().length >= 10
                                            ? 'font-semibold text-sla-safe'
                                            : 'text-destructive',
                                    )}
                                >
                                    {alasan.trim().length >= 10
                                        ? '✓ Memenuhi syarat'
                                        : `Min. 10 karakter (${10 - alasan.trim().length} lagi)`}
                                </span>
                            </div>
                            <Textarea
                                id="alasan-kembalikan"
                                placeholder="Jelaskan kendala penetapan kewenangan, aset lintas instansi, atau alasan penugasan administratif lainnya..."
                                aria-invalid={Boolean(fieldErrors.alasan)}
                                aria-describedby="error-ModalKembalikanTiket-alasan"
                                value={alasan}
                                onChange={(e) => setAlasan(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalKembalikanTiket-alasan"
                                errors={fieldErrors.alasan?.map((message) => ({
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
                                variant="destructive"
                                disabled={
                                    isSubmitting || alasan.trim().length < 10
                                }
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Mengembalikan...
                                    </>
                                ) : (
                                    <>
                                        Konfirmasi Kembalikan
                                        <Undo2 className="size-4" />
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

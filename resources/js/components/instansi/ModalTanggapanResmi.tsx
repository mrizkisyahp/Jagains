import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { tanggapan as tanggapanRoute } from '@/routes/instansi/tiket';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

interface ModalTanggapanResmiProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalTanggapanResmi({
    open,
    onClose,
    laporan,
}: ModalTanggapanResmiProps) {
    const [tanggapan, setTanggapan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tanggapan.trim().length < 10) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(tanggapanRoute.url(laporan.id), {
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
                body: JSON.stringify({ tanggapan: tanggapan.trim() }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (res.ok && data.sukses) {
                toast.success(
                    'Tanggapan Terbit',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setTanggapan('');
                router.reload({ only: ['antrean'] });
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
                        'Gagal Mengunggah Tanggapan',
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
                                Terbitkan Tanggapan Resmi
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Pernyataan resmi instansi akan disematkan secara
                                terbuka pada linimasa tiket publik untuk dibaca
                                warga pelapor dan masyarakat luas.
                            </DialogDescription>
                        </DialogHeader>
                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) => !['isi'].includes(name),
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
                                    htmlFor="teks-tanggapan"
                                    className="text-body-base font-semibold"
                                >
                                    Pernyataan Resmi Dinas{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <span
                                    className={cn(
                                        'text-body-sm',
                                        tanggapan.trim().length >= 10
                                            ? 'font-semibold text-sla-safe'
                                            : 'text-destructive',
                                    )}
                                >
                                    {tanggapan.trim().length >= 10
                                        ? `✓ ${tanggapan.length}/256 karakter (min. 10)`
                                        : `Min. 10 karakter (${tanggapan.length}/256)`}
                                </span>
                            </div>
                            <Textarea
                                id="teks-tanggapan"
                                maxLength={256}
                                placeholder="Tuliskan pernyataan resmi instansi terkait progres lapangan, koordinasi lintas dinas, atau penjelasan teknis kepada publik (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.isi)}
                                aria-describedby="error-ModalTanggapanResmi-isi"
                                value={tanggapan}
                                onChange={(e) => setTanggapan(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalTanggapanResmi-isi"
                                errors={fieldErrors.isi?.map((message) => ({
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
                                disabled={
                                    isSubmitting || tanggapan.trim().length < 10
                                }
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Menerbitkan...
                                    </>
                                ) : (
                                    <>
                                        Terbitkan Tanggapan
                                        <Send className="size-4" />
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

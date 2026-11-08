import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import { revisiTarget } from '@/routes/instansi/tiket';
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
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';

interface ModalRevisiTargetProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        tanggal_target: string | null;
        tanggal_target_format: string | null;
    } | null;
}

export default function ModalRevisiTarget({
    open,
    onClose,
    laporan,
}: ModalRevisiTargetProps) {
    const [tanggalTargetBaru, setTanggalTargetBaru] = useState('');
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tanggalTargetBaru || alasan.trim().length < 10) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(revisiTarget.url(laporan.id), {
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
                body: JSON.stringify({
                    tanggal_target_baru: tanggalTargetBaru,
                    alasan: alasan.trim(),
                }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (res.ok && data.sukses) {
                toast.success(
                    'Tanggal Target Direvisi',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setTanggalTargetBaru('');
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
                        'Gagal Merevisi Target',
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
                                Ubah tanggal target penyelesaian
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Perpanjangan janji tanggal penyelesaian hanya
                                dapat dilakukan{' '}
                                <span className="font-semibold text-foreground">
                                    maksimal 2 kali
                                </span>{' '}
                                per tiket dengan alasan wajib yang transparan ke
                                publik.
                            </DialogDescription>
                        </DialogHeader>
                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) =>
                                                ![
                                                    'alasan',
                                                    'tanggal_target_baru',
                                                ].includes(name),
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

                        <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-3 text-body-base">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-body-sm text-muted-foreground">
                                    Nomor Tiket:
                                </span>
                                <span className="font-mono font-bold text-foreground">
                                    {laporan.nomor_tiket}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-body-sm text-muted-foreground">
                                    Target Saat Ini:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {laporan.tanggal_target_format ||
                                        laporan.tanggal_target}
                                </span>
                            </div>
                        </div>

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="tanggal-target-baru"
                                className="text-body-base font-semibold"
                            >
                                Tanggal Target Baru{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="tanggal-target-baru"
                                type="date"
                                min={today}
                                max={maxDateStr}
                                aria-invalid={Boolean(
                                    fieldErrors.tanggal_target_baru,
                                )}
                                aria-describedby="error-ModalRevisiTarget-tanggal_target_baru"
                                value={tanggalTargetBaru}
                                onChange={(e) =>
                                    setTanggalTargetBaru(e.target.value)
                                }
                                required
                                className="h-11 text-body-base md:h-10"
                            />
                            <FieldError
                                id="error-ModalRevisiTarget-tanggal_target_baru"
                                errors={fieldErrors.tanggal_target_baru?.map(
                                    (message) => ({ message }),
                                )}
                            />
                        </Field>

                        <Field className="gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <FieldLabel
                                    htmlFor="alasan-revisi"
                                    className="text-body-base font-semibold"
                                >
                                    Alasan Keterlambatan / Revisi{' '}
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
                                        ? `✓ ${alasan.length}/256 karakter (min. 10)`
                                        : `Min. 10 karakter (${alasan.length}/256)`}
                                </span>
                            </div>
                            <Textarea
                                id="alasan-revisi"
                                maxLength={256}
                                placeholder="Jelaskan alasan kendala cuaca, keterlambatan pasokan material, atau hambatan teknis lainnya (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.alasan)}
                                aria-describedby="error-ModalRevisiTarget-alasan"
                                value={alasan}
                                onChange={(e) => setAlasan(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalRevisiTarget-alasan"
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
                                disabled={
                                    isSubmitting ||
                                    !tanggalTargetBaru ||
                                    alasan.trim().length < 10
                                }
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        Simpan Revisi Target
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

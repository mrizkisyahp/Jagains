import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from '@/components/ui/field';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { responsSengketa } from '@/routes/instansi/tiket';

interface ModalResponsSengketaProps {
    open: boolean;
    onClose: () => void;
    laporan: { id: number; nomor_tiket: string; judul: string } | null;
    onSuccess?: () => void;
}

export default function ModalResponsSengketa({
    open,
    onClose,
    laporan,
    onSuccess,
}: ModalResponsSengketaProps) {
    const [pilihan, setPilihan] = useState<'kerjakan_ulang' | 'sanggah' | null>(
        null,
    );
    const [alasanSanggah, setAlasanSanggah] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    if (!laporan) return null;
    const handleClose = () => {
        setPilihan(null);
        setAlasanSanggah('');
        setErrors({});
        onClose();
    };
    const isReady =
        pilihan === 'kerjakan_ulang' ||
        (pilihan === 'sanggah' && alasanSanggah.trim().length >= 10);
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!isReady) return;
        setErrors({});
        setIsSubmitting(true);
        router.post(
            responsSengketa.url(laporan.id),
            {
                pilihan,
                alasan_sanggah:
                    pilihan === 'sanggah' ? alasanSanggah.trim() : null,
            },
            {
                onSuccess: () => {
                    toast.success(
                        'Jawaban sengketa resmi instansi berhasil diserahkan.',
                    );
                    handleClose();
                    onSuccess?.();
                },
                onError: (validationErrors) =>
                    setErrors(
                        Object.fromEntries(
                            Object.entries(validationErrors).map(
                                ([name, message]) => [
                                    name,
                                    formatInstansiMessage(message),
                                ],
                            ),
                        ),
                    ),
                onNetworkError: () => {
                    setErrors({
                        network:
                            'Gagal menghubungi server. Periksa koneksi lalu kirim kembali; isian tetap tersedia.',
                    });
                    return false;
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) handleClose();
            }}
        >
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-3xl sm:p-8">
                <DialogHeader>
                    <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                        Respons sengketa warga
                    </DialogTitle>
                    <DialogDescription className="text-body-base">
                        Warga menilai hasil perbaikan belum sesuai. Dalam 7 hari
                        kerja, pilih untuk memperbaiki ulang atau meminta
                        Auditor, pengawas independen, meninjau sanggahan Anda.
                    </DialogDescription>
                </DialogHeader>
                <InstansiTicketContext
                    nomorTiket={laporan.nomor_tiket}
                    judul={laporan.judul}
                />
                <InstansiStatusBadge status="DISENGKETAKAN" />
                <form onSubmit={handleSubmit}>
                    <FieldGroup className="gap-6">
                        {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    Respons belum terkirim. Periksa keterangan
                                    di bawah.
                                    {Object.entries(errors)
                                        .filter(
                                            ([key]) =>
                                                ![
                                                    'pilihan',
                                                    'alasan_sanggah',
                                                ].includes(key),
                                        )
                                        .map(([key, message]) => (
                                            <p key={key}>{message}</p>
                                        ))}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Field data-invalid={Boolean(errors.pilihan)}>
                            <FieldLabel>Sikap resmi instansi</FieldLabel>
                            <RadioGroup
                                aria-label="Sikap resmi instansi"
                                value={pilihan}
                                onValueChange={(value) =>
                                    setPilihan(
                                        value as 'kerjakan_ulang' | 'sanggah',
                                    )
                                }
                                className="gap-3"
                            >
                                <Field
                                    orientation="horizontal"
                                    className="items-start rounded-lg border border-border p-4"
                                >
                                    <RadioGroupItem
                                        id="sengketa-ulang"
                                        value="kerjakan_ulang"
                                        className="mt-1"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <FieldLabel htmlFor="sengketa-ulang">
                                            Kerjakan ulang
                                        </FieldLabel>
                                        <FieldDescription className="text-body-sm">
                                            Perbaiki hasil pekerjaan berdasarkan
                                            catatan warga. Status kembali
                                            menjadi dikerjakan, dengan batas
                                            maksimal 3 kali pengerjaan ulang.
                                        </FieldDescription>
                                    </div>
                                </Field>
                                <Field
                                    orientation="horizontal"
                                    className="items-start rounded-lg border border-border p-4"
                                >
                                    <RadioGroupItem
                                        id="sengketa-sanggah"
                                        value="sanggah"
                                        className="mt-1"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <FieldLabel htmlFor="sengketa-sanggah">
                                            Sanggah penolakan
                                        </FieldLabel>
                                        <FieldDescription className="text-body-sm">
                                            Sampaikan alasan teknis untuk
                                            ditinjau Auditor. Sanggahan
                                            ditampilkan kepada publik.
                                        </FieldDescription>
                                    </div>
                                </Field>
                            </RadioGroup>
                            <FieldError
                                errors={
                                    errors.pilihan
                                        ? [{ message: errors.pilihan }]
                                        : []
                                }
                            />
                        </Field>
                        {pilihan === 'sanggah' && (
                            <Field
                                data-invalid={Boolean(errors.alasan_sanggah)}
                            >
                                <FieldLabel htmlFor="alasan-sanggah">
                                    Alasan sanggahan teknis
                                </FieldLabel>
                                <Textarea
                                    id="alasan-sanggah"
                                    value={alasanSanggah}
                                    onChange={(event) =>
                                        setAlasanSanggah(event.target.value)
                                    }
                                    rows={4}
                                    className="text-body-base"
                                    aria-invalid={Boolean(
                                        errors.alasan_sanggah,
                                    )}
                                    aria-describedby="sanggah-description sanggah-error"
                                    placeholder="Jelaskan pertimbangan teknis dan bukti yang mendukung sanggahan."
                                />
                                <FieldDescription
                                    id="sanggah-description"
                                    className="text-body-sm"
                                >
                                    Minimal 10 karakter. Alasan akan tampil di
                                    linimasa publik. Terisi{' '}
                                    {alasanSanggah.trim().length} karakter.
                                </FieldDescription>
                                <FieldError
                                    id="sanggah-error"
                                    errors={
                                        errors.alasan_sanggah
                                            ? [
                                                  {
                                                      message:
                                                          errors.alasan_sanggah,
                                                  },
                                              ]
                                            : []
                                    }
                                />
                            </Field>
                        )}
                        <DialogFooter className="gap-3 border-t border-border pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="h-11 text-body-medium shadow-none md:h-10"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isReady || isSubmitting}
                                className="h-11 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting && (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                )}
                                {isSubmitting
                                    ? 'Mengirim respons…'
                                    : 'Kirim respons resmi'}
                            </Button>
                        </DialogFooter>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}

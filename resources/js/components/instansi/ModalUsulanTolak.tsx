import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { usulTolak } from '@/routes/instansi/tiket';
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
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectGroup,
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
    onSuccess?: () => void;
}

export default function ModalUsulanTolak({
    open,
    onClose,
    laporan,
    onSuccess,
}: ModalUsulanTolakProps) {
    const [alasanBaku, setAlasanBaku] = useState<string>(
        'bukan_fasilitas_publik',
    );
    const [keterangan, setKeterangan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!alasanBaku || keterangan.trim().length < 10) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(usulTolak.url(laporan.id), {
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
                    alasan_baku: alasanBaku,
                    keterangan: keterangan.trim(),
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
                    'Usulan Penolakan Diajukan',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setKeterangan('');
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.reload({ only: ['antrean', 'ringkasan'] });
                }
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
                        'Gagal Mengajukan Penolakan',
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
                                Usulkan Penolakan Tiket
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Ajukan alasan mengapa laporan tidak dapat
                                ditindaklanjuti. Auditor, yaitu pengawas
                                independen, akan meninjau usulan ini dan
                                memutuskan apakah laporan ditolak.
                            </DialogDescription>
                        </DialogHeader>
                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) =>
                                                !['keterangan'].includes(name),
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
                            <FieldLabel
                                htmlFor="alasan-baku"
                                className="text-body-base font-semibold"
                            >
                                Kategori Alasan Baku{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={alasanBaku}
                                onValueChange={(val) =>
                                    setAlasanBaku(
                                        val ?? 'bukan_fasilitas_publik',
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="alasan-baku"
                                    className="h-11 w-full text-body-base shadow-none data-[size=default]:h-11 md:h-10 md:data-[size=default]:h-10"
                                >
                                    <SelectValue placeholder="Pilih Kategori Alasan">
                                        {(value: string | null) =>
                                            (
                                                {
                                                    bukan_fasilitas_publik:
                                                        'Bukan Objek Fasilitas Publik',
                                                    lahan_privat:
                                                        'Berada di Lahan Privat / Perumahan Non-PSU',
                                                    laporan_fiktif:
                                                        'Objek Laporan Fiktif / Tidak Ditemukan',
                                                    dalam_sengketa_hukum:
                                                        'Sedang Dalam Sengketa Hukum / Kepolisian',
                                                    lainnya:
                                                        'Lainnya (Wajib Keterangan Rinci)',
                                                } as Record<string, string>
                                            )[value ?? ''] ??
                                            'Pilih Kategori Alasan'
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="bukan_fasilitas_publik">
                                            Bukan Objek Fasilitas Publik
                                        </SelectItem>
                                        <SelectItem value="lahan_privat">
                                            Berada di Lahan Privat / Perumahan
                                            Non-PSU
                                        </SelectItem>
                                        <SelectItem value="laporan_fiktif">
                                            Objek Laporan Fiktif / Tidak
                                            Ditemukan
                                        </SelectItem>
                                        <SelectItem value="dalam_sengketa_hukum">
                                            Sedang Dalam Sengketa Hukum /
                                            Kepolisian
                                        </SelectItem>
                                        <SelectItem value="lainnya">
                                            Lainnya (Wajib Keterangan Rinci)
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field className="gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <FieldLabel
                                    htmlFor="keterangan-usul-tolak"
                                    className="text-body-base font-semibold"
                                >
                                    Uraian Keterangan Pendukung{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <span
                                    className={cn(
                                        'text-body-sm',
                                        keterangan.trim().length >= 10
                                            ? 'font-semibold text-sla-safe'
                                            : 'text-destructive',
                                    )}
                                >
                                    {keterangan.trim().length >= 10
                                        ? `✓ ${keterangan.length}/256 karakter (min. 10)`
                                        : `Min. 10 karakter (${keterangan.length}/256)`}
                                </span>
                            </div>
                            <Textarea
                                id="keterangan-usul-tolak"
                                maxLength={256}
                                placeholder="Uraikan fakta penolakan, nomor sertifikat/status PSU, atau bukti lain yang akan diperiksa oleh Auditor (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.keterangan)}
                                aria-describedby="error-ModalUsulanTolak-keterangan"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalUsulanTolak-keterangan"
                                errors={fieldErrors.keterangan?.map(
                                    (message) => ({ message }),
                                )}
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
                                    isSubmitting ||
                                    !alasanBaku ||
                                    keterangan.trim().length < 10
                                }
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
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
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}

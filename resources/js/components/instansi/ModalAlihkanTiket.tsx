import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { alihkan } from '@/routes/instansi/tiket';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowRightLeft, AlertTriangle, Loader2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';

interface InstansiItem {
    id: number;
    nama: string;
    singkatan: string;
}

interface ModalAlihkanTiketProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        jumlah_pengalihan: number;
    } | null;
    instansiList: InstansiItem[];
}

export default function ModalAlihkanTiket({
    open,
    onClose,
    laporan,
    instansiList,
}: ModalAlihkanTiketProps) {
    const [instansiTujuanId, setInstansiTujuanId] = useState<string>('');
    const [alasan, setAlasan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const sisaPengalihan = 2 - laporan.jumlah_pengalihan;
    const isMaksimal = sisaPengalihan <= 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isMaksimal || !instansiTujuanId || alasan.trim().length < 10)
            return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(alihkan.url(laporan.id), {
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
                    instansi_tujuan_id: Number(instansiTujuanId),
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
                    'Pengalihan Berhasil',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setInstansiTujuanId('');
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
                        'Gagal Mengalihkan Tiket',
                        formatInstansiMessage(data.message) ||
                            'Terjadi kesalahan validasi.',
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
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                                    Alihkan ke Instansi Lain
                                </DialogTitle>
                                <Badge
                                    variant={
                                        isMaksimal ? 'destructive' : 'secondary'
                                    }
                                    className="text-caption-xs font-mono"
                                >
                                    Pengalihan: {laporan.jumlah_pengalihan} / 2
                                </Badge>
                            </div>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Pindahkan tanggung jawab penanganan ke instansi
                                lain yang berwenang dan jelaskan alasannya. Satu
                                tiket dapat dialihkan paling banyak 2 kali.
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

                        {isMaksimal ? (
                            <Alert variant="destructive" className="rounded-xl">
                                <AlertTriangle className="size-4" />
                                <AlertDescription className="flex flex-col gap-1 text-body-base">
                                    <p className="font-semibold">
                                        Batas Pengalihan Telah Habis
                                    </p>
                                    <p className="text-body-sm">
                                        Tiket ini telah dialihkan sebanyak 2
                                        kali. Sesuai aturan akuntabilitas publik
                                        ini, tiket tidak dapat dialihkan lagi.
                                        Anda dapat memprosesnya atau
                                        mengembalikannya ke Admin.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <InstansiTicketContext
                                    nomorTiket={laporan.nomor_tiket}
                                    judul={laporan.judul}
                                />

                                <Field className="gap-2">
                                    <FieldLabel
                                        htmlFor="instansi-tujuan"
                                        className="text-body-base font-semibold"
                                    >
                                        Instansi Teknis Tujuan{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    <Select
                                        value={instansiTujuanId}
                                        onValueChange={(val) =>
                                            setInstansiTujuanId(val ?? '')
                                        }
                                    >
                                        <SelectTrigger
                                            id="instansi-tujuan"
                                            className="h-11 w-full text-body-base shadow-none data-[size=default]:h-11 md:h-10 md:data-[size=default]:h-10"
                                        >
                                            <SelectValue placeholder="Pilih instansi tujuan">
                                                {(value: string | null) => {
                                                    const instansi =
                                                        instansiList.find(
                                                            (item) =>
                                                                String(
                                                                    item.id,
                                                                ) === value,
                                                        );
                                                    return instansi
                                                        ? `${instansi.nama} (${instansi.singkatan})`
                                                        : 'Pilih instansi tujuan';
                                                }}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {instansiList.map((inst) => (
                                                    <SelectItem
                                                        key={inst.id}
                                                        value={String(inst.id)}
                                                        className="text-body-base"
                                                    >
                                                        {inst.nama} (
                                                        {inst.singkatan})
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field className="gap-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <FieldLabel
                                            htmlFor="alasan-alihkan"
                                            className="text-body-base font-semibold"
                                        >
                                            Alasan Pengalihan Teknis{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                        id="alasan-alihkan"
                                        placeholder="Jelaskan alasan pengalihan, dasar kewenangan peraturan, atau koordinasi antar-dinas..."
                                        aria-invalid={Boolean(
                                            fieldErrors.alasan,
                                        )}
                                        aria-describedby="error-ModalAlihkanTiket-alasan"
                                        value={alasan}
                                        onChange={(e) =>
                                            setAlasan(e.target.value)
                                        }
                                        rows={4}
                                        className="resize-none rounded-xl text-body-base"
                                    />
                                    <FieldError
                                        id="error-ModalAlihkanTiket-alasan"
                                        errors={fieldErrors.alasan?.map(
                                            (message) => ({ message }),
                                        )}
                                    />
                                </Field>
                            </>
                        )}

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
                            {!isMaksimal && (
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !instansiTujuanId ||
                                        alasan.trim().length < 10
                                    }
                                    className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Mengalihkan...
                                        </>
                                    ) : (
                                        <>
                                            Konfirmasi Pengalihan
                                            <ArrowRightLeft className="size-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </DialogFooter>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}

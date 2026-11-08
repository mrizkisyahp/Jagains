import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { anggaran } from '@/routes/instansi/tiket';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

interface ModalJadwalAnggaranProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
    } | null;
}

export default function ModalJadwalAnggaran({
    open,
    onClose,
    laporan,
}: ModalJadwalAnggaranProps) {
    const [jenisPendanaan, setJenisPendanaan] = useState<string>('APBD_KOTA');
    const [tanggalTarget, setTanggalTarget] = useState<string>('');
    const [catatan, setCatatan] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    // Batas maksimal 180 hari (P-15)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jenisPendanaan || !tanggalTarget) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(anggaran.url(laporan.id), {
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
                    jenis_pendanaan: jenisPendanaan,
                    tanggal_target: tanggalTarget,
                    catatan: catatan.trim() || undefined,
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
                    'Jadwal Anggaran Ditetapkan',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setTanggalTarget('');
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
                        'Gagal Menetapkan Anggaran',
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
                                Jadwalkan anggaran & target selesai
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Tentukan sumber dana dan tanggal target selesai.
                                Tanggal ini dapat dilihat masyarakat sebagai
                                janji penyelesaian. Target paling jauh 180 hari
                                dari penjadwalan.
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
                                                    'catatan',
                                                    'tanggal_target',
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

                        <InstansiTicketContext
                            nomorTiket={laporan.nomor_tiket}
                            judul={laporan.judul}
                        />

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="jenis-pendanaan"
                                className="text-body-base font-semibold"
                            >
                                Sumber Pendanaan{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={jenisPendanaan}
                                onValueChange={(val) =>
                                    setJenisPendanaan(val ?? 'APBD_KOTA')
                                }
                            >
                                <SelectTrigger
                                    id="jenis-pendanaan"
                                    className="h-11 w-full text-body-base shadow-none data-[size=default]:h-11 md:h-10 md:data-[size=default]:h-10"
                                >
                                    <SelectValue placeholder="Pilih Jenis Pendanaan">
                                        {(value: string | null) =>
                                            (
                                                {
                                                    APBD_KOTA:
                                                        'Anggaran pemerintah kota (APBD)',
                                                    APBD_PROVINSI:
                                                        'Anggaran pemerintah provinsi (APBD)',
                                                    APBN: 'Anggaran pemerintah pusat (APBN)',
                                                    LAINNYA:
                                                        'Sumber dana lainnya',
                                                } as Record<string, string>
                                            )[value ?? ''] ??
                                            'Pilih Jenis Pendanaan'
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="APBD_KOTA">
                                            Anggaran pemerintah kota (APBD)
                                        </SelectItem>
                                        <SelectItem value="APBD_PROVINSI">
                                            Anggaran pemerintah provinsi (APBD)
                                        </SelectItem>
                                        <SelectItem value="APBN">
                                            Anggaran pemerintah pusat (APBN)
                                        </SelectItem>
                                        <SelectItem value="LAINNYA">
                                            Sumber dana lainnya
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field className="gap-2">
                            <FieldLabel
                                htmlFor="tanggal-target"
                                className="text-body-base font-semibold"
                            >
                                Tanggal target penyelesaian{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="tanggal-target"
                                type="date"
                                min={today}
                                max={maxDateStr}
                                aria-invalid={Boolean(
                                    fieldErrors.tanggal_target,
                                )}
                                aria-describedby="error-ModalJadwalAnggaran-tanggal_target"
                                value={tanggalTarget}
                                onChange={(e) =>
                                    setTanggalTarget(e.target.value)
                                }
                                required
                                className="h-11 text-body-base md:h-10"
                            />
                            <FieldError
                                id="error-ModalJadwalAnggaran-tanggal_target"
                                errors={fieldErrors.tanggal_target?.map(
                                    (message) => ({ message }),
                                )}
                            />
                            <p className="text-body-sm text-muted-foreground">
                                Maksimal s.d.{' '}
                                {maxDate.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}{' '}
                                (180 hari).
                            </p>
                        </Field>

                        <Field className="gap-2">
                            <div className="flex items-center justify-between">
                                <FieldLabel
                                    htmlFor="catatan-anggaran"
                                    className="text-body-base font-semibold"
                                >
                                    Keterangan Rencana Kegiatan{' '}
                                    <span className="text-body-sm font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <span className="text-caption-xs text-muted-foreground">
                                    {catatan.length}/256
                                </span>
                            </div>
                            <Textarea
                                id="catatan-anggaran"
                                maxLength={256}
                                placeholder="Contoh: Pekerjaan diplot pada mata anggaran pemeliharaan berkala triwulan berjalan (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.catatan)}
                                aria-describedby="error-ModalJadwalAnggaran-catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                rows={2}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalJadwalAnggaran-catatan"
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
                                disabled={
                                    isSubmitting ||
                                    !jenisPendanaan ||
                                    !tanggalTarget
                                }
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Menetapkan...
                                    </>
                                ) : (
                                    <>
                                        Tetapkan Janji Target
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

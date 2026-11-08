import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import InstansiEmptyState from '@/components/instansi/InstansiEmptyState';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { beritaAcara } from '@/routes/instansi/tiket';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    History,
    Plus,
    Loader2,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
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
    const [historyPage, setHistoryPage] = useState(1);
    const [tabActive, setTabActive] = useState<'baru' | 'riwayat'>('baru');
    const [kegiatan, setKegiatan] = useState('');
    const [hasil, setHasil] = useState('');
    const [hambatan, setHambatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    if (!laporan) return null;

    const riwayatList = laporan.semua_berita_acara || [];
    const historyPageSize = 3;
    const historyPageCount = Math.max(
        1,
        Math.ceil(riwayatList.length / historyPageSize),
    );
    const currentHistoryPage = Math.min(historyPage, historyPageCount);
    const visibleHistory = riwayatList.slice(
        (currentHistoryPage - 1) * historyPageSize,
        currentHistoryPage * historyPageSize,
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (kegiatan.trim().length < 10 || hasil.trim().length < 10) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(beritaAcara.url(laporan.id), {
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
                    kegiatan: kegiatan.trim(),
                    hasil: hasil.trim(),
                    hambatan: hambatan.trim() || undefined,
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
                    'Berita Acara Diterbitkan',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setKegiatan('');
                setHasil('');
                setHambatan('');
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
                        'Gagal Menerbitkan Berita Acara',
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
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-3xl sm:p-8">
                <DialogHeader className="shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                            Berita Acara Lapangan
                        </DialogTitle>
                        <Badge
                            variant="secondary"
                            className="text-caption-xs font-mono"
                        >
                            {riwayatList.length} Versi Tercatat
                        </Badge>
                    </div>
                    <DialogDescription className="text-body-base text-muted-foreground">
                        Catat kegiatan, hasil pekerjaan, dan kendala untuk
                        dibaca masyarakat. Setiap penerbitan membuat versi baru;
                        catatan sebelumnya tetap dapat dibaca.
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
                                            'hambatan',
                                            'hasil',
                                            'kegiatan',
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

                <Tabs
                    value={tabActive}
                    onValueChange={(v) => setTabActive(v as 'baru' | 'riwayat')}
                    className="mt-2 flex min-h-0 w-full flex-1 flex-col"
                >
                    <TabsList className="grid shrink-0 grid-cols-2">
                        <TabsTrigger
                            value="baru"
                            className="gap-1.5 text-body-base font-semibold"
                        >
                            <Plus className="size-3.5" />
                            Versi baru
                        </TabsTrigger>
                        <TabsTrigger
                            value="riwayat"
                            className="gap-1.5 text-body-base font-semibold"
                        >
                            <History className="size-3.5" />
                            Riwayat ({riwayatList.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB TERBITKAN BERITA ACARA BARU */}
                    <TabsContent
                        value="baru"
                        className="mt-3 flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
                    >
                        <form
                            onSubmit={handleSubmit}
                            id="form-berita-acara"
                            className="flex flex-col gap-4"
                        >
                            <FieldGroup className="gap-6">
                                <InstansiTicketContext
                                    nomorTiket={laporan.nomor_tiket}
                                    judul={laporan.judul}
                                />

                                <Field className="gap-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <FieldLabel
                                            htmlFor="ba-kegiatan"
                                            className="text-body-base font-semibold"
                                        >
                                            Kegiatan Fisik yang Dilaksanakan{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <span
                                            className={cn(
                                                'text-body-sm',
                                                kegiatan.trim().length >= 10
                                                    ? 'font-semibold text-sla-safe'
                                                    : 'text-destructive',
                                            )}
                                        >
                                            {kegiatan.trim().length >= 10
                                                ? `✓ ${kegiatan.length}/256 karakter (min. 10)`
                                                : `Min. 10 karakter (${kegiatan.length}/256)`}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="ba-kegiatan"
                                        maxLength={256}
                                        placeholder="Contoh: Penggalian permukaan aspal amblas, pemadatan pondasi agregat kelas A (maks. 256 karakter)..."
                                        aria-invalid={Boolean(
                                            fieldErrors.kegiatan,
                                        )}
                                        aria-describedby="error-ModalBeritaAcara-kegiatan"
                                        value={kegiatan}
                                        onChange={(e) =>
                                            setKegiatan(e.target.value)
                                        }
                                        rows={4}
                                        className="resize-none rounded-xl text-body-base"
                                    />
                                    <FieldError
                                        id="error-ModalBeritaAcara-kegiatan"
                                        errors={fieldErrors.kegiatan?.map(
                                            (message) => ({ message }),
                                        )}
                                    />
                                </Field>

                                <Field className="gap-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <FieldLabel
                                            htmlFor="ba-hasil"
                                            className="text-body-base font-semibold"
                                        >
                                            Hasil Capaian Pekerjaan{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <span
                                            className={cn(
                                                'text-body-sm',
                                                hasil.trim().length >= 10
                                                    ? 'font-semibold text-sla-safe'
                                                    : 'text-destructive',
                                            )}
                                        >
                                            {hasil.trim().length >= 10
                                                ? `✓ ${hasil.length}/256 karakter (min. 10)`
                                                : `Min. 10 karakter (${hasil.length}/256)`}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="ba-hasil"
                                        maxLength={256}
                                        placeholder="Contoh: Permukaan aspal baru telah di-overlay setebal 5 cm, saluran air dinormalisasi (maks. 256 karakter)..."
                                        aria-invalid={Boolean(
                                            fieldErrors.hasil,
                                        )}
                                        aria-describedby="error-ModalBeritaAcara-hasil"
                                        value={hasil}
                                        onChange={(e) =>
                                            setHasil(e.target.value)
                                        }
                                        rows={4}
                                        className="resize-none rounded-xl text-body-base"
                                    />
                                    <FieldError
                                        id="error-ModalBeritaAcara-hasil"
                                        errors={fieldErrors.hasil?.map(
                                            (message) => ({ message }),
                                        )}
                                    />
                                </Field>

                                <Field className="gap-2">
                                    <div className="flex items-center justify-between">
                                        <FieldLabel
                                            htmlFor="ba-hambatan"
                                            className="text-body-base font-semibold"
                                        >
                                            Kendala Lapangan{' '}
                                            <span className="text-body-sm font-normal text-muted-foreground">
                                                (Opsional)
                                            </span>
                                        </FieldLabel>
                                        <span className="text-caption-xs text-muted-foreground">
                                            {hambatan.length}/256
                                        </span>
                                    </div>
                                    <Textarea
                                        id="ba-hambatan"
                                        maxLength={256}
                                        placeholder="Contoh: Arus lalu lintas padat sehingga pengerjaan digeser ke shift malam (maks. 256 karakter)..."
                                        aria-invalid={Boolean(
                                            fieldErrors.hambatan,
                                        )}
                                        aria-describedby="error-ModalBeritaAcara-hambatan"
                                        value={hambatan}
                                        onChange={(e) =>
                                            setHambatan(e.target.value)
                                        }
                                        rows={2}
                                        className="resize-none rounded-xl text-body-base"
                                    />
                                    <FieldError
                                        id="error-ModalBeritaAcara-hambatan"
                                        errors={fieldErrors.hambatan?.map(
                                            (message) => ({ message }),
                                        )}
                                    />
                                </Field>
                            </FieldGroup>
                        </form>
                    </TabsContent>

                    {/* TAB RIWAYAT BERITA ACARA SEBELUMNYA */}
                    <TabsContent
                        value="riwayat"
                        className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto pr-1"
                    >
                        {riwayatList.length === 0 ? (
                            <InstansiEmptyState
                                title="Belum ada berita acara."
                                description="Terbitkan versi baru untuk mencatat kegiatan, hasil, dan kendala pekerjaan."
                            />
                        ) : (
                            visibleHistory.map((ba) => (
                                <div
                                    key={ba.versi}
                                    className="flex flex-col gap-3 border-b border-border py-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                                        <Badge
                                            variant="outline"
                                            className="font-mono font-bold"
                                        >
                                            Versi {ba.versi}
                                        </Badge>
                                        <span className="text-body-base text-foreground">
                                            {ba.waktu}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-body-base">
                                        <p className="font-semibold text-foreground">
                                            Kegiatan:
                                        </p>
                                        <p className="text-body-base text-foreground">
                                            {ba.kegiatan}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 text-body-base">
                                        <p className="font-semibold text-foreground">
                                            Hasil:
                                        </p>
                                        <p className="text-body-base text-foreground">
                                            {ba.hasil}
                                        </p>
                                    </div>
                                    {ba.hambatan && (
                                        <div className="flex flex-col gap-1 text-body-base">
                                            <p className="font-semibold text-sla-warn">
                                                Kendala:
                                            </p>
                                            <p className="text-body-sm text-muted-foreground">
                                                {ba.hambatan}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {historyPageCount > 1 && (
                            <nav
                                aria-label="Halaman riwayat berita acara"
                                className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
                            >
                                <p className="text-body-sm text-muted-foreground">
                                    {(currentHistoryPage - 1) *
                                        historyPageSize +
                                        1}
                                    –
                                    {Math.min(
                                        currentHistoryPage * historyPageSize,
                                        riwayatList.length,
                                    )}{' '}
                                    dari {riwayatList.length} versi
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={currentHistoryPage === 1}
                                        onClick={() =>
                                            setHistoryPage(
                                                currentHistoryPage - 1,
                                            )
                                        }
                                        className="h-11 shadow-none md:h-10"
                                        aria-label="Halaman riwayat sebelumnya"
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <span className="text-body-sm tabular-nums">
                                        {currentHistoryPage} /{' '}
                                        {historyPageCount}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            currentHistoryPage ===
                                            historyPageCount
                                        }
                                        onClick={() =>
                                            setHistoryPage(
                                                currentHistoryPage + 1,
                                            )
                                        }
                                        className="h-11 shadow-none md:h-10"
                                        aria-label="Halaman riwayat berikutnya"
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </nav>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-3 border-t border-border pt-6">
                    <Button
                        className="h-11 text-body-medium shadow-none md:h-10"
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Tutup
                    </Button>
                    {tabActive === 'baru' && (
                        <Button
                            type="submit"
                            form="form-berita-acara"
                            disabled={
                                isSubmitting ||
                                kegiatan.trim().length < 10 ||
                                hasil.trim().length < 10
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
                                    Versi baru
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

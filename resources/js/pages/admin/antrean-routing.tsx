import { type FormEvent, type ReactNode, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import {
    Building2,
    Calendar,
    ExternalLink,
    Inbox,
    MapPin,
    Route,
    Search,
    Send,
    Tag,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

interface TiketRouting {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: string;
    status: string;
    kategori: string | null;
    kelurahan: string | null;
    foto: string | null;
    lintang: number;
    bujur: number;
    created_at: string;
}

interface InstansiOption {
    id: number;
    nama: string;
    singkatan: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface AntreanRoutingProps {
    antrean: PaginatedData<TiketRouting>;
    daftarInstansi: InstansiOption[];
    cariFilter?: string | null;
}

export default function AntreanRoutingPage({
    antrean,
    daftarInstansi,
    cariFilter,
}: AntreanRoutingProps) {
    const [searchTerm, setSearchTerm] = useState(cariFilter || '');
    const [selectedTiket, setSelectedTiket] = useState<TiketRouting | null>(
        null,
    );

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (searchTerm.trim()) {
            params.cari = searchTerm.trim();
        }
        router.get('/admin/antrean-routing', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetSearch = () => {
        setSearchTerm('');
        router.get(
            '/admin/antrean-routing',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            instansi_id: '',
            catatan: '',
        });

    const bukaModalDisposisi = (tiket: TiketRouting) => {
        setSelectedTiket(tiket);
        setData({
            instansi_id: '',
            catatan: '',
        });
        clearErrors();
    };

    const tutupModalDisposisi = () => {
        setSelectedTiket(null);
        reset();
        clearErrors();
    };

    const handleKirimDisposisi = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedTiket) {
            return;
        }

        post(`/admin/antrean-routing/${selectedTiket.nomor_tiket}/disposisi`, {
            onSuccess: () => {
                tutupModalDisposisi();
            },
        });
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const keparahanVariant = (keparahan: string) => {
        switch (keparahan.toLowerCase()) {
            case 'berat':
                return 'destructive' as const;
            case 'sedang':
                return 'sla-warn' as const;
            default:
                return 'secondary' as const;
        }
    };

    return (
        <div className="space-y-6">
            <Head title="Antrean Disposisi Routing - Jagains Admin" />

            {/* Header / Context Strip */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-body-large font-display font-semibold text-foreground">
                        Antrean Routing Manual
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Tiket aduan masyarakat yang memerlukan penetapan
                        instansi teknis penanggung jawab secara manual.
                    </p>
                </div>
            </div>

            {/* Toolbar Pencarian & Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <form
                    onSubmit={handleSearch}
                    className="flex w-full items-center gap-2 sm:max-w-md"
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari nomor tiket, judul, keterangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pr-8 pl-9 text-xs"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Hapus pencarian"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                    >
                        Cari
                    </Button>
                </form>

                <Badge
                    variant="outline"
                    className="h-9 shrink-0 gap-1.5 border-border bg-muted/40 px-3 py-1 text-caption-xs text-foreground"
                >
                    <Route
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span className="font-semibold tabular-nums">
                        {antrean.total}
                    </span>
                    <span>Tiket menunggu disposisi</span>
                </Badge>
            </div>

            {/* Daftar Tiket Menggantung */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {antrean.data.length === 0 ? (
                    <div className="p-6">
                        <AdminEmptyState
                            icon={Inbox}
                            title="Tidak Ada Tiket Menggantung"
                            description="Seluruh laporan yang masuk berhasil dipetakan ke instansi teknis melalui aturan routing otomatis."
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {antrean.data.map((tiket) => (
                            <div
                                key={tiket.id}
                                className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:p-5 md:flex-row md:items-center"
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded bg-muted px-2 py-0.5 text-caption-xs font-mono font-semibold text-foreground">
                                            {tiket.nomor_tiket}
                                        </span>
                                        <Badge
                                            variant="sla-warn"
                                            className="text-caption-xs"
                                        >
                                            Perlu pengalihan
                                        </Badge>
                                        <span className="text-caption-xs text-muted-foreground">
                                            •
                                        </span>
                                        <span className="flex items-center gap-1 text-caption-xs text-muted-foreground">
                                            <Calendar
                                                className="size-3 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            {formatTanggal(tiket.created_at)}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="line-clamp-1 text-body-medium font-semibold text-foreground">
                                            {tiket.judul}
                                        </h3>
                                        <p className="mt-0.5 line-clamp-2 text-body-sm text-muted-foreground">
                                            {tiket.keterangan}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-caption-xs text-muted-foreground">
                                        {tiket.kategori && (
                                            <span className="inline-flex items-center gap-1">
                                                <Tag
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                {tiket.kategori}
                                            </span>
                                        )}
                                        {tiket.kelurahan && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                Kel. {tiket.kelurahan}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1">
                                            Keparahan:
                                            <Badge
                                                variant={keparahanVariant(
                                                    tiket.keparahan,
                                                )}
                                                className="text-[11px] capitalize"
                                            >
                                                {tiket.keparahan}
                                            </Badge>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        title={`Buka detail tiket #${tiket.nomor_tiket}`}
                                        aria-label={`Buka detail tiket #${tiket.nomor_tiket}`}
                                        render={
                                            <a
                                                href={`/tiket/${tiket.nomor_tiket}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            />
                                        }
                                    >
                                        <span className="hidden sm:inline">
                                            Detail
                                        </span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() =>
                                            bukaModalDisposisi(tiket)
                                        }
                                        title={`Disposisikan tiket #${tiket.nomor_tiket}`}
                                        aria-label={`Disposisikan tiket #${tiket.nomor_tiket}`}
                                    >
                                        <Building2
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span className="hidden sm:inline">
                                            Disposisikan
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {antrean.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                        <p className="text-body-sm text-muted-foreground">
                            Halaman{' '}
                            <span className="font-medium text-foreground">
                                {antrean.current_page}
                            </span>{' '}
                            dari{' '}
                            <span className="font-medium text-foreground">
                                {antrean.last_page}
                            </span>{' '}
                            ({antrean.total} tiket)
                        </p>
                        <div className="flex items-center gap-1">
                            {antrean.links.map((link, idx) => {
                                if (!link.url && !link.active) {
                                    return null;
                                }
                                return (
                                    <Button
                                        key={idx}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        render={
                                            link.url ? (
                                                <Link
                                                    href={link.url}
                                                    preserveScroll
                                                    preserveState
                                                />
                                            ) : undefined
                                        }
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label
                                                    .replace('&laquo;', '‹')
                                                    .replace('&raquo;', '›'),
                                            }}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Dialog Disposisi */}
            <Dialog
                open={!!selectedTiket}
                onOpenChange={(open) => !open && tutupModalDisposisi()}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <span>Disposisi Manual Instansi</span>
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan OPD/dinas teknis penanggung jawab dan
                            berikan catatan alasan penugasan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTiket && (
                        <form
                            onSubmit={handleKirimDisposisi}
                            className="space-y-4 pt-1"
                        >
                            {/* Ringkasan Tiket */}
                            <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
                                <div className="flex items-center justify-between text-caption-xs">
                                    <span className="font-mono font-semibold text-foreground">
                                        {selectedTiket.nomor_tiket}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {selectedTiket.kelurahan
                                            ? `Kel. ${selectedTiket.kelurahan}`
                                            : '-'}
                                    </span>
                                </div>
                                <div className="line-clamp-1 text-body-sm font-medium text-foreground">
                                    {selectedTiket.judul}
                                </div>
                            </div>

                            {/* Pilihan Instansi Teknis */}
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="instansi-select">
                                    Instansi Teknis Penanggung Jawab{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                    value={data.instansi_id}
                                    onValueChange={(val) =>
                                        setData('instansi_id', val ?? '')
                                    }
                                >
                                    <SelectTrigger
                                        id="instansi-select"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih OPD / Dinas Terkait" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {daftarInstansi.map((ins) => (
                                                <SelectItem
                                                    key={ins.id}
                                                    value={String(ins.id)}
                                                >
                                                    {ins.singkatan} - {ins.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.instansi_id && (
                                    <FieldError>
                                        {errors.instansi_id}
                                    </FieldError>
                                )}
                            </Field>

                            {/* Catatan Disposisi */}
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="catatan-textarea">
                                    Catatan / Alasan Disposisi{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="catatan-textarea"
                                    maxLength={256}
                                    value={data.catatan}
                                    onChange={(e) =>
                                        setData('catatan', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Alasan penugasan tiket ini ke OPD terkait (maksimal 256 karakter)..."
                                    className="resize-none"
                                />
                                <div className="flex justify-between text-caption-xs text-muted-foreground">
                                    <span>
                                        Minimal 10 karakter untuk dicatat di log
                                        audit
                                    </span>
                                    <span
                                        className={
                                            data.catatan.trim().length < 10
                                                ? 'font-medium text-sla-warn'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {data.catatan.length}/256 karakter
                                    </span>
                                </div>
                                {errors.catatan && (
                                    <FieldError>{errors.catatan}</FieldError>
                                )}
                            </Field>

                            {/* Tombol Aksi */}
                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={tutupModalDisposisi}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    disabled={
                                        processing ||
                                        !data.instansi_id ||
                                        data.catatan.trim().length < 10
                                    }
                                >
                                    <Send
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Kirim Disposisi'}
                                    </span>
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

AntreanRoutingPage.layout = (page: ReactNode) => (
    <InternalLayout title="Perlu Routing" breadcrumb="Admin > Operasional">
        {page}
    </InternalLayout>
);

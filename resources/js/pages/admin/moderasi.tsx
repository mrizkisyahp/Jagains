import { type FormEvent, type ReactNode, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import {
    CheckCircle2,
    ExternalLink,
    EyeOff,
    MessageSquare,
    Search,
    Shield,
    ShieldAlert,
    User,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface PelanggaranItem {
    id: number;
    alasan: string;
    catatan: string | null;
    status: 'menunggu' | 'ditinjau' | 'selesai';
    tindakan: string | null;
    catatan_moderator: string | null;
    created_at: string;
    pelapor_pengadu: {
        id: number;
        username: string;
    } | null;
    moderator: {
        id: number;
        username: string;
    } | null;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        keterangan: string;
        keparahan: string;
        disembunyikan: boolean;
        kategori: string | null;
        kelurahan: string | null;
        foto: string | null;
        pelapor_tiket: {
            id: number;
            username: string;
            poin_peringatan: number;
            status_akun: string;
        } | null;
    };
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
    links: PaginationLink[];
}

interface ModerasiPageProps {
    antreanModerasi: PaginatedData<PelanggaranItem>;
    statusFilter: string;
    cariFilter?: string | null;
}

const LABEL_ALASAN: Record<string, string> = {
    sara_ujaran_kebencian: 'SARA / Ujaran Kebencian',
    foto_tidak_senonoh: 'Foto Tidak Senonoh',
    spam_promosi: 'Spam / Iklan Promosi',
    informasi_palsu: 'Informasi Palsu / Hoaks',
    pelanggaran_privasi: 'Pelanggaran Privasi / PII',
    lainnya: 'Pelanggaran Lainnya',
};

export default function ModerasiPage({
    antreanModerasi,
    statusFilter,
    cariFilter,
}: ModerasiPageProps) {
    const [searchTerm, setSearchTerm] = useState(cariFilter || '');
    const [selectedItem, setSelectedItem] = useState<PelanggaranItem | null>(
        null,
    );

    const activeTab = statusFilter || 'menunggu';

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tindakan: 'diabaikan',
            catatan: '',
        });

    const bukaModalTindakan = (item: PelanggaranItem) => {
        setSelectedItem(item);
        setData({
            tindakan: 'diabaikan',
            catatan: '',
        });
        clearErrors();
    };

    const tutupModalTindakan = () => {
        setSelectedItem(null);
        reset();
        clearErrors();
    };

    const handleKirimTindakan = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedItem) {
            return;
        }

        post(`/admin/moderasi/${selectedItem.id}/tindak`, {
            onSuccess: () => {
                tutupModalTindakan();
            },
        });
    };

    const handleTabChange = (value: string | null) => {
        if (!value) {
            return;
        }
        const params: Record<string, string> = {};
        if (value !== 'semua') {
            params.status = value;
        }
        if (searchTerm.trim()) {
            params.cari = searchTerm.trim();
        }
        router.get('/admin/moderasi', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (activeTab !== 'semua') {
            params.status = activeTab;
        }
        if (searchTerm.trim()) {
            params.cari = searchTerm.trim();
        }
        router.get('/admin/moderasi', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetSearch = () => {
        setSearchTerm('');
        const params: Record<string, string> = {};
        if (activeTab !== 'semua') {
            params.status = activeTab;
        }
        router.get('/admin/moderasi', params, {
            preserveState: true,
            replace: true,
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

    return (
        <div className="space-y-6">
            <Head title="Panel Moderasi Konten - Jagains Admin" />

            {/* Header & Status Indicator */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-body-large font-display font-semibold text-foreground">
                        Panel Moderasi Konten
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Peninjauan aduan warga atas dugaan pelanggaran panduan
                        komunitas dan sanksi akun pelapor.
                    </p>
                </div>
                <div>
                    <Badge
                        variant="outline"
                        className="gap-1.5 border-border bg-muted/40 py-1 text-caption-xs text-foreground"
                    >
                        <ShieldAlert
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <span className="font-semibold tabular-nums">
                            {antreanModerasi.total}
                        </span>
                        <span>Aduan terdata</span>
                    </Badge>
                </div>
            </div>

            {/* Filter Tabs & Pencarian */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full sm:w-auto"
                >
                    <div className="w-full scrollbar-none overflow-x-auto pb-1 sm:w-auto">
                        <TabsList className="inline-flex w-max min-w-full justify-start bg-muted/50 p-1">
                            <TabsTrigger value="menunggu" className="shrink-0">
                                Menunggu Tindakan
                            </TabsTrigger>
                            <TabsTrigger value="selesai" className="shrink-0">
                                Riwayat Selesai
                            </TabsTrigger>
                            <TabsTrigger value="semua" className="shrink-0">
                                Semua Aduan
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                <form
                    onSubmit={handleSearch}
                    className="flex w-full items-center gap-2 sm:w-auto"
                >
                    <div className="relative max-w-sm min-w-[220px] flex-1 sm:w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari tiket, alasan, pelapor..."
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
            </div>

            {/* List Moderasi */}
            <div className="space-y-4">
                {antreanModerasi.data.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <AdminEmptyState
                            icon={CheckCircle2}
                            title="Antrean Moderasi Bersih"
                            description="Tidak ada aduan pelanggaran konten yang memerlukan penanganan saat ini."
                        />
                    </div>
                ) : (
                    antreanModerasi.data.map((item) => (
                        <div
                            key={item.id}
                            className="space-y-4 rounded-xl border border-border bg-card p-5 transition-colors"
                        >
                            {/* Baris Atas: Aduan Info */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="destructive"
                                        className="text-caption-xs"
                                    >
                                        {LABEL_ALASAN[item.alasan] ||
                                            item.alasan}
                                    </Badge>
                                    <span className="text-caption-xs text-muted-foreground">
                                        •
                                    </span>
                                    <span className="text-caption-xs text-muted-foreground">
                                        Dilaporkan oleh warga{' '}
                                        <strong className="font-medium text-foreground">
                                            {item.pelapor_pengadu?.username ||
                                                'Warga'}
                                        </strong>
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-caption-xs text-muted-foreground">
                                        {formatTanggal(item.created_at)}
                                    </span>
                                    <Badge
                                        variant={
                                            item.status === 'selesai'
                                                ? 'closed'
                                                : 'sla-warn'
                                        }
                                        className="text-caption-xs"
                                    >
                                        {item.status === 'selesai'
                                            ? 'Selesai'
                                            : 'Menunggu tindakan'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Catatan Pelapor Warga */}
                            {item.catatan && (
                                <div className="rounded-lg border border-border bg-muted/30 p-3 text-body-sm text-foreground">
                                    <div className="mb-1 flex items-center gap-1.5 text-caption-xs font-medium text-foreground">
                                        <MessageSquare
                                            className="size-3.5 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span>Catatan dari Pelapor:</span>
                                    </div>
                                    <p className="text-muted-foreground italic">
                                        "{item.catatan}"
                                    </p>
                                </div>
                            )}

                            {/* Konten Tiket Yang Diadukan */}
                            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded border border-border bg-background px-2 py-0.5 text-caption-xs font-mono font-semibold text-foreground">
                                            {item.laporan.nomor_tiket}
                                        </span>
                                        {item.laporan.disembunyikan && (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1 text-[11px]"
                                            >
                                                <EyeOff
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    Disembunyikan dari Publik
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-caption-xs"
                                        title={`Buka tiket #${item.laporan.nomor_tiket}`}
                                        aria-label={`Buka tiket #${item.laporan.nomor_tiket}`}
                                        render={
                                            <a
                                                href={`/tiket/${item.laporan.nomor_tiket}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            />
                                        }
                                    >
                                        <span className="hidden sm:inline">
                                            Buka Halaman Tiket
                                        </span>
                                        <ExternalLink
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>

                                <div>
                                    <h4 className="text-body-medium font-semibold text-foreground">
                                        {item.laporan.judul}
                                    </h4>
                                    <p className="mt-1 text-body-sm whitespace-pre-line text-muted-foreground">
                                        {item.laporan.keterangan}
                                    </p>
                                </div>

                                {/* Profil Pembuat Tiket */}
                                <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-2 text-caption-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <User
                                            className="size-3 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        Pembuat:{' '}
                                        <strong className="font-medium text-foreground">
                                            {item.laporan.pelapor_tiket
                                                ?.username || '-'}
                                        </strong>
                                    </span>
                                    <span>
                                        Poin Peringatan:{' '}
                                        <strong
                                            className={
                                                (item.laporan.pelapor_tiket
                                                    ?.poin_peringatan ?? 0) > 0
                                                    ? 'font-semibold text-destructive'
                                                    : 'font-medium text-foreground'
                                            }
                                        >
                                            {item.laporan.pelapor_tiket
                                                ?.poin_peringatan ?? 0}
                                        </strong>
                                    </span>
                                    <span>
                                        Status Akun:{' '}
                                        <strong className="font-medium text-foreground capitalize">
                                            {item.laporan.pelapor_tiket
                                                ?.status_akun || 'aktif'}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Status Penyelesaian atau Tombol Tindakan */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                {item.status === 'selesai' ? (
                                    <div className="w-full rounded-lg border border-border bg-muted/40 p-3 text-body-sm text-foreground">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Shield
                                                className="size-4 text-primary"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                Tindakan Diambil:{' '}
                                                <strong className="text-foreground uppercase">
                                                    {item.tindakan}
                                                </strong>
                                                {item.moderator &&
                                                    ` oleh ${item.moderator.username}`}
                                            </span>
                                        </div>
                                        {item.catatan_moderator && (
                                            <p className="text-body-xs mt-1 text-muted-foreground">
                                                Catatan: "
                                                {item.catatan_moderator}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => bukaModalTindakan(item)}
                                        title={`Tentukan tindakan moderasi untuk tiket #${item.laporan.nomor_tiket}`}
                                        aria-label={`Tentukan tindakan moderasi untuk tiket #${item.laporan.nomor_tiket}`}
                                    >
                                        <ShieldAlert
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span className="hidden sm:inline">
                                            Tentukan Tindakan Moderasi
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {antreanModerasi.last_page > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                    {antreanModerasi.links.map((link, idx) => {
                        if (!link.url && !link.active) {
                            return null;
                        }
                        return (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
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
            )}

            {/* Modal Dialog Tindakan Moderasi */}
            <Dialog
                open={!!selectedItem}
                onOpenChange={(open) => !open && tutupModalTindakan()}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert
                                className="size-5 text-destructive"
                                aria-hidden="true"
                            />
                            <span>Tindakan Moderasi Konten</span>
                        </DialogTitle>
                        <DialogDescription>
                            Tinjau pelanggaran dan tetapkan konsekuensi moderasi
                            terhadap konten tiket atau akun.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <form
                            onSubmit={handleKirimTindakan}
                            className="space-y-4 pt-1"
                        >
                            {/* Ringkasan */}
                            <div className="text-body-xs space-y-1 rounded-lg border border-border bg-muted/40 p-3">
                                <div>
                                    <span className="text-muted-foreground">
                                        Tiket:
                                    </span>{' '}
                                    <strong className="font-mono font-semibold text-foreground">
                                        {selectedItem.laporan.nomor_tiket}
                                    </strong>{' '}
                                    — {selectedItem.laporan.judul}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Pelanggaran:
                                    </span>{' '}
                                    <strong className="font-medium text-destructive">
                                        {LABEL_ALASAN[selectedItem.alasan] ||
                                            selectedItem.alasan}
                                    </strong>
                                </div>
                            </div>

                            {/* Pilihan Tindakan */}
                            <Field className="space-y-2">
                                <FieldLabel>
                                    Pilih Tindakan Moderasi{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>

                                <div className="space-y-2">
                                    {/* Abaikan */}
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                            data.tindakan === 'diabaikan'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="diabaikan"
                                            checked={
                                                data.tindakan === 'diabaikan'
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'tindakan',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-0.5 accent-primary"
                                        />
                                        <div>
                                            <span className="block text-body-sm font-semibold text-foreground">
                                                Abaikan Laporan
                                            </span>
                                            <span className="text-caption-xs text-muted-foreground">
                                                Aduan tidak terbukti melanggar
                                                ketentuan. Tiket tetap aktif dan
                                                tampil publik.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Peringatan */}
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                            data.tindakan === 'peringatan'
                                                ? 'border-sla-warn bg-sla-warn/10'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="peringatan"
                                            checked={
                                                data.tindakan === 'peringatan'
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'tindakan',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-0.5 accent-amber-600"
                                        />
                                        <div>
                                            <span className="block text-body-sm font-semibold text-foreground">
                                                Beri Peringatan (+1 Poin
                                                Peringatan)
                                            </span>
                                            <span className="text-caption-xs text-muted-foreground">
                                                Berikan teguran pada akun
                                                pembuat tiket atas konten yang
                                                kurang pantas.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Sembunyikan */}
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                            data.tindakan === 'disembunyikan'
                                                ? 'border-destructive bg-destructive/10'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="disembunyikan"
                                            checked={
                                                data.tindakan ===
                                                'disembunyikan'
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'tindakan',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-0.5 accent-destructive"
                                        />
                                        <div>
                                            <span className="block text-body-sm font-semibold text-destructive">
                                                Sembunyikan Tiket dari Publik
                                            </span>
                                            <span className="text-caption-xs text-muted-foreground">
                                                Tiket ditutup aksesnya dari peta
                                                & publik. Proses penanganan
                                                operasional instansi tetap
                                                berjalan.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Bekukan */}
                                    <label
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                            data.tindakan === 'dibekukan'
                                                ? 'border-stage-audit bg-stage-audit/10'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="dibekukan"
                                            checked={
                                                data.tindakan === 'dibekukan'
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'tindakan',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-0.5 accent-purple-600"
                                        />
                                        <div>
                                            <span className="block text-body-sm font-semibold text-stage-audit">
                                                Bekukan Akun Pelapor (Sanksi
                                                Berat)
                                            </span>
                                            <span className="text-caption-xs text-muted-foreground">
                                                Akun dinonaktifkan secara
                                                permanen karena pelanggaran
                                                berat atau penyalahgunaan
                                                sistem.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </Field>

                            {/* Catatan Keputusan Moderator */}
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="catatan-moderator">
                                    Catatan Pertimbangan Moderator{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="catatan-moderator"
                                    maxLength={256}
                                    value={data.catatan}
                                    onChange={(e) =>
                                        setData('catatan', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Dasar pertimbangan dan temuan bukti moderator (maksimal 256 karakter)..."
                                    className="resize-none"
                                />
                                <div className="flex justify-between text-caption-xs text-muted-foreground">
                                    <span>
                                        Tercatat permanen di log audit sistem
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
                                    onClick={tutupModalTindakan}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant={
                                        data.tindakan === 'diabaikan'
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    disabled={
                                        processing ||
                                        data.catatan.trim().length < 10
                                    }
                                >
                                    {processing
                                        ? 'Menerapkan...'
                                        : 'Terapkan Keputusan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

ModerasiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Moderasi Konten" breadcrumb="Admin > Moderasi">
        {page}
    </InternalLayout>
);

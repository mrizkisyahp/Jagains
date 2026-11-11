import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRightLeft,
    CalendarClock,
    Camera,
    CheckCircle2,
    ClipboardCheck,
    Coins,
    ExternalLink,
    Eye,
    FileText,
    Hammer,
    MapPin,
    MessageSquareText,
    MoreHorizontal,
    Scale,
    ShieldX,
    Undo2,
    Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';
import InstansiEmptyState from '@/components/instansi/InstansiEmptyState';
import { detail } from '@/routes/tiket';
import type { LaporanItem } from '@/components/instansi/AntreanTiketTable';

export type { LaporanItem };

interface AntreanTiketCardsProps {
    items: LaporanItem[];
    onAksi: (aksi: string, laporan: LaporanItem) => void;
    hasFilters?: boolean;
    onReset?: () => void;
}

const PRIMARY_ACTIONS: Record<
    string,
    {
        action: string;
        label: string;
        icon: typeof CheckCircle2;
        className: string;
    }
> = {
    DITERUSKAN: {
        action: 'terima',
        label: 'Terima tiket',
        icon: CheckCircle2,
        className: 'bg-emerald-600 text-white focus:bg-emerald-700',
    },
    DITERIMA: {
        action: 'survei',
        label: 'Survei selesai',
        icon: ClipboardCheck,
        className: 'bg-emerald-600 text-white focus:bg-emerald-700',
    },
    DISURVEI: {
        action: 'anggaran',
        label: 'Jadwal anggaran',
        icon: Coins,
        className: 'bg-blue-600 text-white focus:bg-blue-700',
    },
    TERJADWAL_ANGGARAN: {
        action: 'mulai',
        label: 'Mulai kerjakan',
        icon: Hammer,
        className: 'bg-blue-600 text-white focus:bg-blue-700',
    },
    DIKERJAKAN: {
        action: 'selesai',
        label: 'Ajukan selesai',
        icon: Camera,
        className: 'bg-emerald-600 text-white focus:bg-emerald-700',
    },
    DISENGKETAKAN: {
        action: 'respons_sengketa',
        label: 'Respons sengketa',
        icon: Scale,
        className: 'bg-violet-600 text-white focus:bg-violet-700',
    },
};

export default function AntreanTiketCards({
    items,
    onAksi,
    hasFilters = false,
    onReset,
}: AntreanTiketCardsProps) {
    const [inspectedItem, setInspectedItem] = useState<LaporanItem | null>(
        null,
    );

    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card p-6 shadow-2xs sm:p-10">
                <InstansiEmptyState
                    title={
                        hasFilters
                            ? 'Tidak ada tiket yang cocok.'
                            : 'Belum ada tiket untuk instansi ini.'
                    }
                    description={
                        hasFilters
                            ? 'Coba kata kunci, lokasi, atau status lain.'
                            : 'Laporan yang ditugaskan ke instansi Anda akan muncul di sini.'
                    }
                    action={
                        hasFilters && onReset ? (
                            <Button
                                variant="outline"
                                onClick={onReset}
                                className="h-10 cursor-pointer rounded-xl shadow-none"
                            >
                                Reset filter
                            </Button>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {items.map((item) => {
                    const primary = PRIMARY_ACTIONS[item.status];
                    const isSelesai = [
                        'TERTUTUP_WARGA',
                        'TERTUTUP_AUDITOR',
                    ].includes(item.status);

                    return (
                        <article
                            key={item.id}
                            className="group flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-foreground/30 sm:gap-6 sm:p-5 md:flex-row"
                        >
                            {/* Sisi Kiri: Foto Laporan */}
                            <div className="relative flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted md:h-auto md:w-60">
                                {item.foto_awal_url ? (
                                    <img
                                        src={item.foto_awal_url}
                                        alt={item.judul}
                                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground/60 select-none">
                                        <Camera className="size-8 stroke-[1.5]" />
                                        <span className="text-[11px] font-semibold tracking-wide">
                                            Foto Laporan
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Sisi Kanan: Detail & Aksi */}
                            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                                {/* Baris 1: Status Badge & Menu Titik Tiga */}
                                <div className="flex items-center justify-between gap-2">
                                    <InstansiStatusBadge status={item.status} />

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 cursor-pointer rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    aria-label={`Menu aksi untuk ${item.nomor_tiket}`}
                                                />
                                            }
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-60"
                                        >
                                            <DropdownMenuGroup>
                                                <DropdownMenuLabel>
                                                    Aksi Tiket
                                                </DropdownMenuLabel>
                                                {primary && (
                                                    <>
                                                        <DropdownMenuItem
                                                            className={`mb-1 cursor-pointer font-semibold ${primary.className}`}
                                                            onClick={() =>
                                                                onAksi(
                                                                    primary.action,
                                                                    item,
                                                                )
                                                            }
                                                        >
                                                            <primary.icon className="size-4" />
                                                            {primary.label}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setInspectedItem(item)
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="size-4" />
                                                    Ringkasan tiket
                                                </DropdownMenuItem>

                                                {item.status ===
                                                    'DITERUSKAN' && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onAksi(
                                                                    'alihkan',
                                                                    item,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <ArrowRightLeft className="size-4" />
                                                            Alihkan ke dinas
                                                            lain
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onAksi(
                                                                    'kembalikan',
                                                                    item,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Undo2 className="size-4" />
                                                            Kembalikan ke Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onAksi(
                                                                    'usul_tolak',
                                                                    item,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <ShieldX className="size-4" />
                                                            Usulkan penolakan
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {(item.status ===
                                                    'DIKERJAKAN' ||
                                                    item.status ===
                                                        'DISENGKETAKAN' ||
                                                    item.total_berita_acara >
                                                        0) && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onAksi(
                                                                'berita_acara',
                                                                item,
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        <FileText className="size-4" />
                                                        Kelola berita acara (
                                                        {
                                                            item.total_berita_acara
                                                        }
                                                        )
                                                    </DropdownMenuItem>
                                                )}

                                                {(item.status ===
                                                    'TERJADWAL_ANGGARAN' ||
                                                    item.status ===
                                                        'DIKERJAKAN') && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onAksi(
                                                                'revisi_target',
                                                                item,
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        <CalendarClock className="size-4" />
                                                        Revisi janji target
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onAksi(
                                                            'tanggapan',
                                                            item,
                                                        )
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <MessageSquareText className="size-4" />
                                                    Beri tanggapan resmi
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem
                                                    render={
                                                        <Link
                                                            href={detail(
                                                                item.nomor_tiket,
                                                            )}
                                                        />
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <ExternalLink className="size-4" />
                                                    Lihat detail tiket
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Baris 2: Judul Laporan */}
                                <div className="space-y-1.5">
                                    <Link
                                        href={detail(item.nomor_tiket)}
                                        className="line-clamp-2 text-body-base font-display font-bold text-foreground transition-colors hover:text-primary sm:text-body-lg"
                                    >
                                        {item.judul}
                                    </Link>

                                    {/* Baris 3: Kategori */}
                                    <div className="flex items-center gap-2 text-caption-xs text-muted-foreground sm:text-body-sm">
                                        <Wrench className="size-4 shrink-0 text-muted-foreground/80" />
                                        <span className="truncate">
                                            {item.kategori_nama ??
                                                'Kategori belum tersedia'}
                                        </span>
                                    </div>

                                    {/* Baris 4: Lokasi */}
                                    <div className="flex items-center gap-2 text-caption-xs text-muted-foreground sm:text-body-sm">
                                        <MapPin className="size-4 shrink-0 text-muted-foreground/80" />
                                        <span className="truncate">
                                            {item.wilayah_nama ??
                                                'Lokasi belum tersedia'}
                                        </span>
                                    </div>
                                </div>

                                {/* Baris 5: Footer SLA & Nomor Tiket */}
                                <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                                    <div className="flex items-center gap-2">
                                        {item.sisa_hari_sla !== null ? (
                                            item.sisa_hari_sla < 0 ? (
                                                <span className="inline-flex items-center gap-1.5 text-caption-xs font-semibold text-destructive sm:text-body-sm">
                                                    <span className="size-2 shrink-0 rounded-full bg-destructive" />
                                                    Lewat batas waktu{' '}
                                                    {Math.abs(
                                                        item.sisa_hari_sla,
                                                    )}{' '}
                                                    hari
                                                </span>
                                            ) : item.sisa_hari_sla === 0 ? (
                                                <span className="inline-flex items-center gap-1.5 text-caption-xs font-semibold text-amber-600 sm:text-body-sm dark:text-amber-400">
                                                    <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                                                    Jatuh tempo hari ini
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-caption-xs font-medium text-muted-foreground sm:text-body-sm">
                                                    <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                                                    Sisa {item.sisa_hari_sla}{' '}
                                                    hari kerja
                                                </span>
                                            )
                                        ) : isSelesai ? (
                                            <span className="inline-flex items-center gap-1.5 text-caption-xs font-medium text-emerald-600 sm:text-body-sm dark:text-emerald-400">
                                                <CheckCircle2 className="size-3.5" />
                                                Tiket Selesai
                                            </span>
                                        ) : (
                                            <span className="text-caption-xs text-muted-foreground sm:text-body-sm">
                                                {item.created_at_human}
                                            </span>
                                        )}
                                    </div>

                                    <span className="rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-caption-xs font-mono text-muted-foreground/80">
                                        {item.nomor_tiket}
                                    </span>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Modal Dialog Ringkasan Tiket (Inspected Item) */}
            <Dialog
                open={Boolean(inspectedItem)}
                onOpenChange={(open) => {
                    if (!open) setInspectedItem(null);
                }}
            >
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="pr-6 text-display-sm font-display">
                            Ringkasan Tiket
                        </DialogTitle>
                        <DialogDescription>
                            {inspectedItem?.nomor_tiket}
                        </DialogDescription>
                    </DialogHeader>
                    {inspectedItem && (
                        <div className="flex flex-col gap-6 text-body-sm">
                            <div className="space-y-1">
                                <h3 className="text-body-base font-bold text-foreground">
                                    {inspectedItem.judul}
                                </h3>
                                <p className="whitespace-pre-wrap text-muted-foreground">
                                    {inspectedItem.keterangan}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
                                <div>
                                    <span className="block text-caption-xs text-muted-foreground">
                                        Kategori
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {inspectedItem.kategori_nama ?? '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-caption-xs text-muted-foreground">
                                        Wilayah
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {inspectedItem.wilayah_nama ?? '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-caption-xs text-muted-foreground">
                                        Target Selesai
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {inspectedItem.tanggal_target_format ??
                                            'Belum ditetapkan'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-caption-xs text-muted-foreground">
                                        Status Terkini
                                    </span>
                                    <div className="mt-1">
                                        <InstansiStatusBadge
                                            status={inspectedItem.status}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setInspectedItem(null)}
                                    className="cursor-pointer rounded-xl"
                                >
                                    Tutup
                                </Button>
                                <Button
                                    render={
                                        <Link
                                            href={detail(
                                                inspectedItem.nomor_tiket,
                                            )}
                                        />
                                    }
                                    className="cursor-pointer rounded-xl"
                                >
                                    Buka Halaman Tiket
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

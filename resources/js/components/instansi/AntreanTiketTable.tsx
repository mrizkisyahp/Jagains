import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
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
    MessageSquareText,
    MoreHorizontal,
    Scale,
    ShieldX,
    Undo2,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
import BadgeSlaCountdown from '@/components/instansi/BadgeSlaCountdown';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';
import InstansiEmptyState from '@/components/instansi/InstansiEmptyState';
import { detail } from '@/routes/tiket';

export interface LaporanItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    kategori_nama: string | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    lintang: number;
    bujur: number;
    foto_awal_url: string | null;
    jumlah_pengalihan: number;
    jenis_pendanaan: string | null;
    tanggal_target: string | null;
    tanggal_target_format: string | null;
    sla_tahap: string | null;
    sla_jatuh_tempo: string | null;
    sla_jatuh_tempo_format: string | null;
    sisa_hari_sla: number | null;
    persen_sla: number | null;
    total_berita_acara: number;
    berita_acara_terakhir?: {
        versi: number;
        kegiatan: string;
        hasil: string;
        hambatan?: string | null;
        waktu: string;
    } | null;
    semua_berita_acara?: Array<{
        versi: number;
        kegiatan: string;
        hasil: string;
        hambatan?: string | null;
        waktu: string;
    }>;
    riwayat_pengalihan?: Array<{
        asal: string;
        tujuan: string;
        alasan: string;
        waktu: string;
    }>;
    created_at_human: string;
    created_at_format: string;
}

const SUMBER_DANA: Record<string, string> = {
    APBD_KOTA: 'Anggaran pemerintah kota (APBD)',
    APBD_PROVINSI: 'Anggaran pemerintah provinsi (APBD)',
    APBN: 'Anggaran pemerintah pusat (APBN)',
    LAINNYA: 'Sumber dana lainnya',
};

interface AntreanTiketTableProps {
    items: LaporanItem[];
    onAksi: (aksi: string, laporan: LaporanItem) => void;
    hasFilters?: boolean;
    onReset?: () => void;
}

const PRIMARY_ACTIONS = {
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

export default function AntreanTiketTable({
    items,
    onAksi,
    hasFilters = false,
    onReset,
}: AntreanTiketTableProps) {
    const [inspectedItem, setInspectedItem] = useState<LaporanItem | null>(
        null,
    );
    const sla = (item: LaporanItem, compact = true) => (
        <BadgeSlaCountdown
            tahap={item.sla_tahap}
            jatuhTempo={item.sla_jatuh_tempo_format}
            sisaHari={item.sisa_hari_sla}
            persenSla={item.persen_sla}
            status={item.status}
            compact={compact}
        />
    );
    const actions = (item: LaporanItem) => {
        const primary =
            PRIMARY_ACTIONS[item.status as keyof typeof PRIMARY_ACTIONS];
        return (
            <div className="flex items-center gap-1 xl:justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="outline"
                                className="size-11 shadow-none md:size-9"
                                aria-label={`Aksi lainnya untuk ${item.nomor_tiket}`}
                            />
                        }
                    >
                        <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Aksi tiket</DropdownMenuLabel>
                            {primary && (
                                <>
                                    <DropdownMenuItem
                                        className={`mb-1 font-semibold ${primary.className}`}
                                        onClick={() =>
                                            onAksi(primary.action, item)
                                        }
                                    >
                                        <primary.icon />
                                        {primary.label}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={() => setInspectedItem(item)}
                            >
                                <Eye />
                                Ringkasan tiket
                            </DropdownMenuItem>
                            {item.status === 'DITERUSKAN' && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => onAksi('alihkan', item)}
                                    >
                                        <ArrowRightLeft />
                                        Alihkan ke dinas lain
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onAksi('kembalikan', item)
                                        }
                                    >
                                        <Undo2 />
                                        Kembalikan ke Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onAksi('usul_tolak', item)
                                        }
                                    >
                                        <ShieldX />
                                        Usulkan penolakan
                                    </DropdownMenuItem>
                                </>
                            )}
                            {(item.status === 'DIKERJAKAN' ||
                                item.status === 'DISENGKETAKAN' ||
                                item.total_berita_acara > 0) && (
                                <DropdownMenuItem
                                    onClick={() => onAksi('berita_acara', item)}
                                >
                                    <FileText />
                                    Kelola berita acara (
                                    {item.total_berita_acara})
                                </DropdownMenuItem>
                            )}
                            {(item.status === 'TERJADWAL_ANGGARAN' ||
                                item.status === 'DIKERJAKAN') && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onAksi('revisi_target', item)
                                    }
                                >
                                    <CalendarClock />
                                    Revisi janji target
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onAksi('tanggapan', item)}
                            >
                                <MessageSquareText />
                                Beri tanggapan resmi
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                render={
                                    <Link href={detail(item.nomor_tiket)} />
                                }
                            >
                                <ExternalLink />
                                Lihat detail tiket
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    if (items.length === 0) {
        return (
            <div className="px-5 [&>div]:rounded-none [&>div]:border-0">
                <InstansiEmptyState
                    title={
                        hasFilters
                            ? 'Tidak ada tiket yang cocok.'
                            : 'Belum ada tiket untuk instansi ini.'
                    }
                    description={
                        hasFilters
                            ? 'Coba kata kunci, kategori, atau status lain.'
                            : 'Laporan yang ditugaskan ke instansi Anda akan muncul di sini.'
                    }
                    action={
                        hasFilters && onReset ? (
                            <Button
                                variant="outline"
                                onClick={onReset}
                                className="h-11 shadow-none md:h-9"
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
            <div className="hidden xl:block">
                <Table className="min-w-[1120px] table-fixed">
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-[26%] px-5 text-body-sm">
                                Tiket
                            </TableHead>
                            <TableHead className="w-[13%] text-body-sm">
                                Lokasi & kategori
                            </TableHead>
                            <TableHead className="w-[17%] text-body-sm">
                                Status
                            </TableHead>
                            <TableHead className="w-[17%] text-body-sm">
                                Batas waktu
                            </TableHead>
                            <TableHead className="w-[10%] text-body-sm">
                                Target selesai
                            </TableHead>
                            <TableHead className="w-[17%] px-3 text-right text-body-sm">
                                Tindakan
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow
                                key={item.id}
                                className="hover:bg-muted/25"
                            >
                                <TableCell className="px-5 py-3">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <Link
                                            href={detail(item.nomor_tiket)}
                                            title={item.judul}
                                            className="block truncate text-body-base font-medium text-foreground underline-offset-4 hover:underline"
                                        >
                                            {item.judul}
                                        </Link>
                                        <span className="text-body-sm text-muted-foreground">
                                            {item.nomor_tiket}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex flex-col gap-1">
                                        <span
                                            className="block truncate text-body-sm"
                                            title={
                                                item.wilayah_nama ?? undefined
                                            }
                                        >
                                            {item.wilayah_nama ??
                                                'Lokasi belum tersedia'}
                                        </span>
                                        <span
                                            className="block truncate text-body-sm text-muted-foreground"
                                            title={
                                                item.kategori_nama ?? undefined
                                            }
                                        >
                                            {item.kategori_nama ??
                                                'Kategori belum tersedia'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 whitespace-normal">
                                    <InstansiStatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className="py-3 whitespace-normal">
                                    {sla(item)}
                                </TableCell>
                                <TableCell className="py-3 text-body-sm tabular-nums">
                                    {item.tanggal_target_format ??
                                        'Belum ditetapkan'}
                                </TableCell>
                                <TableCell className="px-3 py-3">
                                    {actions(item)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <ul className="divide-y divide-border px-4 xl:hidden">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="flex min-w-0 flex-col gap-3 py-4"
                    >
                        <div className="flex flex-col gap-1">
                            <Link
                                href={detail(item.nomor_tiket)}
                                className="line-clamp-2 text-body-base font-medium text-foreground"
                            >
                                {item.judul}
                            </Link>
                            <span className="text-body-sm text-muted-foreground">
                                {item.nomor_tiket}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <InstansiStatusBadge status={item.status} />
                            {sla(item)}
                        </div>
                        <p className="truncate text-body-sm text-muted-foreground">
                            {item.wilayah_nama ?? 'Lokasi belum tersedia'}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-body-sm text-muted-foreground">
                                Target:{' '}
                                {item.tanggal_target_format ??
                                    'Belum ditetapkan'}
                            </span>
                            {actions(item)}
                        </div>
                    </li>
                ))}
            </ul>
            <Dialog
                open={Boolean(inspectedItem)}
                onOpenChange={(open) => {
                    if (!open) setInspectedItem(null);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="pr-6 text-display-sm font-display">
                            Ringkasan tiket
                        </DialogTitle>
                        <DialogDescription>
                            {inspectedItem?.nomor_tiket}
                        </DialogDescription>
                    </DialogHeader>
                    {inspectedItem && (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <h3 className="text-body-base font-semibold">
                                    {inspectedItem.judul}
                                </h3>
                                <InstansiStatusBadge
                                    status={inspectedItem.status}
                                />
                                <p className="text-body-base whitespace-pre-wrap text-muted-foreground">
                                    {inspectedItem.keterangan}
                                </p>
                            </div>
                            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {[
                                    [
                                        'Lokasi',
                                        inspectedItem.wilayah_nama ??
                                            'Belum tersedia',
                                    ],
                                    [
                                        'Kategori',
                                        inspectedItem.kategori_nama ??
                                            'Belum tersedia',
                                    ],
                                    ['Keparahan', inspectedItem.keparahan],
                                    [
                                        'Tanggal masuk',
                                        inspectedItem.created_at_format,
                                    ],
                                    [
                                        'Target selesai',
                                        inspectedItem.tanggal_target_format ??
                                            'Belum ditetapkan',
                                    ],
                                    [
                                        'Sumber dana',
                                        inspectedItem.jenis_pendanaan
                                            ? (SUMBER_DANA[
                                                  inspectedItem.jenis_pendanaan
                                              ] ?? 'Belum dikenali')
                                            : 'Belum ditetapkan',
                                    ],
                                    [
                                        'Pengalihan',
                                        `${inspectedItem.jumlah_pengalihan} kali`,
                                    ],
                                    [
                                        'Berita acara',
                                        `${inspectedItem.total_berita_acara} versi`,
                                    ],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex flex-col gap-1"
                                    >
                                        <dt className="text-body-sm text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-body-base capitalize">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="flex flex-col gap-2 border-t border-border pt-5">
                                <h4 className="text-body-medium font-semibold">
                                    Batas waktu tindak lanjut
                                </h4>
                                {sla(inspectedItem, false)}
                            </div>
                            <Button
                                render={
                                    <Link
                                        href={detail(inspectedItem.nomor_tiket)}
                                    />
                                }
                                variant="outline"
                                className="h-11 w-fit shadow-none"
                            >
                                Lihat detail lengkap
                                <ExternalLink data-icon="inline-end" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

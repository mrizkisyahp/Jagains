import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    MapPin,
    Calendar,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    FileText,
    Camera,
    Hammer,
    Coins,
    ClipboardCheck,
    MessageSquareText,
    MoreHorizontal,
    ExternalLink,
    ShieldX,
    CalendarClock,
    Undo2,
    Scale,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BadgeSlaCountdown from '@/components/instansi/BadgeSlaCountdown';

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

interface AntreanTiketTableProps {
    items: LaporanItem[];
    onAksi: (aksi: string, laporan: LaporanItem) => void;
}

export default function AntreanTiketTable({ items, onAksi }: AntreanTiketTableProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl">
                <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <h3 className="font-display text-body-medium font-bold text-foreground">
                    Tidak Ada Tiket dalam Antrean Ini
                </h3>
                <p className="text-body-sm text-muted-foreground max-w-sm mt-1">
                    Seluruh laporan masyarakat pada kategori filter ini telah tertangani dengan baik atau belum ada tiket baru yang dialirkan.
                </p>
            </div>
        );
    }

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'DITERUSKAN':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20">DITERUSKAN</Badge>;
            case 'DITERIMA':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">DITERIMA</Badge>;
            case 'DISURVEI':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">DISURVEI</Badge>;
            case 'TERJADWAL_ANGGARAN':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">TERJADWAL ANGGARAN</Badge>;
            case 'DIKERJAKAN':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">DIKERJAKAN</Badge>;
            case 'MENUNGGU_VERIFIKASI':
                return <Badge variant="secondary" className="font-mono text-caption-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">MENUNGGU VERIFIKASI</Badge>;
            case 'DISENGKETAKAN':
                return <Badge variant="destructive" className="font-mono text-caption-xs">DISENGKETAKAN</Badge>;
            case 'USULAN_TOLAK':
                return <Badge variant="outline" className="font-mono text-caption-xs text-rose-600 border-rose-300">USULAN TOLAK</Badge>;
            case 'PERLU_ROUTING':
                return <Badge variant="outline" className="font-mono text-caption-xs text-muted-foreground">PERLU ROUTING</Badge>;
            default:
                return <Badge variant="outline" className="font-mono text-caption-xs">{status}</Badge>;
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-[140px] font-semibold text-caption-xs">Nomor Tiket</TableHead>
                        <TableHead className="min-w-[220px] font-semibold text-caption-xs">Fasilitas & Lokasi</TableHead>
                        <TableHead className="w-[140px] font-semibold text-caption-xs">Status Alur</TableHead>
                        <TableHead className="w-[150px] font-semibold text-caption-xs">Sisa Waktu SLA</TableHead>
                        <TableHead className="w-[160px] font-semibold text-caption-xs">Komitmen Target</TableHead>
                        <TableHead className="w-[120px] text-right font-semibold text-caption-xs">Aksi Operasional</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id} className="transition-colors hover:bg-muted/20">
                            {/* Kolom Nomor Tiket */}
                            <TableCell className="align-top py-4">
                                <div className="space-y-1">
                                    <Link
                                        href={`/tiket/${item.nomor_tiket}`}
                                        className="font-mono text-body-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        {item.nomor_tiket}
                                        <ExternalLink className="size-3 text-muted-foreground opacity-60" />
                                    </Link>
                                    <p className="text-caption-xs text-muted-foreground">{item.created_at_human}</p>
                                    {item.jumlah_pengalihan > 0 && (
                                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                                            Dialihkan {item.jumlah_pengalihan}x
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>

                            {/* Kolom Fasilitas & Lokasi */}
                            <TableCell className="align-top py-4">
                                <div className="space-y-1">
                                    <p className="text-body-sm font-semibold text-foreground line-clamp-1">{item.judul}</p>
                                    <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                        <MapPin className="size-3 shrink-0 text-primary" />
                                        <span className="truncate">{item.wilayah_nama || 'Lokasi Terdaftar'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="outline" className="text-caption-xs py-0">
                                            {item.kategori_nama || 'Fasilitas'}
                                        </Badge>
                                        <span className={`text-[11px] font-semibold capitalize ${
                                            item.keparahan === 'berat' ? 'text-destructive' : item.keparahan === 'sedang' ? 'text-amber-600' : 'text-muted-foreground'
                                        }`}>
                                            Keparahan: {item.keparahan}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Kolom Status Alur */}
                            <TableCell className="align-top py-4">
                                <div className="space-y-1.5">
                                    {renderStatusBadge(item.status)}
                                    {item.total_berita_acara > 0 && (
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <FileText className="size-3 text-primary" />
                                            BA: {item.total_berita_acara} Versi
                                        </p>
                                    )}
                                </div>
                            </TableCell>

                            {/* Kolom Sisa Waktu SLA */}
                            <TableCell className="align-top py-4">
                                <BadgeSlaCountdown
                                    tahap={item.sla_tahap}
                                    jatuhTempo={item.sla_jatuh_tempo_format}
                                    sisaHari={item.sisa_hari_sla}
                                    persenSla={item.persen_sla}
                                />
                            </TableCell>

                            {/* Kolom Komitmen Target */}
                            <TableCell className="align-top py-4">
                                {item.tanggal_target ? (
                                    <div className="space-y-1 text-body-sm">
                                        <div className="flex items-center gap-1 font-semibold text-foreground text-caption-xs">
                                            <Calendar className="size-3.5 text-violet-600" />
                                            <span>{item.tanggal_target_format}</span>
                                        </div>
                                        {item.jenis_pendanaan && (
                                            <p className="text-[11px] font-mono text-muted-foreground">
                                                Sumber: {item.jenis_pendanaan}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-caption-xs text-muted-foreground italic">
                                        Belum dijadwalkan
                                    </span>
                                )}
                            </TableCell>

                            {/* Kolom Aksi Operasional Kontekstual */}
                            <TableCell className="align-top py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    {/* Aksi Utama Langsung Sesuai Status */}
                                    {item.status === 'DITERUSKAN' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('terima', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1"
                                        >
                                            <CheckCircle2 className="size-3.5" />
                                            Terima
                                        </Button>
                                    )}

                                    {item.status === 'DITERIMA' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('survei', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <ClipboardCheck className="size-3.5" />
                                            Survei Selesai
                                        </Button>
                                    )}

                                    {item.status === 'DISURVEI' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('anggaran', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                                        >
                                            <Coins className="size-3.5" />
                                            Jadwal Anggaran
                                        </Button>
                                    )}

                                    {item.status === 'TERJADWAL_ANGGARAN' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('mulai', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            <Hammer className="size-3.5" />
                                            Mulai Kerjakan
                                        </Button>
                                    )}

                                    {item.status === 'DIKERJAKAN' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('selesai', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <Camera className="size-3.5" />
                                            Ajukan Selesai
                                        </Button>
                                    )}

                                    {item.status === 'DISENGKETAKAN' && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAksi('respons_sengketa', item)}
                                            className="h-8 text-caption-xs font-semibold gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                        >
                                            <Scale className="size-3.5" />
                                            Respons Sengketa
                                        </Button>
                                    )}

                                    {/* Dropdown Menu untuk Aksi Tambahan */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-muted/80 text-foreground transition-colors cursor-pointer">
                                            <MoreHorizontal className="size-4" />
                                            <span className="sr-only">Menu Opsi</span>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuLabel className="text-caption-xs">Aksi Operasional</DropdownMenuLabel>
                                            <DropdownMenuSeparator />

                                            {/* Opsi Status DITERUSKAN */}
                                            {item.status === 'DITERUSKAN' && (
                                                <>
                                                    <DropdownMenuItem onClick={() => onAksi('alihkan', item)} className="gap-2 text-caption-xs">
                                                        <ArrowRightLeft className="size-3.5 text-amber-600" />
                                                        Alihkan ke Dinas Lain
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onAksi('kembalikan', item)} className="gap-2 text-caption-xs">
                                                        <Undo2 className="size-3.5 text-rose-600" />
                                                        Kembalikan ke Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onAksi('usul_tolak', item)} className="gap-2 text-caption-xs text-destructive">
                                                        <ShieldX className="size-3.5" />
                                                        Usulkan Penolakan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}

                                            {/* Opsi Berita Acara & Revisi Target */}
                                            {(item.status === 'DIKERJAKAN' || item.status === 'DISENGKETAKAN' || item.total_berita_acara > 0) && (
                                                <DropdownMenuItem onClick={() => onAksi('berita_acara', item)} className="gap-2 text-caption-xs">
                                                    <FileText className="size-3.5 text-primary" />
                                                    Kelola Berita Acara ({item.total_berita_acara})
                                                </DropdownMenuItem>
                                            )}

                                            {(item.status === 'TERJADWAL_ANGGARAN' || item.status === 'DIKERJAKAN') && (
                                                <DropdownMenuItem onClick={() => onAksi('revisi_target', item)} className="gap-2 text-caption-xs">
                                                    <CalendarClock className="size-3.5 text-amber-600" />
                                                    Revisi Janji Target
                                                </DropdownMenuItem>
                                            )}

                                            {/* Tanggapan Resmi Linimasa */}
                                            <DropdownMenuItem onClick={() => onAksi('tanggapan', item)} className="gap-2 text-caption-xs">
                                                <MessageSquareText className="size-3.5 text-blue-600" />
                                                Beri Tanggapan Resmi
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => router.visit(`/tiket/${item.nomor_tiket}`)}
                                                className="gap-2 text-caption-xs cursor-pointer"
                                            >
                                                <ExternalLink className="size-3.5 text-muted-foreground" />
                                                Lihat Detail Publik
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

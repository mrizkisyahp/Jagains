import { ReactNode, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import {
    FileText,
    ThumbsUp,
    MapPin,
    Building2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Copy,
    Check,
    Plus,
    Search,
    ShieldAlert,
    ImageIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface LaporanItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    kategori_nama: string | null;
    instansi_nama: string | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    sla_tahap: string | null;
    sla_jatuh_tempo: string | null;
    dibuat_pada: string;
    tanggal_format: string;
}

interface DukunganItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    status: string;
    kategori_nama: string | null;
    instansi_nama: string | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    didukung_pada: string;
}

interface RiwayatProps {
    laporanList: LaporanItem[];
    dukunganList: DukunganItem[];
}

const STATUS_CONFIG: Record<
    string,
    { label: string; badgeClass: string; icon: typeof Clock }
> = {
    DITERUSKAN: {
        label: 'Diteruskan ke Instansi',
        badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800',
        icon: Building2,
    },
    PERLU_ROUTING: {
        label: 'Menunggu Pengalihan',
        badgeClass: 'bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-800',
        icon: Clock,
    },
    USULAN_TOLAK: {
        label: 'Usulan Penolakan',
        badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800',
        icon: AlertCircle,
    },
    DITOLAK: {
        label: 'Ditolak (Final)',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: AlertCircle,
    },
    DITERIMA: {
        label: 'Diterima Instansi',
        badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-800',
        icon: CheckCircle2,
    },
    DISURVEI: {
        label: 'Selesai Survei',
        badgeClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-300 dark:text-cyan-400 dark:border-cyan-800',
        icon: MapPin,
    },
    TERJADWAL_ANGGARAN: {
        label: 'Terjadwal Anggaran',
        badgeClass: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-800',
        icon: Calendar,
    },
    DIKERJAKAN: {
        label: 'Sedang Dikerjakan',
        badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-300 dark:text-teal-400 dark:border-teal-800',
        icon: Clock,
    },
    MENUNGGU_VERIFIKASI: {
        label: 'Menunggu Verifikasi Warga',
        badgeClass: 'bg-purple-500/10 text-purple-700 border-purple-300 dark:text-purple-400 dark:border-purple-800',
        icon: AlertCircle,
    },
    DISENGKETAKAN: {
        label: 'Disengketakan Warga',
        badgeClass: 'bg-red-500/10 text-red-700 border-red-300 dark:text-red-400 dark:border-red-800',
        icon: ShieldAlert,
    },
    MENUNGGU_KEPUTUSAN_AUDITOR: {
        label: 'Menunggu Putusan Auditor',
        badgeClass: 'bg-violet-500/10 text-violet-700 border-violet-300 dark:text-violet-400 dark:border-violet-800',
        icon: ShieldAlert,
    },
    TERTUTUP_WARGA: {
        label: 'Ditutup oleh Warga (Sah)',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800',
        icon: CheckCircle2,
    },
    TERTUTUP_AUDITOR: {
        label: 'Ditutup oleh Auditor (Sah)',
        badgeClass: 'bg-emerald-600/15 text-emerald-800 border-emerald-400 dark:text-emerald-300 dark:border-emerald-700',
        icon: CheckCircle2,
    },
};

const KEPARAHAN_CONFIG = {
    ringan: {
        label: 'Ringan',
        class: 'bg-muted text-muted-foreground border-border',
    },
    sedang: {
        label: 'Sedang',
        class: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400',
    },
    berat: {
        label: 'Berat',
        class: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 font-semibold',
    },
};

export default function RiwayatLaporanPage({
    laporanList = [],
    dukunganList = [],
}: RiwayatProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

    const handleCopy = (ticket: string) => {
        navigator.clipboard.writeText(ticket);
        setCopiedTicket(ticket);
        toast.success('Disalin!', `Nomor tiket ${ticket} disalin ke papan klip.`);
        setTimeout(() => setCopiedTicket(null), 2000);
    };

    const filteredLaporan = laporanList.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_tiket.toLowerCase().includes(q) ||
            item.judul.toLowerCase().includes(q) ||
            (item.kategori_nama && item.kategori_nama.toLowerCase().includes(q)) ||
            (item.wilayah_nama && item.wilayah_nama.toLowerCase().includes(q))
        );
    });

    const filteredDukungan = dukunganList.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_tiket.toLowerCase().includes(q) ||
            item.judul.toLowerCase().includes(q) ||
            (item.kategori_nama && item.kategori_nama.toLowerCase().includes(q)) ||
            (item.wilayah_nama && item.wilayah_nama.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            <Head title="Riwayat Laporan & Dukungan - Jagains" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Riwayat Laporan & Dukungan
                    </h1>
                    <p className="mt-1 text-body-sm text-muted-foreground">
                        Pantau status pengerjaan fasilitas publik yang Anda laporkan dan dukung secara transparan.
                    </p>
                </div>
                <Link
                    href="/warga/lapor"
                    className={cn(buttonVariants(), "gap-2 self-start sm:self-auto h-11 px-5 font-semibold")}
                >
                    <Plus className="size-4" />
                    Buat Laporan Baru
                </Link>
            </div>

            {/* Tabs & Search Bar */}
            <Tabs defaultValue="laporan" className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                    <TabsList className="grid grid-cols-2 w-full sm:w-auto min-h-11 p-1 bg-muted rounded-xl gap-1">
                        <TabsTrigger
                            value="laporan"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-sm font-semibold transition-all"
                        >
                            <FileText className="size-4" />
                            Aduan Saya
                            <span className="ml-1 rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary font-bold">
                                {laporanList.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="dukungan"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-sm font-semibold transition-all"
                        >
                            <ThumbsUp className="size-4" />
                            Aduan Didukung
                            <span className="ml-1 rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary font-bold">
                                {dukunganList.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari tiket, judul, kelurahan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-body-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Tab 1: Laporan Saya */}
                <TabsContent value="laporan" className="space-y-4">
                    {filteredLaporan.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <FileText className="size-7" />
                            </div>
                            <h3 className="font-display text-display-sm font-semibold text-foreground mt-4">
                                {searchQuery
                                    ? 'Tidak ada laporan yang sesuai pencarian'
                                    : 'Belum Ada Laporan yang Diajukan'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-body-sm text-muted-foreground">
                                {searchQuery
                                    ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                                    : 'Anda belum pernah mengirimkan laporan kerusakan fasilitas umum. Laporkan jalan berlubang, lampu padam, atau fasilitas rusak lainnya sekarang.'}
                            </p>
                            {!searchQuery && (
                                <div className="mt-6">
                                    <Link
                                        href="/warga/lapor"
                                        className={cn(buttonVariants(), "gap-2 h-11 px-6 font-semibold")}
                                    >
                                        <Plus className="size-4" />
                                        Buat Laporan Pertama Anda
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {filteredLaporan.map((laporan) => {
                                const statusInfo =
                                    STATUS_CONFIG[laporan.status] || {
                                        label: laporan.status,
                                        badgeClass: 'bg-muted text-muted-foreground border-border',
                                        icon: Clock,
                                    };
                                const StatusIcon = statusInfo.icon;
                                const keparahanInfo =
                                    KEPARAHAN_CONFIG[laporan.keparahan] ||
                                    KEPARAHAN_CONFIG.ringan;

                                return (
                                    <div
                                        key={laporan.id}
                                        className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md text-card-foreground space-y-4"
                                    >
                                        <div className="space-y-3.5">
                                            {/* Top Info Bar */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-body-sm font-bold text-foreground">
                                                        {laporan.nomor_tiket}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(laporan.nomor_tiket)}
                                                        title="Salin Nomor Tiket"
                                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                                    >
                                                        {copiedTicket === laporan.nomor_tiket ? (
                                                            <Check className="size-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption-xs font-semibold ${statusInfo.badgeClass}`}
                                                >
                                                    <StatusIcon className="size-3.5" />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {/* Photo & Main Details */}
                                            <div className="flex gap-4">
                                                {laporan.foto_url ? (
                                                    <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                                        <img
                                                            src={laporan.foto_url}
                                                            alt={laporan.judul}
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground">
                                                        <ImageIcon className="size-8" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {laporan.kategori_nama && (
                                                            <span className="rounded-md bg-muted px-2.5 py-0.5 text-caption-xs font-medium text-foreground">
                                                                {laporan.kategori_nama}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-caption-xs ${keparahanInfo.class}`}
                                                        >
                                                            {keparahanInfo.label}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-display text-body-medium font-bold text-foreground line-clamp-1">
                                                        {laporan.judul}
                                                    </h3>

                                                    <p className="line-clamp-2 text-body-sm text-muted-foreground">
                                                        {laporan.keterangan}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location & Department */}
                                            <div className="space-y-1.5 rounded-xl bg-muted/40 border border-border/60 p-3 text-body-sm text-muted-foreground">
                                                {laporan.wilayah_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="size-4 shrink-0 text-primary" />
                                                        <span className="truncate">
                                                            {laporan.wilayah_nama}
                                                            {laporan.kota_nama && `, ${laporan.kota_nama}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {laporan.instansi_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate font-medium text-foreground">
                                                            {laporan.instansi_nama}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SLA / Target Alert if any */}
                                            {laporan.sla_jatuh_tempo && (
                                                <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                    <Clock className="size-3.5 text-amber-500" />
                                                    <span>
                                                        Batas SLA Tahap{' '}
                                                        <span className="font-semibold text-foreground">
                                                            {laporan.sla_tahap}
                                                        </span>
                                                        : {laporan.sla_jatuh_tempo}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Callout if status MENUNGGU_VERIFIKASI */}
                                            {laporan.status === 'MENUNGGU_VERIFIKASI' && (
                                                <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-body-sm text-purple-800 dark:text-purple-300">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                                                        <span>
                                                            Pekerjaan fisik selesai diajukan dinas.
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href="/warga/verifikasi"
                                                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-purple-900 dark:text-purple-200 hover:underline"
                                                    >
                                                        Konfirmasi Hasil
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Bar */}
                                        <div className="flex items-center justify-between border-t border-border pt-3 text-caption-xs text-muted-foreground">
                                            <span>Diajukan {laporan.dibuat_pada}</span>
                                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                <ThumbsUp className="size-3.5 text-primary" />
                                                <span>{laporan.jumlah_dukungan} dukungan</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: Aduan yang Didukung */}
                <TabsContent value="dukungan" className="space-y-4">
                    {filteredDukungan.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ThumbsUp className="size-7" />
                            </div>
                            <h3 className="font-display text-display-sm font-semibold text-foreground mt-4">
                                {searchQuery
                                    ? 'Tidak ada dukungan yang sesuai pencarian'
                                    : 'Belum Ada Aduan yang Anda Dukung'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-body-sm text-muted-foreground">
                                {searchQuery
                                    ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                                    : 'Saat Anda membuat laporan dan sistem mendeteksi kerusakan serupa di dekat Anda, Anda dapat memberikan dukungan untuk mempercepat prioritas penanganan.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {filteredDukungan.map((item) => {
                                const statusInfo =
                                    STATUS_CONFIG[item.status] || {
                                        label: item.status,
                                        badgeClass: 'bg-muted text-muted-foreground border-border',
                                        icon: Clock,
                                    };
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md text-card-foreground space-y-4"
                                    >
                                        <div className="space-y-3.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-body-sm font-bold text-foreground">
                                                        {item.nomor_tiket}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(item.nomor_tiket)}
                                                        title="Salin Nomor Tiket"
                                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                                    >
                                                        {copiedTicket === item.nomor_tiket ? (
                                                            <Check className="size-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption-xs font-semibold ${statusInfo.badgeClass}`}
                                                >
                                                    <StatusIcon className="size-3.5" />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <div className="flex gap-4">
                                                {item.foto_url ? (
                                                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                                        <img
                                                            src={item.foto_url}
                                                            alt={item.judul}
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground">
                                                        <ImageIcon className="size-7" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    {item.kategori_nama && (
                                                        <span className="rounded-md bg-muted px-2.5 py-0.5 text-caption-xs font-medium text-foreground">
                                                            {item.kategori_nama}
                                                        </span>
                                                    )}
                                                    <h3 className="font-display text-body-medium font-bold text-foreground line-clamp-1">
                                                        {item.judul}
                                                    </h3>
                                                    <p className="line-clamp-2 text-body-sm text-muted-foreground">
                                                        {item.keterangan}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 rounded-xl bg-muted/40 border border-border/60 p-3 text-body-sm text-muted-foreground">
                                                {item.wilayah_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="size-4 shrink-0 text-primary" />
                                                        <span className="truncate">
                                                            {item.wilayah_nama}
                                                            {item.kota_nama && `, ${item.kota_nama}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.instansi_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate font-medium text-foreground">
                                                            {item.instansi_nama}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-border pt-3 text-caption-xs text-muted-foreground">
                                            <span>Didukung {item.didukung_pada}</span>
                                            <div className="flex items-center gap-1.5 font-medium text-primary">
                                                <ThumbsUp className="size-3.5 text-primary" />
                                                <span>{item.jumlah_dukungan} dukungan warga</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

RiwayatLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Riwayat Laporan & Dukungan" breadcrumb="Warga > Riwayat">
        {page}
    </InternalLayout>
);

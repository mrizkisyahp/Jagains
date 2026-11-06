import { ReactNode, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import InstansiStatusBadge, {
    INSTANSI_STATUS,
} from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import {
    FileText,
    ThumbsUp,
    Plus,
    Search,
    RotateCcw,
    Filter,
    ChevronDown,
    Clock,
    Calendar,
    ArrowRight,
    ImageIcon,
    Building2,
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

const KEPARAHAN_CONFIG = {
    ringan: {
        label: 'Ringan',
        class: 'bg-muted text-muted-foreground border-border',
    },
    sedang: {
        label: 'Sedang',
        class: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800',
    },
    berat: {
        label: 'Berat',
        class: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800 font-semibold',
    },
};

function formatKelurahan(wilayah: string | null): string {
    if (!wilayah) return 'Depok';
    const first = wilayah.split(',')[0].trim();
    if (first.toLowerCase().startsWith('kelurahan ')) {
        return first.replace(/^kelurahan /i, 'Kel. ');
    }
    if (!first.toLowerCase().startsWith('kel.') && !first.toLowerCase().startsWith('kelurahan')) {
        return `Kel. ${first}`;
    }
    return first;
}

function formatShortInstansi(instansi: string | null): string {
    if (!instansi) return 'Dinas Terkait';
    const lower = instansi.toLowerCase();
    if (lower.includes('pekerjaan umum') || lower.includes('pupr')) return 'Dinas PUPR';
    if (lower.includes('perhubungan') || lower.includes('dishub')) return 'Dishub';
    if (lower.includes('lingkungan hidup') || lower.includes('dlhk')) return 'DLHK';
    if (lower.includes('satuan polisi') || lower.includes('satpol')) return 'Satpol PP';
    if (lower.includes('perumahan') || lower.includes('disperkim')) return 'Disperkim';
    if (lower.includes('sosial') || lower.includes('dinsos')) return 'Dinsos';
    if (lower.includes('kesehatan') || lower.includes('dinkes')) return 'Dinkes';
    if (lower.includes('komunikasi') || lower.includes('diskominfo')) return 'Diskominfo';
    return instansi.replace(/Kota Depok/gi, '').trim();
}

function formatRelativeSla(tahap: string | null, jatuhTempo: string | null): string | null {
    if (!jatuhTempo) return null;
    const stage = tahap ? tahap.charAt(0).toUpperCase() + tahap.slice(1).toLowerCase() : 'Respons';

    try {
        const cleanDateStr = jatuhTempo.replace(/, \d{2}:\d{2}/, '');
        const targetDate = new Date(cleanDateStr);
        if (isNaN(targetDate.getTime())) {
            return `${stage} ${jatuhTempo}`;
        }
        const now = new Date();
        const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Lewat SLA (${Math.abs(diffDays)} hari)`;
        } else if (diffDays === 0) {
            return `${stage} hari ini`;
        } else {
            return `${stage} dalam ${diffDays} hari`;
        }
    } catch {
        return `${stage} ${jatuhTempo}`;
    }
}

export default function RiwayatLaporanPage({
    laporanList = [],
    dukunganList = [],
}: RiwayatProps) {
    const [activeTab, setActiveTab] = useState<'laporan' | 'dukungan'>('laporan');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('semua');
    const [lokasiFilter, setLokasiFilter] = useState<string>('semua');
    const [kategoriFilter, setKategoriFilter] = useState<string>('semua');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Dukungan Action States
    const [submittingDukunganId, setSubmittingDukunganId] = useState<number | null>(null);
    const [localDukunganCounts, setLocalDukunganCounts] = useState<Record<number, number>>({});
    const [localSupportedIds, setLocalSupportedIds] = useState<Set<number>>(new Set());

    // Track which reports are supported by current user
    const initialSupportedIds = useMemo(() => {
        return new Set(dukunganList.map((d) => d.id));
    }, [dukunganList]);

    const isReportSupported = (id: number) => {
        return localSupportedIds.has(id) || initialSupportedIds.has(id);
    };

    const getDukunganCount = (id: number, fallback: number) => {
        return localDukunganCounts[id] ?? fallback;
    };

    const handleDukung = async (
        e: React.MouseEvent,
        laporanId: number,
        nomorTiket: string,
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (isReportSupported(laporanId)) {
            toast.info(
                'Sudah Didukung',
                `Anda sudah memberikan dukungan untuk laporan ${nomorTiket}.`,
            );
            return;
        }

        setSubmittingDukunganId(laporanId);
        try {
            const res = await fetch('/warga/lapor/dukung', {
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
                body: JSON.stringify({ laporan_id: laporanId }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                setLocalSupportedIds((prev) => new Set([...prev, laporanId]));
                setLocalDukunganCounts((prev) => ({
                    ...prev,
                    [laporanId]:
                        data.total_dukungan ?? ((prev[laporanId] ?? 0) + 1),
                }));
                toast.success('Dukungan Dicatat', data.pesan);
                router.reload({ only: ['laporanList', 'dukunganList'] });
            } else {
                toast.error(
                    'Gagal Memberikan Dukungan',
                    data.pesan || 'Laporan tidak dapat menerima dukungan lagi.',
                );
            }
        } catch {
            toast.error(
                'Gagal Menghubungi Server',
                'Periksa koneksi Anda dan coba lagi.',
            );
        } finally {
            setSubmittingDukunganId(null);
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchQuery(searchInput);
    };

    const handleResetFilter = () => {
        setSearchInput('');
        setSearchQuery('');
        setStatusFilter('semua');
        setLokasiFilter('semua');
        setKategoriFilter('semua');
    };

    const activeDropdownFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== 'semua') count++;
        if (lokasiFilter !== 'semua') count++;
        if (kategoriFilter !== 'semua') count++;
        return count;
    }, [statusFilter, lokasiFilter, kategoriFilter]);

    const isFilterActive =
        searchQuery.trim() !== '' ||
        activeDropdownFilterCount > 0;

    // Unique list of lokasi & kategori for filter selects
    const lokasiOptions = useMemo(() => {
        const set = new Set<string>();
        [...laporanList, ...dukunganList].forEach((item) => {
            if (item.wilayah_nama) set.add(item.wilayah_nama);
        });
        return Array.from(set).sort();
    }, [laporanList, dukunganList]);

    const kategoriOptions = useMemo(() => {
        const set = new Set<string>();
        [...laporanList, ...dukunganList].forEach((item) => {
            if (item.kategori_nama) set.add(item.kategori_nama);
        });
        return Array.from(set).sort();
    }, [laporanList, dukunganList]);

    const filteredLaporan = useMemo(() => {
        return laporanList.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTicket = item.nomor_tiket.toLowerCase().includes(q);
                const matchJudul = item.judul.toLowerCase().includes(q);
                const matchKategori = item.kategori_nama?.toLowerCase().includes(q);
                const matchWilayah = item.wilayah_nama?.toLowerCase().includes(q);
                if (!matchTicket && !matchJudul && !matchKategori && !matchWilayah) {
                    return false;
                }
            }
            if (statusFilter !== 'semua' && item.status !== statusFilter) {
                return false;
            }
            if (lokasiFilter !== 'semua' && item.wilayah_nama !== lokasiFilter) {
                return false;
            }
            if (kategoriFilter !== 'semua' && item.kategori_nama !== kategoriFilter) {
                return false;
            }
            return true;
        });
    }, [laporanList, searchQuery, statusFilter, lokasiFilter, kategoriFilter]);

    const filteredDukungan = useMemo(() => {
        return dukunganList.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTicket = item.nomor_tiket.toLowerCase().includes(q);
                const matchJudul = item.judul.toLowerCase().includes(q);
                const matchKategori = item.kategori_nama?.toLowerCase().includes(q);
                const matchWilayah = item.wilayah_nama?.toLowerCase().includes(q);
                if (!matchTicket && !matchJudul && !matchKategori && !matchWilayah) {
                    return false;
                }
            }
            if (statusFilter !== 'semua' && item.status !== statusFilter) {
                return false;
            }
            if (lokasiFilter !== 'semua' && item.wilayah_nama !== lokasiFilter) {
                return false;
            }
            if (kategoriFilter !== 'semua' && item.kategori_nama !== kategoriFilter) {
                return false;
            }
            return true;
        });
    }, [dukunganList, searchQuery, statusFilter, lokasiFilter, kategoriFilter]);

    return (
        <div className="relative mx-auto w-full max-w-7xl space-y-6 pb-28">
            <Head title="Riwayat Laporan - Jagains" />

            {/* Header Halaman */}
            <div>
                <h1 className="font-display text-display-xs font-semibold tracking-tight text-foreground sm:text-display-sm">
                    Riwayat Laporan & Dukungan
                </h1>
                <p className="text-body-sm text-muted-foreground">
                    Pantau status pengerjaan fasilitas publik yang Anda laporkan dan dukung secara transparan.
                </p>
            </div>

            {/* Tab Navigasi Standar */}
            <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as 'laporan' | 'dukungan')}
                className="space-y-4"
            >
                <div className="overflow-x-auto pb-1">
                    <TabsList className="inline-flex h-9 w-max min-w-full justify-start bg-muted/50 p-1">
                        <TabsTrigger
                            value="laporan"
                            className="shrink-0 gap-2 text-body-sm"
                        >
                            <FileText className="size-4" />
                            <span>Aduan Saya</span>
                            <span className="rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-caption-xs font-semibold">
                                {laporanList.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="dukungan"
                            className="shrink-0 gap-2 text-body-sm"
                        >
                            <ThumbsUp className="size-4" />
                            <span>Aduan Didukung</span>
                            <span className="rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-caption-xs font-semibold">
                                {dukunganList.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Toolbar Pencarian & Filter */}
                <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Form */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex min-w-0 flex-1 basis-72 items-center gap-2"
                        >
                            <div className="relative min-w-0 flex-1">
                                <Input
                                    type="search"
                                    placeholder="Cari nomor atau judul tiket…"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="h-9 pl-9 text-body-sm shadow-none"
                                />
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-9 shadow-none text-caption-xs font-semibold cursor-pointer"
                            >
                                Cari
                            </Button>
                        </form>

                        {/* Tombol Filter Tunggal dengan Icon Filter */}
                        <Button
                            type="button"
                            variant={isFilterOpen || activeDropdownFilterCount > 0 ? 'secondary' : 'outline'}
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            className={cn(
                                'h-9 gap-1.5 shadow-none text-caption-xs font-semibold cursor-pointer transition-colors',
                                (isFilterOpen || activeDropdownFilterCount > 0) &&
                                    'border-border bg-muted text-foreground',
                            )}
                            aria-expanded={isFilterOpen}
                            aria-label="Filter Laporan"
                        >
                            <Filter className="size-3.5 text-muted-foreground" />
                            <span>Filter</span>
                            {activeDropdownFilterCount > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {activeDropdownFilterCount}
                                </span>
                            )}
                            <ChevronDown
                                className={cn(
                                    'size-3.5 text-muted-foreground transition-transform duration-200',
                                    isFilterOpen && 'rotate-180 text-foreground',
                                )}
                            />
                        </Button>

                        {/* Reset Filter Button jika ada filter aktif */}
                        {isFilterActive && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResetFilter}
                                className="h-9 gap-1 text-muted-foreground hover:text-foreground text-caption-xs cursor-pointer"
                            >
                                <RotateCcw className="size-3.5" />
                                Reset filter
                            </Button>
                        )}
                    </div>

                    {/* Panel Filter (Muncul Setelah Tombol Filter Diklik) */}
                    {isFilterOpen && (
                        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-xs animate-in fade-in-50 slide-in-from-top-1 duration-150">
                            <div className="flex items-center gap-1.5 text-caption-xs font-semibold text-muted-foreground mr-1">
                                <Filter className="size-3.5 text-primary" />
                                <span>Filter:</span>
                            </div>

                            {/* Status Select */}
                            <div className="w-full sm:w-48">
                                <Select
                                    value={statusFilter}
                                    onValueChange={(val) => setStatusFilter(val ?? 'semua')}
                                >
                                    <SelectTrigger className="h-9 w-full text-body-sm shadow-none">
                                        <SelectValue placeholder="Semua status">
                                            {statusFilter === 'semua'
                                                ? 'Semua status'
                                                : (INSTANSI_STATUS[statusFilter]?.label ?? statusFilter)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semua">Semua status</SelectItem>
                                        {Object.entries(INSTANSI_STATUS).map(([key, val]) => (
                                            <SelectItem key={key} value={key}>
                                                {val.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Lokasi Select */}
                            <div className="w-full sm:w-44">
                                <Select
                                    value={lokasiFilter}
                                    onValueChange={(val) => setLokasiFilter(val ?? 'semua')}
                                >
                                    <SelectTrigger className="h-9 w-full text-body-sm shadow-none">
                                        <SelectValue placeholder="Semua lokasi">
                                            {lokasiFilter === 'semua' ? 'Semua lokasi' : lokasiFilter}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semua">Semua lokasi</SelectItem>
                                        {lokasiOptions.map((loc) => (
                                            <SelectItem key={loc} value={loc}>
                                                {loc}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Kategori Select */}
                            <div className="w-full sm:w-44">
                                <Select
                                    value={kategoriFilter}
                                    onValueChange={(val) => setKategoriFilter(val ?? 'semua')}
                                >
                                    <SelectTrigger className="h-9 w-full text-body-sm shadow-none">
                                        <SelectValue placeholder="Semua kategori">
                                            {kategoriFilter === 'semua' ? 'Semua kategori' : kategoriFilter}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semua">Semua kategori</SelectItem>
                                        {kategoriOptions.map((kat) => (
                                            <SelectItem key={kat} value={kat}>
                                                {kat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reset Pilihan Dropdown */}
                            {activeDropdownFilterCount > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setStatusFilter('semua');
                                        setLokasiFilter('semua');
                                        setKategoriFilter('semua');
                                    }}
                                    className="h-9 gap-1 text-muted-foreground hover:text-foreground text-caption-xs cursor-pointer sm:ml-auto"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Reset pilihan
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tab 1: Aduan Saya */}
                <TabsContent value="laporan" className="space-y-4 pt-2">
                    {filteredLaporan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <FileText className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-display text-body-medium font-semibold text-foreground">
                                    {isFilterActive
                                        ? 'Tidak ada laporan yang sesuai kriteria filter'
                                        : 'Belum Ada Laporan yang Diajukan'}
                                </h3>
                                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                    {isFilterActive
                                        ? 'Coba sesuaikan kata kunci pencarian atau reset filter aktif.'
                                        : 'Anda belum mengirimkan laporan fasilitas publik. Buat laporan kerusakan jalan, lampu penerangan, atau saluran air di sekitar Anda.'}
                                </p>
                            </div>
                            {isFilterActive ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="rounded-lg border-border text-caption-xs font-semibold"
                                >
                                    Reset Semua Filter
                                </Button>
                            ) : (
                                <Link
                                    href="/warga/lapor"
                                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-caption-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                                >
                                    <Plus className="size-4" />
                                    Buat Laporan Sekarang
                                </Link>
                            )}
                        </div>
                    ) : (
                        /* Card Grid Bergaya Modern (Airbnb/Card Style) */
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredLaporan.map((laporan) => {
                                const isSupported = isReportSupported(laporan.id);
                                const currentCount = getDukunganCount(
                                    laporan.id,
                                    laporan.jumlah_dukungan,
                                );
                                const slaText = formatRelativeSla(
                                    laporan.sla_tahap,
                                    laporan.sla_jatuh_tempo,
                                );

                                return (
                                    <div
                                        key={laporan.id}
                                        className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-none transition-all hover:border-foreground/20 hover:shadow-xs"
                                    >
                                        <div className="flex flex-col space-y-3">
                                            {/* Foto Laporan dengan Pill Kategori di kiri atas & Tombol Dukungan di kanan atas */}
                                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/40 bg-muted">
                                                {laporan.foto_url ? (
                                                    <img
                                                        src={laporan.foto_url}
                                                        alt={laporan.judul}
                                                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                            const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                                            if (fallback) fallback.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}

                                                {/* Fallback jika tidak ada foto */}
                                                <div
                                                    className={cn(
                                                        'size-full flex-col items-center justify-center gap-1.5 bg-muted/60 text-muted-foreground',
                                                        laporan.foto_url ? 'hidden' : 'flex',
                                                    )}
                                                >
                                                    <ImageIcon className="size-8 stroke-[1.5] text-muted-foreground/40" />
                                                    <span className="text-[11px] font-medium text-muted-foreground/60">
                                                        Foto tidak tersedia
                                                    </span>
                                                </div>

                                                {/* Badge Kategori Melayang di Kiri Atas */}
                                                <div className="absolute top-2.5 left-2.5 z-10">
                                                    <span className="inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs backdrop-blur-xs">
                                                        {laporan.kategori_nama || 'Fasilitas Umum'}
                                                    </span>
                                                </div>

                                                {/* Tombol Aksi Like / Dukungan Melayang di Kanan Atas */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDukung(
                                                            e,
                                                            laporan.id,
                                                            laporan.nomor_tiket,
                                                        );
                                                    }}
                                                    disabled={
                                                        submittingDukunganId ===
                                                        laporan.id
                                                    }
                                                    className={cn(
                                                        'absolute top-2.5 right-2.5 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow-xs backdrop-blur-xs transition-transform hover:scale-110 active:scale-95',
                                                        isSupported
                                                            ? 'text-primary ring-1 ring-primary/30'
                                                            : 'text-muted-foreground hover:text-foreground',
                                                    )}
                                                    title={
                                                        isSupported
                                                            ? 'Sudah Anda dukung'
                                                            : 'Dukung laporan ini'
                                                    }
                                                    aria-label={
                                                        isSupported
                                                            ? 'Sudah Anda dukung'
                                                            : 'Dukung laporan ini'
                                                    }
                                                >
                                                    <ThumbsUp
                                                        className={cn(
                                                            'size-4 shrink-0 transition-transform',
                                                            isSupported
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground',
                                                            submittingDukunganId ===
                                                                laporan.id &&
                                                                'animate-pulse',
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            {/* Info Judul & Status */}
                                            <div className="space-y-1 px-0.5 pt-0.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block font-mono text-[11px] text-muted-foreground">
                                                            #{laporan.nomor_tiket}
                                                        </span>
                                                        <Link
                                                            href={`/tiket/${laporan.nomor_tiket}`}
                                                            className="block"
                                                        >
                                                            <h3 className="font-display text-body-sm sm:text-body-md font-semibold leading-snug text-foreground line-clamp-1 transition-colors group-hover:text-primary">
                                                                {laporan.judul}
                                                            </h3>
                                                        </Link>
                                                    </div>
                                                    <div className="shrink-0 pt-0.5">
                                                        <InstansiStatusBadge status={laporan.status} />
                                                    </div>
                                                </div>

                                                {/* Subtitle: Lokasi & Instansi */}
                                                <p className="truncate text-caption-xs text-muted-foreground">
                                                    {formatKelurahan(laporan.wilayah_nama)} · {formatShortInstansi(laporan.instansi_nama)}
                                                </p>
                                            </div>

                                            {/* Feature Divider Row (Waktu | Batas SLA | Dukungan) */}
                                            <div className="grid grid-cols-3 divide-x divide-border border-y border-border/70 py-2.5 text-center text-caption-xs text-muted-foreground">
                                                <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                    <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                    <span className="truncate">{laporan.dibuat_pada}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                    <Clock className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                    <span className="truncate font-medium text-foreground">{slaText || 'Dalam SLA'}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                    <ThumbsUp className={cn('size-3.5 shrink-0', isSupported ? 'text-primary' : 'text-muted-foreground/70')} />
                                                    <span className="truncate font-medium text-foreground">{currentCount} Dukungan</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tombol Rounded Full untuk See Detail di Paling Bawah */}
                                        <div className="pt-3 px-0.5">
                                            <Link
                                                href={`/tiket/${laporan.nomor_tiket}`}
                                                className={cn(
                                                    buttonVariants({ variant: 'outline', size: 'default' }),
                                                    'w-full rounded-full border-border bg-background text-caption-xs sm:text-body-sm font-semibold text-foreground shadow-none hover:bg-muted hover:text-foreground',
                                                )}
                                            >
                                                <span>Lihat Detail</span>
                                                <ArrowRight className="size-3.5 ml-1.5" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: Aduan Didukung */}
                <TabsContent value="dukungan" className="space-y-4 pt-2">
                    {filteredDukungan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <ThumbsUp className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-display text-body-medium font-semibold text-foreground">
                                    {isFilterActive
                                        ? 'Tidak ada dukungan yang sesuai kriteria filter'
                                        : 'Belum Ada Aduan yang Anda Dukung'}
                                </h3>
                                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                    {isFilterActive
                                        ? 'Coba sesuaikan kata kunci pencarian atau reset filter aktif.'
                                        : 'Saat Anda melihat kerusakan di fasilitas sekitar yang dilaporkan warga lain, Anda dapat memberikan dukungan untuk mempercepat prioritas penanganan dinas.'}
                                </p>
                            </div>
                            {isFilterActive && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="rounded-lg border-border text-caption-xs font-semibold"
                                >
                                    Reset Semua Filter
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredDukungan.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-none transition-all hover:border-foreground/20 hover:shadow-xs"
                                >
                                    <div className="flex flex-col space-y-3">
                                        {/* Foto Laporan dengan Pill Kategori di kiri atas & Status Didukung di kanan atas */}
                                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/40 bg-muted">
                                            {item.foto_url ? (
                                                <img
                                                    src={item.foto_url}
                                                    alt={item.judul}
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}

                                            {/* Fallback jika tidak ada foto */}
                                            <div
                                                className={cn(
                                                    'size-full flex-col items-center justify-center gap-1.5 bg-muted/60 text-muted-foreground',
                                                    item.foto_url ? 'hidden' : 'flex',
                                                )}
                                            >
                                                <ImageIcon className="size-8 stroke-[1.5] text-muted-foreground/40" />
                                                <span className="text-[11px] font-medium text-muted-foreground/60">
                                                    Foto tidak tersedia
                                                </span>
                                            </div>

                                            {/* Badge Kategori Melayang di Kiri Atas */}
                                            <div className="absolute top-2.5 left-2.5 z-10">
                                                <span className="inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs backdrop-blur-xs">
                                                    {item.kategori_nama || 'Fasilitas Umum'}
                                                </span>
                                            </div>

                                            {/* Badge Dukungan Aktif di Kanan Atas */}
                                            <div className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-xs backdrop-blur-xs ring-1 ring-primary/30">
                                                <ThumbsUp className="size-4 shrink-0 text-primary" />
                                            </div>
                                        </div>

                                        {/* Info Judul & Status */}
                                        <div className="space-y-1 px-0.5 pt-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <span className="block font-mono text-[11px] text-muted-foreground">
                                                        #{item.nomor_tiket}
                                                    </span>
                                                    <Link
                                                        href={`/tiket/${item.nomor_tiket}`}
                                                        className="block"
                                                    >
                                                        <h3 className="font-display text-body-sm sm:text-body-md font-semibold leading-snug text-foreground line-clamp-1 transition-colors group-hover:text-primary">
                                                            {item.judul}
                                                        </h3>
                                                    </Link>
                                                </div>
                                                <div className="shrink-0 pt-0.5">
                                                    <InstansiStatusBadge status={item.status} />
                                                </div>
                                            </div>

                                            {/* Subtitle: Lokasi & Instansi */}
                                            <p className="truncate text-caption-xs text-muted-foreground">
                                                {formatKelurahan(item.wilayah_nama)} · {formatShortInstansi(item.instansi_nama)}
                                            </p>
                                        </div>

                                        {/* Feature Divider Row */}
                                        <div className="grid grid-cols-3 divide-x divide-border border-y border-border/70 py-2.5 text-center text-caption-xs text-muted-foreground">
                                            <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                <span className="truncate">{item.didukung_pada}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                <span className="truncate font-medium text-foreground">{formatShortInstansi(item.instansi_nama)}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 px-1 truncate">
                                                <ThumbsUp className="size-3.5 shrink-0 text-primary" />
                                                <span className="truncate font-medium text-foreground">{item.jumlah_dukungan} Dukungan</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tombol Rounded Full untuk See Detail di Paling Bawah */}
                                    <div className="pt-3 px-0.5">
                                        <Link
                                            href={`/tiket/${item.nomor_tiket}`}
                                            className={cn(
                                                buttonVariants({ variant: 'outline', size: 'default' }),
                                                'w-full rounded-full border-border bg-background text-caption-xs sm:text-body-sm font-semibold text-foreground shadow-none hover:bg-muted hover:text-foreground',
                                            )}
                                        >
                                            <span>Lihat Detail</span>
                                            <ArrowRight className="size-3.5 ml-1.5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Floating Action Button "Tambah Laporan" */}
            <Link
                href="/warga/lapor"
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-caption-xs font-semibold text-background shadow-lg transition-all hover:scale-105 hover:bg-foreground/90 active:scale-95 sm:text-body-sm"
                aria-label="Buat Laporan Baru"
            >
                <Plus className="size-4" />
                <span>Tambah Laporan</span>
            </Link>
        </div>
    );
}

RiwayatLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Riwayat Laporan" breadcrumb="Warga > Riwayat Laporan">
        {page}
    </InternalLayout>
);

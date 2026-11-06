import { useState } from 'react';
import { TitikLaporanPeta, MasterFilterPeta, PetaFilterState, KondisiSla } from '@/types/peta';
import {
    Search,
    MapPin,
    Building2,
    ThumbsUp,
    Copy,
    Check,
    X,
    RotateCcw,
    Inbox,
    Filter,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface PetaDrawerListProps {
    titikList: TitikLaporanPeta[];
    selectedTiket: TitikLaporanPeta | null;
    onSelectTiket: (tiket: TitikLaporanPeta) => void;
    onClose: () => void;
    onToggle?: () => void;
    isOpen: boolean;
    filters?: PetaFilterState;
    onFilterChange?: (newFilters: PetaFilterState) => void;
    masterFilter?: MasterFilterPeta;
    onResetFilter?: () => void;
}

const DEFAULT_FILTERS: PetaFilterState = {
    kategori_id: null,
    kecamatan_id: null,
    kondisi_sla: null,
    instansi_id: null,
    rentang_waktu: null,
    search: '',
};

const DEFAULT_MASTER_FILTER: MasterFilterPeta = {
    kategori: [],
    kecamatan: [],
    instansi: [],
    statistik: {
        total_laporan: 0,
        laporan_aktif: 0,
        laporan_selesai: 0,
    },
};

const KONDISI_SLA_OPTIONS: Array<{ value: KondisiSla | 'semua'; label: string }> = [
    { value: 'semua', label: 'Semua Status' },
    { value: 'dalam_sla', label: 'Dalam SLA' },
    { value: 'hampir_lewat', label: 'Hampir Lewat' },
    { value: 'lewat_sla', label: 'Lewat SLA' },
    { value: 'menunggu_warga', label: 'Menunggu Warga' },
    { value: 'selesai', label: 'Selesai' },
];

function getStatusBadgeStyle(kondisi: KondisiSla): string {
    switch (kondisi) {
        case 'dalam_sla':
            return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
        case 'hampir_lewat':
            return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
        case 'lewat_sla':
            return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-semibold';
        case 'menunggu_warga':
            return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
        case 'selesai':
            return 'border-border bg-muted text-muted-foreground';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

export default function PetaDrawerList({
    titikList,
    selectedTiket,
    onSelectTiket,
    onClose,
    onToggle,
    isOpen,
    filters = DEFAULT_FILTERS,
    onFilterChange,
    masterFilter = DEFAULT_MASTER_FILTER,
    onResetFilter,
}: PetaDrawerListProps) {
    const [searchInput, setSearchInput] = useState(filters.search);
    const [copiedTicket, setCopiedTicket] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const activeDropdownFilterCount =
        (filters.kondisi_sla !== null ? 1 : 0) +
        (filters.kecamatan_id !== null ? 1 : 0) +
        (filters.kategori_id !== null ? 1 : 0);

    const isFilterActive =
        activeDropdownFilterCount > 0 ||
        filters.search.trim() !== '';

    const handleCopy = (ticket: string) => {
        navigator.clipboard.writeText(ticket);
        setCopiedTicket(ticket);
        toast.success(`Nomor tiket ${ticket} disalin ke clipboard`);
        setTimeout(() => setCopiedTicket(null), 2000);
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onFilterChange?.({ ...filters, search: searchInput });
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-background/60 backdrop-blur-xs sm:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sliding Drawer Container */}
            <aside
                className={cn(
                    'absolute inset-y-0 left-0 z-30 flex w-full flex-col border-r border-border bg-card/98 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out sm:w-[440px] lg:w-[480px]',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Floating Drawer Toggle Handle */}
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={isOpen ? 'Tutup daftar laporan' : 'Buka daftar laporan'}
                    title={isOpen ? 'Tutup daftar laporan' : 'Buka daftar laporan'}
                    className="absolute -right-11 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-none border-y border-r border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Search className="size-5" />
                </button>

                {/* Top Section: Search Bar & Filters */}
                <div className="space-y-3 border-b border-border p-4">
                    {/* Search Form */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex items-center gap-2"
                    >
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Jalan berlubang..."
                                className="h-10 rounded-xl bg-background pl-9 pr-3 text-body-sm"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-10 shrink-0 rounded-xl px-4 text-caption-xs font-semibold"
                        >
                            Cari Laporan
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="size-10 rounded-xl sm:hidden"
                            aria-label="Tutup"
                        >
                            <X className="size-4" />
                        </Button>
                    </form>

                    {/* Filter Toggle Button Row */}
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant={isFilterOpen || activeDropdownFilterCount > 0 ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            className={cn(
                                'h-8 gap-1.5 rounded-lg text-caption-xs font-semibold shadow-none cursor-pointer transition-colors',
                                (isFilterOpen || activeDropdownFilterCount > 0) &&
                                    'border-border bg-muted text-foreground',
                            )}
                            aria-expanded={isFilterOpen}
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
                                    'size-3 text-muted-foreground transition-transform duration-200',
                                    isFilterOpen && 'rotate-180 text-foreground',
                                )}
                            />
                        </Button>

                        {/* Reset Filter Button */}
                        {isFilterActive && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchInput('');
                                    onResetFilter?.();
                                }}
                                className="h-8 gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Reset Filter"
                            >
                                <RotateCcw className="size-3" />
                                Reset
                            </Button>
                        )}
                    </div>

                    {/* Filter Dropdowns (Muncul Setelah Tombol Filter Diklik) */}
                    {isFilterOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 animate-in fade-in-50 duration-150">
                            {/* Status Select */}
                            <div className="w-full">
                                <Select
                                    value={filters.kondisi_sla ?? 'semua'}
                                    onValueChange={(val) => {
                                        onFilterChange?.({
                                            ...filters,
                                            kondisi_sla:
                                                val && val !== 'semua'
                                                    ? (val as KondisiSla)
                                                    : null,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-full rounded-lg border-border bg-background px-2.5 text-[11px] font-medium shadow-none">
                                        <SelectValue placeholder="Semua status">
                                            {KONDISI_SLA_OPTIONS.find(
                                                (opt) =>
                                                    opt.value ===
                                                    (filters.kondisi_sla ?? 'semua'),
                                            )?.label ?? 'Semua status'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {KONDISI_SLA_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-caption-xs"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Kecamatan (Lokasi) Select */}
                            <div className="w-full">
                                <Select
                                    value={
                                        filters.kecamatan_id
                                            ? String(filters.kecamatan_id)
                                            : 'semua'
                                    }
                                    onValueChange={(val) => {
                                        onFilterChange?.({
                                            ...filters,
                                            kecamatan_id:
                                                val && val !== 'semua'
                                                    ? Number(val)
                                                    : null,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-full rounded-lg border-border bg-background px-2.5 text-[11px] font-medium shadow-none">
                                        <SelectValue placeholder="Semua lokasi">
                                            {filters.kecamatan_id
                                                ? (masterFilter?.kecamatan?.find(
                                                      (kec) =>
                                                          kec.id ===
                                                          filters.kecamatan_id,
                                                  )?.nama ?? 'Lokasi')
                                                : 'Semua lokasi'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="semua"
                                            className="text-caption-xs"
                                        >
                                            Semua Lokasi
                                        </SelectItem>
                                        {masterFilter?.kecamatan?.map((kec) => (
                                            <SelectItem
                                                key={kec.id}
                                                value={String(kec.id)}
                                                className="text-caption-xs"
                                            >
                                                {kec.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Kategori Select */}
                            <div className="w-full">
                                <Select
                                    value={
                                        filters.kategori_id
                                            ? String(filters.kategori_id)
                                            : 'semua'
                                    }
                                    onValueChange={(val) => {
                                        onFilterChange?.({
                                            ...filters,
                                            kategori_id:
                                                val && val !== 'semua'
                                                    ? Number(val)
                                                    : null,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-full rounded-lg border-border bg-background px-2.5 text-[11px] font-medium shadow-none">
                                        <SelectValue placeholder="Semua kategori">
                                            {filters.kategori_id
                                                ? (masterFilter?.kategori?.find(
                                                      (kat) =>
                                                          kat.id ===
                                                          filters.kategori_id,
                                                  )?.nama ?? 'Kategori')
                                                : 'Semua kategori'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="semua"
                                            className="text-caption-xs"
                                        >
                                            Semua Kategori
                                        </SelectItem>
                                        {masterFilter?.kategori?.map((kat) => (
                                            <SelectItem
                                                key={kat.id}
                                                value={String(kat.id)}
                                                className="text-caption-xs"
                                            >
                                                {kat.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Counter Bar */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                    <span>{titikList.length} Laporan Ditemukan</span>
                    {selectedTiket && (
                        <span className="font-medium text-foreground">
                            1 Laporan Terpilih
                        </span>
                    )}
                </div>

                {/* Cards List Container */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {titikList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 px-4 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <Inbox className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-display text-body-medium font-bold text-foreground">
                                    Tidak Ada Laporan
                                </p>
                                <p className="max-w-[240px] text-body-sm text-muted-foreground">
                                    Tidak ada laporan yang sesuai dengan kata
                                    kunci atau filter yang dipilih.
                                </p>
                            </div>
                            {isFilterActive && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchInput('');
                                        onResetFilter?.();
                                    }}
                                    className="rounded-xl border-border text-caption-xs font-semibold"
                                >
                                    Reset Semua Filter
                                </Button>
                            )}
                        </div>
                    ) : (
                        titikList.map((item) => {
                            const isSelected = selectedTiket?.id === item.id;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onSelectTiket(item)}
                                    className={cn(
                                        'group cursor-pointer space-y-2.5 rounded-xl border bg-card p-3.5 transition-all',
                                        isSelected
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                                            : 'border-border/80 hover:border-primary/50 hover:bg-muted/40 shadow-none',
                                    )}
                                >
                                    {/* Card Header: Ticket Number & Copy Icon */}
                                    <div className="flex items-center justify-between text-caption-xs">
                                        <span className="font-mono font-bold text-foreground">
                                            {item.nomor_tiket}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(item.nomor_tiket);
                                            }}
                                            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            title="Salin Nomor Tiket"
                                        >
                                            {copiedTicket === item.nomor_tiket ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-border/60" />

                                    {/* Card Body: Thumbnail on left, Details on right */}
                                    <div className="flex gap-3">
                                        {/* Thumbnail */}
                                        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted sm:size-28">
                                            {item.foto_url ? (
                                                <img
                                                    src={item.foto_url}
                                                    alt={item.judul}
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-caption-xs font-medium text-muted-foreground">
                                                    Thumbnail
                                                </span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            {/* Status Badge */}
                                            <div>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                                        getStatusBadgeStyle(
                                                            item.kondisi_sla,
                                                        ),
                                                    )}
                                                >
                                                    {item.label_sla ||
                                                        'Menunggu Tindak Lanjut'}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h4 className="font-display text-body-sm font-bold leading-snug text-foreground line-clamp-2">
                                                {item.judul}
                                            </h4>

                                            {/* Location */}
                                            <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                                                <MapPin className="mt-0.5 size-3 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {item.kelurahan_nama
                                                        ? `Kel. ${item.kelurahan_nama}, Kec. ${item.kecamatan_nama}, Kota Depok`
                                                        : item.kecamatan_nama}
                                                </span>
                                            </div>

                                            {/* Department */}
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Building2 className="size-3 shrink-0 text-muted-foreground" />
                                                <span className="truncate">
                                                    {item.instansi_nama ||
                                                        'Instansi Terkait'}
                                                </span>
                                            </div>

                                            {/* SLA & Support Footer */}
                                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {item.sisa_hari_sla !== null
                                                        ? `Sisa ${item.sisa_hari_sla} hari kerja`
                                                        : item.sisa_sla_teks ||
                                                          'Dalam penanganan'}
                                                </span>
                                                <div className="flex items-center gap-1 font-medium text-foreground">
                                                    <ThumbsUp className="size-3 text-primary" />
                                                    <span>
                                                        {item.jumlah_dukungan}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>
        </>
    );
}

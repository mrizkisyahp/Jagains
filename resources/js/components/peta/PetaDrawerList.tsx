import { useState, useMemo } from 'react';
import {
    TitikLaporanPeta,
    MasterFilterPeta,
    PetaFilterState,
    KondisiSla,
} from '@/types/peta';
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
    Activity,
    Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchableFilterDropdown, {
    DropdownFilterOption,
} from '@/components/peta/SearchableFilterDropdown';
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
    kota_id: null,
    status: null,
    kondisi_sla: null,
    instansi_id: null,
    rentang_waktu: null,
    search: '',
};

const DEFAULT_MASTER_FILTER: MasterFilterPeta = {
    kategori: [],
    kecamatan: [],
    kota: [],
    status: [],
    instansi: [],
    statistik: {
        total_laporan: 0,
        laporan_aktif: 0,
        laporan_selesai: 0,
    },
};

const STATUS_OPTIONS: Array<{ value: string; label: string; grup: string }> = [
    // Tahap Penanganan
    {
        value: 'PERLU_ROUTING',
        label: 'Perlu Routing',
        grup: 'Tahap Penanganan',
    },
    {
        value: 'DITERUSKAN',
        label: 'Diteruskan ke Dinas',
        grup: 'Tahap Penanganan',
    },
    { value: 'DITERIMA', label: 'Diterima Dinas', grup: 'Tahap Penanganan' },
    { value: 'DISURVEI', label: 'Selesai Survei', grup: 'Tahap Penanganan' },
    {
        value: 'TERJADWAL_ANGGARAN',
        label: 'Terjadwal Anggaran',
        grup: 'Tahap Penanganan',
    },
    {
        value: 'DIKERJAKAN',
        label: 'Sedang Dikerjakan',
        grup: 'Tahap Penanganan',
    },
    // Verifikasi & Arbitrase
    {
        value: 'MENUNGGU_VERIFIKASI',
        label: 'Menunggu Verifikasi Warga',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'DISENGKETAKAN',
        label: 'Disengketakan',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'MENUNGGU_KEPUTUSAN_AUDITOR',
        label: 'Menunggu Keputusan Auditor',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'USULAN_TOLAK',
        label: 'Usulan Penolakan',
        grup: 'Verifikasi & Sengketa',
    },
    // Selesai & Tutup
    {
        value: 'TERTUTUP_WARGA',
        label: 'Ditutup Warga',
        grup: 'Selesai & Tutup',
    },
    {
        value: 'TERTUTUP_AUDITOR',
        label: 'Ditutup Auditor',
        grup: 'Selesai & Tutup',
    },
    { value: 'DITOLAK', label: 'Ditolak', grup: 'Selesai & Tutup' },
];

const KONDISI_SLA_OPTIONS: Array<{ value: KondisiSla; label: string }> = [
    { value: 'dalam_sla', label: 'Dalam SLA (Aman)' },
    { value: 'hampir_lewat', label: 'Hampir Lewat (Kritis)' },
    { value: 'lewat_sla', label: 'Lewat Batas SLA (Terlambat)' },
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
        (filters.status !== null ? 1 : 0) +
        (filters.kondisi_sla !== null ? 1 : 0) +
        (filters.kecamatan_id !== null || (filters.kota_id ?? null) !== null
            ? 1
            : 0) +
        (filters.kategori_id !== null ? 1 : 0);

    const isFilterActive =
        activeDropdownFilterCount > 0 || filters.search.trim() !== '';

    // Label untuk badge filter aktif
    const activeStatusLabel = useMemo(() => {
        if (filters.status) {
            return (
                masterFilter?.status?.find((s) => s.value === filters.status)
                    ?.label ??
                STATUS_OPTIONS.find((s) => s.value === filters.status)?.label ??
                filters.status
            );
        }
        if (filters.kondisi_sla) {
            return (
                KONDISI_SLA_OPTIONS.find((s) => s.value === filters.kondisi_sla)
                    ?.label ?? filters.kondisi_sla
            );
        }
        return null;
    }, [filters.status, filters.kondisi_sla, masterFilter?.status]);

    const activeLocationLabel = useMemo(() => {
        if (filters.kecamatan_id) {
            const kec = masterFilter?.kecamatan?.find(
                (k) => k.id === filters.kecamatan_id,
            );
            return kec ? `Kec. ${kec.nama}` : 'Kecamatan';
        }
        if (filters.kota_id) {
            const kota = masterFilter?.kota?.find(
                (k) => k.id === filters.kota_id,
            );
            return kota ? kota.nama : 'Kota / Kabupaten';
        }
        return null;
    }, [
        filters.kecamatan_id,
        filters.kota_id,
        masterFilter?.kecamatan,
        masterFilter?.kota,
    ]);

    const activeKategoriLabel = useMemo(() => {
        if (filters.kategori_id) {
            return (
                masterFilter?.kategori?.find(
                    (k) => k.id === filters.kategori_id,
                )?.nama ?? 'Kategori'
            );
        }
        return null;
    }, [filters.kategori_id, masterFilter?.kategori]);

    // Opsi Status untuk Searchable Dropdown (Fase Siklus Hidup & Batas Waktu SLA)
    const statusDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Status' },
        ];

        for (const s of STATUS_OPTIONS) {
            opts.push({
                value: s.value,
                label: s.label,
                group: s.grup,
            });
        }

        for (const sla of KONDISI_SLA_OPTIONS) {
            opts.push({
                value: `sla:${sla.value}`,
                label: sla.label,
                group: 'Batas Waktu SLA',
            });
        }

        return opts;
    }, []);

    // Opsi Wilayah / Lokasi untuk Searchable Dropdown (Grouped by Kota/Kabupaten & Kecamatan)
    const locationDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Lokasi' },
        ];

        const kotaList = masterFilter?.kota ?? [];
        const kecList = masterFilter?.kecamatan ?? [];

        for (const kota of kotaList) {
            opts.push({
                value: `kota:${kota.id}`,
                label: kota.nama,
                group: kota.nama,
                sublabel: `Seluruh ${kota.nama}`,
                count: kota.total_laporan,
            });

            const kAnak = kecList.filter((k) => k.induk_id === kota.id);
            for (const kec of kAnak) {
                opts.push({
                    value: `kec:${kec.id}`,
                    label: `Kec. ${kec.nama}`,
                    group: kota.nama,
                    sublabel: kota.nama,
                    count: kec.total_laporan,
                });
            }
        }

        const orphanKec = kecList.filter(
            (k) =>
                !k.induk_id || !kotaList.some((kota) => kota.id === k.induk_id),
        );
        for (const kec of orphanKec) {
            opts.push({
                value: `kec:${kec.id}`,
                label: `Kec. ${kec.nama}`,
                group: kec.kota_nama || 'Wilayah Lainnya',
                count: kec.total_laporan,
            });
        }

        return opts;
    }, [masterFilter?.kota, masterFilter?.kecamatan]);

    // Opsi Kategori Kerusakan untuk Searchable Dropdown
    const kategoriDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Kategori' },
        ];

        for (const kat of masterFilter?.kategori ?? []) {
            opts.push({
                value: String(kat.id),
                label: kat.nama,
                count: kat.total_laporan,
            });
        }

        return opts;
    }, [masterFilter?.kategori]);

    const currentStatusValue = filters.status
        ? filters.status
        : filters.kondisi_sla
          ? `sla:${filters.kondisi_sla}`
          : 'semua';

    const handleStatusSelectChange = (val: string | null) => {
        if (!val || val === 'semua') {
            onFilterChange?.({ ...filters, status: null, kondisi_sla: null });
        } else if (val.startsWith('sla:')) {
            onFilterChange?.({
                ...filters,
                status: null,
                kondisi_sla: val.replace('sla:', '') as KondisiSla,
            });
        } else {
            onFilterChange?.({
                ...filters,
                status: val,
                kondisi_sla: null,
            });
        }
    };

    const currentLocationValue = filters.kecamatan_id
        ? `kec:${filters.kecamatan_id}`
        : filters.kota_id
          ? `kota:${filters.kota_id}`
          : 'semua';

    const handleLocationSelectChange = (val: string | null) => {
        if (!val || val === 'semua') {
            onFilterChange?.({ ...filters, kecamatan_id: null, kota_id: null });
        } else if (val.startsWith('kota:')) {
            onFilterChange?.({
                ...filters,
                kota_id: Number(val.replace('kota:', '')),
                kecamatan_id: null,
            });
        } else if (val.startsWith('kec:')) {
            onFilterChange?.({
                ...filters,
                kecamatan_id: Number(val.replace('kec:', '')),
                kota_id: null,
            });
        }
    };

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
                    aria-label={
                        isOpen ? 'Tutup daftar laporan' : 'Buka daftar laporan'
                    }
                    title={
                        isOpen ? 'Tutup daftar laporan' : 'Buka daftar laporan'
                    }
                    className="absolute top-1/2 -right-11 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-none border-y border-r border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Jalan berlubang..."
                                className="h-10 rounded-xl bg-background pr-3 pl-9 text-body-sm"
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
                            variant={
                                isFilterOpen || activeDropdownFilterCount > 0
                                    ? 'secondary'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            className={cn(
                                'h-8 cursor-pointer gap-1.5 rounded-lg text-caption-xs font-semibold shadow-none transition-colors',
                                (isFilterOpen ||
                                    activeDropdownFilterCount > 0) &&
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
                                    isFilterOpen &&
                                        'rotate-180 text-foreground',
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
                                className="h-8 cursor-pointer gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                title="Reset Semua Filter"
                            >
                                <RotateCcw className="size-3" />
                                Reset Semua
                            </Button>
                        )}
                    </div>

                    {/* Active Filter Chips / Pills (Memudahkan melihat & menghapus filter aktif) */}
                    {isFilterActive && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {filters.search.trim() !== '' && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] text-foreground">
                                    <Search className="size-3 text-muted-foreground" />
                                    <span className="max-w-[120px] truncate">
                                        "{filters.search}"
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchInput('');
                                            onFilterChange?.({
                                                ...filters,
                                                search: '',
                                            });
                                        }}
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeStatusLabel && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                                    <Activity className="size-3" />
                                    <span className="max-w-[150px] truncate">
                                        {activeStatusLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onFilterChange?.({
                                                ...filters,
                                                status: null,
                                                kondisi_sla: null,
                                            })
                                        }
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter status"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeLocationLabel && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] text-foreground">
                                    <MapPin className="size-3 text-muted-foreground" />
                                    <span className="max-w-[150px] truncate">
                                        {activeLocationLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onFilterChange?.({
                                                ...filters,
                                                kecamatan_id: null,
                                                kota_id: null,
                                            })
                                        }
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter lokasi"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeKategoriLabel && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] text-foreground">
                                    <Tag className="size-3 text-muted-foreground" />
                                    <span className="max-w-[150px] truncate">
                                        {activeKategoriLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onFilterChange?.({
                                                ...filters,
                                                kategori_id: null,
                                            })
                                        }
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter kategori"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* 3 Select Dropdowns dalam 1 Baris (Bisa Diketik / Searchable Combobox) */}
                    {isFilterOpen && (
                        <div className="grid animate-in grid-cols-3 gap-2 duration-150 fade-in-50">
                            {/* 1. Status Dropdown */}
                            <SearchableFilterDropdown
                                value={currentStatusValue}
                                placeholder="Semua Status"
                                searchPlaceholder="Ketik status..."
                                options={statusDropdownOptions}
                                onSelect={handleStatusSelectChange}
                                align="start"
                            />

                            {/* 2. Lokasi Dropdown */}
                            <SearchableFilterDropdown
                                value={currentLocationValue}
                                placeholder="Semua Lokasi"
                                searchPlaceholder="Ketik kota / kecamatan..."
                                options={locationDropdownOptions}
                                onSelect={handleLocationSelectChange}
                                align="center"
                            />

                            {/* 3. Kategori Dropdown */}
                            <SearchableFilterDropdown
                                value={
                                    filters.kategori_id
                                        ? String(filters.kategori_id)
                                        : 'semua'
                                }
                                placeholder="Semua Kategori"
                                searchPlaceholder="Ketik kategori..."
                                options={kategoriDropdownOptions}
                                onSelect={(val) => {
                                    onFilterChange?.({
                                        ...filters,
                                        kategori_id:
                                            val && val !== 'semua'
                                                ? Number(val)
                                                : null,
                                    });
                                }}
                                align="end"
                            />
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
                                <p className="text-body-medium font-display font-bold text-foreground">
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
                                            ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                                            : 'border-border/80 shadow-none hover:border-primary/50 hover:bg-muted/40',
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
                                            {copiedTicket ===
                                            item.nomor_tiket ? (
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
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.display =
                                                            'none';
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
                                            <h4 className="line-clamp-2 text-body-sm font-display leading-snug font-bold text-foreground">
                                                {item.judul}
                                            </h4>

                                            {/* Location */}
                                            <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                                                <MapPin className="mt-0.5 size-3 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {item.kelurahan_nama
                                                        ? `Kel. ${item.kelurahan_nama}, Kec. ${item.kecamatan_nama}, ${item.kota_nama || 'Jabodetabek'}`
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

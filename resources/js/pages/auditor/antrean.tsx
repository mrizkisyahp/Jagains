import { FormEvent, ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { EskalasiItem } from '@/types/auditor';
import KartuEskalasi from '@/components/auditor/KartuEskalasi';
import AntreanAuditorTable from '@/components/auditor/AntreanAuditorTable';
import AuditorEmptyState from '@/components/auditor/AuditorEmptyState';
import AuditorTablePagination from '@/components/auditor/AuditorTablePagination';
import {
    AlertCircle,
    AlertTriangle,
    Clock,
    RotateCcw,
    Scale,
    Search,
    ShieldAlert,
    X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface AntreanAuditorProps {
    antrean: {
        data: EskalasiItem[];
        current_page: number;
        last_page: number;
        total: number;
        per_page?: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    instansiList: Array<{ id: number; nama: string; singkatan: string }>;
    ringkasan: {
        semua: number;
        sla: number;
        sanggahan: number;
        ronde: number;
        tanpa_kuorum: number;
    };
    filters: {
        tab?: string;
        q?: string;
        kategori_id?: string;
        instansi_id?: string;
    };
}

export default function AntreanAuditorPage({
    antrean,
    kategoriList,
    instansiList,
    ringkasan,
    filters,
}: AntreanAuditorProps) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const activeTab = filters.tab || 'semua';
    const hasActiveFilters = Boolean(
        filters.q ||
        filters.instansi_id ||
        filters.kategori_id ||
        (filters.tab && filters.tab !== 'semua'),
    );

    const handleTabChange = (tab: string) => {
        router.get(
            '/auditor/antrean',
            { ...filters, tab, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleFilterChange = (key: string, val: string | null) => {
        const value =
            val === 'ALL' || val === 'semua' || val === '' ? undefined : val;
        router.get(
            '/auditor/antrean',
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleFilterChange('q', searchQuery.trim() || null);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        router.get(
            '/auditor/antrean',
            {},
            { preserveState: false, preserveScroll: true },
        );
    };

    const handlePageChange = (newPage: number) => {
        router.get(
            '/auditor/antrean',
            { ...filters, page: newPage },
            { preserveState: true, preserveScroll: true },
        );
    };

    const tabItems = [
        {
            id: 'semua',
            label: 'Semua kasus',
            count: ringkasan.semua,
            icon: Scale,
        },
        {
            id: 'sla',
            label: 'Keterlambatan SLA',
            count: ringkasan.sla,
            icon: Clock,
        },
        {
            id: 'sanggahan',
            label: 'Sanggahan instansi',
            count: ringkasan.sanggahan,
            icon: ShieldAlert,
        },
        {
            id: 'ronde',
            label: 'Sengketa ronde 4x',
            count: ringkasan.ronde,
            icon: AlertTriangle,
        },
        {
            id: 'tanpa_kuorum',
            label: 'Tanpa kuorum 14 hari',
            count: ringkasan.tanpa_kuorum,
            icon: AlertCircle,
        },
    ];

    return (
        <div className="w-full min-w-0 space-y-6">
            <Head title="Antrean eskalasi auditor" />

            {/* Header Konteks */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-display-sm font-display font-semibold tracking-tight text-foreground">
                        Antrean Eskalasi & Sengketa
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Penelaahan independen atas laporan warga yang mengalami
                        kebuntuan sengketa fisik, ketiadaan kuorum warga, atau
                        pelanggaran batas waktu SLA kedinasan.
                    </p>
                </div>
            </div>

            {/* Tab Filter Pemicu Sesuai Standar Admin */}
            <Tabs
                value={activeTab}
                onValueChange={(val) => val && handleTabChange(val)}
                className="w-full"
            >
                <div className="w-full scrollbar-none overflow-x-auto pb-1">
                    <TabsList className="inline-flex h-9 w-max min-w-full justify-start bg-muted/50 p-1">
                        {tabItems.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="shrink-0 gap-2 text-xs"
                                >
                                    <Icon className="size-3.5" />
                                    <span>{tab.label}</span>
                                    <span className="py-0.2 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground tabular-nums data-[state=active]:bg-background data-[state=active]:text-foreground">
                                        {tab.count}
                                    </span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>
            </Tabs>

            {/* Card Pembungkus Antrean: Filter di Header Card, Table/Cards di Body, Paginasi di Footer */}
            <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
                {/* Header Card: Toolbar Pencarian & Filter Horizontal */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
                    {/* Search Input di Kiri */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative w-full sm:w-72 md:w-80"
                    >
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor tiket atau judul..."
                            className="h-9 pr-8 pl-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    handleFilterChange('q', null);
                                }}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Hapus pencarian"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </form>

                    {/* Filter Dropdowns di Kanan */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Filter Instansi */}
                        <div className="w-full sm:w-[160px]">
                            <Select
                                value={
                                    filters.instansi_id
                                        ? String(filters.instansi_id)
                                        : 'semua'
                                }
                                onValueChange={(val) =>
                                    handleFilterChange('instansi_id', val)
                                }
                            >
                                <SelectTrigger className="h-9 w-full text-xs">
                                    <span className="flex-1 truncate text-left">
                                        {filters.instansi_id
                                            ? instansiList.find(
                                                  (ins) =>
                                                      String(ins.id) ===
                                                      String(
                                                          filters.instansi_id,
                                                      ),
                                              )?.singkatan ||
                                              instansiList.find(
                                                  (ins) =>
                                                      String(ins.id) ===
                                                      String(
                                                          filters.instansi_id,
                                                      ),
                                              )?.nama ||
                                              'Semua instansi'
                                            : 'Semua instansi'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent
                                    align="start"
                                    className="max-h-72 w-[180px] sm:w-[200px]"
                                >
                                    <SelectItem value="semua">
                                        Semua instansi
                                    </SelectItem>
                                    {instansiList.map((ins) => (
                                        <SelectItem
                                            key={ins.id}
                                            value={String(ins.id)}
                                            title={ins.nama}
                                        >
                                            {ins.singkatan || ins.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter Kategori */}
                        <div className="w-full sm:w-[170px]">
                            <Select
                                value={
                                    filters.kategori_id
                                        ? String(filters.kategori_id)
                                        : 'semua'
                                }
                                onValueChange={(val) =>
                                    handleFilterChange('kategori_id', val)
                                }
                            >
                                <SelectTrigger className="h-9 w-full text-xs">
                                    <span className="flex-1 truncate text-left">
                                        {filters.kategori_id
                                            ? kategoriList.find(
                                                  (kat) =>
                                                      String(kat.id) ===
                                                      String(
                                                          filters.kategori_id,
                                                      ),
                                              )?.nama || 'Semua kategori'
                                            : 'Semua kategori'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent
                                    align="start"
                                    className="max-h-72 w-[220px]"
                                >
                                    <SelectItem value="semua">
                                        Semua kategori
                                    </SelectItem>
                                    {kategoriList.map((kat) => (
                                        <SelectItem
                                            key={kat.id}
                                            value={String(kat.id)}
                                        >
                                            {kat.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>Reset filter</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Konten Antrean: Desktop Table & Mobile Cards */}
                {antrean.data.length === 0 ? (
                    <AuditorEmptyState
                        title="Tidak ada perkara eskalasi terbuka"
                        description={
                            hasActiveFilters
                                ? 'Tidak ada perkara eskalasi yang cocok dengan kombinasi filter atau pencarian saat ini.'
                                : 'Seluruh laporan fisik berjalan dalam koridor pemungutan suara warga dan kepatuhan SLA instansi. Tidak ada perkara yang memerlukan intervensi putusan saat ini.'
                        }
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-8 text-xs"
                                >
                                    Reset filter
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div>
                        {/* Desktop View: Table */}
                        <div className="hidden md:block">
                            <AntreanAuditorTable data={antrean.data} />
                        </div>

                        {/* Mobile View: Cards */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {antrean.data.map((item) => (
                                <KartuEskalasi key={item.id} eskalasi={item} />
                            ))}
                        </div>

                        {/* Paginasi */}
                        <AuditorTablePagination
                            currentPage={antrean.current_page}
                            totalItems={antrean.total}
                            pageSize={antrean.per_page || 9}
                            onPageChange={handlePageChange}
                            itemName="kasus eskalasi"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

AntreanAuditorPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean eskalasi" breadcrumb="Auditor > Antrean">
        {page}
    </InternalLayout>
);

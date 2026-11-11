import { ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Search,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import KartuTiketVerifikasi from '@/components/verifikasi/KartuTiketVerifikasi';
import { TiketVerifikasiItem } from '@/types/verifikasi';
import { cn } from '@/lib/utils';

interface VerifikasiPageProps {
    daftarTiket: {
        data: TiketVerifikasiItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    counts?: {
        perlu_suara: number;
        semua: number;
    };
    kelurahan: { id: number; nama: string } | null;
    filters: {
        tab?: string;
        q?: string;
        kategori_id?: string;
    };
}

export default function VerifikasiWargaPage({
    daftarTiket,
    kategoriList,
    counts,
    kelurahan: _kelurahan,
    filters,
}: VerifikasiPageProps) {
    const [search, setSearch] = useState(filters.q || '');
    const currentTab = filters.tab || 'perlu_suara';

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/warga/verifikasi',
            {
                tab: currentTab,
                q: search.trim() || undefined,
                kategori_id: filters.kategori_id || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleTabChange = (tab: string) => {
        router.get(
            '/warga/verifikasi',
            {
                tab: tab,
                q: search.trim() || undefined,
                kategori_id: filters.kategori_id || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleKategoriChange = (katId: string) => {
        router.get(
            '/warga/verifikasi',
            {
                tab: currentTab,
                q: search.trim() || undefined,
                kategori_id: katId && katId !== 'semua' ? katId : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        router.get(
            '/warga/verifikasi',
            { tab: currentTab },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasFilters = Boolean(filters.q || filters.kategori_id);

    return (
        <InternalLayout
            title="Verifikasi Hasil Perbaikan"
            breadcrumb="Warga > Verifikasi"
        >
            <div className="mx-auto w-full max-w-7xl space-y-6 pb-20">
                <Head title="Verifikasi Hasil Perbaikan - Jagains" />

                {/* Tab Navigasi Standar */}
                <Tabs
                    value={currentTab}
                    onValueChange={handleTabChange}
                    className="space-y-4"
                >
                    <div className="overflow-x-auto pb-1">
                        <TabsList className="inline-flex h-9 w-max min-w-full justify-start bg-muted/50 p-1">
                            <TabsTrigger
                                value="perlu_suara"
                                className="shrink-0 gap-2 text-body-sm"
                            >
                                <AlertCircle className="size-4" />
                                <span>Perlu Suara Anda</span>
                                {typeof counts?.perlu_suara === 'number' && (
                                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-caption-xs font-semibold text-primary">
                                        {counts.perlu_suara}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="semua"
                                className="shrink-0 gap-2 text-body-sm"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Semua Tiket Tahap Verifikasi</span>
                                <span className="rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-caption-xs font-semibold">
                                    {counts?.semua ?? daftarTiket.total}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Toolbar Filter Horizontal */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Form */}
                        <form
                            onSubmit={handleSearch}
                            className="flex min-w-0 flex-1 basis-72 items-center gap-2"
                        >
                            <div className="relative min-w-0 flex-1">
                                <Input
                                    type="search"
                                    placeholder="Cari nomor atau judul tiket…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 pl-9 text-body-sm shadow-none"
                                />
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-9 text-caption-xs font-semibold shadow-none"
                            >
                                Cari
                            </Button>
                        </form>

                        {/* Kategori Select */}
                        <Select
                            value={filters.kategori_id || 'semua'}
                            onValueChange={(val) =>
                                handleKategoriChange(val ?? 'semua')
                            }
                        >
                            <SelectTrigger className="h-9 w-full text-body-sm shadow-none sm:w-52">
                                <SelectValue placeholder="Semua kategori" />
                            </SelectTrigger>
                            <SelectContent>
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

                        {/* Reset Filter Button */}
                        {hasFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResetFilter}
                                className="h-9 gap-1 text-caption-xs text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-3.5" />
                                Reset filter
                            </Button>
                        )}
                    </div>

                    {/* Grid Daftar Tiket Verifikasi */}
                    {daftarTiket.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <CheckCircle2 className="size-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-body-medium font-display font-semibold text-foreground">
                                    {currentTab === 'perlu_suara'
                                        ? 'Tidak Ada Tiket yang Menunggu Suara Anda'
                                        : 'Belum Ada Tiket dalam Tahap Verifikasi'}
                                </h3>
                                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                    {currentTab === 'perlu_suara'
                                        ? 'Seluruh pekerjaan perbaikan di kelurahan Anda saat ini sudah Anda beri suara atau belum ada pekerjaan fisik baru yang diajukan selesai oleh dinas.'
                                        : 'Saat dinas mengajukan selesai pada suatu perbaikan, tiket akan otomatis muncul di sini selama 14 hari kalender untuk diverifikasi bersama warga.'}
                                </p>
                            </div>
                            {hasFilters ? (
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.visit('/warga/riwayat')
                                    }
                                    className="rounded-lg text-caption-xs font-semibold"
                                >
                                    Lihat Riwayat Laporan Saya
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {daftarTiket.data.map((tiket) => (
                                <KartuTiketVerifikasi
                                    key={tiket.id}
                                    tiket={tiket}
                                    onSuaraBerhasil={() =>
                                        router.reload({ only: ['daftarTiket'] })
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* Paginasi Standar Sesuai Acuan Internal */}
                    {daftarTiket.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 text-body-sm text-muted-foreground sm:flex-row">
                            <p>
                                Menampilkan{' '}
                                <span className="font-semibold text-foreground">
                                    {daftarTiket.from}
                                </span>{' '}
                                sampai{' '}
                                <span className="font-semibold text-foreground">
                                    {daftarTiket.to}
                                </span>{' '}
                                dari{' '}
                                <span className="font-semibold text-foreground">
                                    {daftarTiket.total}
                                </span>{' '}
                                tiket
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Halaman sebelumnya"
                                    disabled={daftarTiket.current_page <= 1}
                                    onClick={() => {
                                        if (daftarTiket.current_page > 1) {
                                            router.get(
                                                '/warga/verifikasi',
                                                {
                                                    tab: currentTab,
                                                    page:
                                                        daftarTiket.current_page -
                                                        1,
                                                    q:
                                                        search.trim() ||
                                                        undefined,
                                                    kategori_id:
                                                        filters.kategori_id ||
                                                        undefined,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    className="size-9 shadow-none"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="px-2 text-caption-xs font-medium text-foreground">
                                    Halaman {daftarTiket.current_page} dari{' '}
                                    {daftarTiket.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Halaman berikutnya"
                                    disabled={
                                        daftarTiket.current_page >=
                                        daftarTiket.last_page
                                    }
                                    onClick={() => {
                                        if (
                                            daftarTiket.current_page <
                                            daftarTiket.last_page
                                        ) {
                                            router.get(
                                                '/warga/verifikasi',
                                                {
                                                    tab: currentTab,
                                                    page:
                                                        daftarTiket.current_page +
                                                        1,
                                                    q:
                                                        search.trim() ||
                                                        undefined,
                                                    kategori_id:
                                                        filters.kategori_id ||
                                                        undefined,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    className="size-9 shadow-none"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Tabs>
            </div>
        </InternalLayout>
    );
}

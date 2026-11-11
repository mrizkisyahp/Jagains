import { useState, useMemo } from 'react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SearchableFilterDropdown, {
    DropdownFilterOption,
} from '@/components/peta/SearchableFilterDropdown';

interface AntreanFilterBarProps {
    filters: {
        q?: string;
        kategori_id?: string | number;
        kelurahan_id?: string | number;
        status?: string;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    kelurahanList?: Array<{ id: number; nama: string }>;
    onFilterChange: (filters: {
        q?: string;
        kategori_id?: string;
        kelurahan_id?: string;
        status?: string;
    }) => void;
    onReset: () => void;
    isLoading?: boolean;
}

const STATUS_FILTER_OPTIONS: DropdownFilterOption[] = [
    { value: 'semua', label: 'Semua Status' },
    // Grup Prioritas
    { value: 'AKTIF', label: 'Tiket Aktif', group: 'Kondisi Utama' },
    {
        value: 'LEWAT_SLA',
        label: 'Lewat Batas Waktu (SLA)',
        group: 'Kondisi Utama',
    },
    {
        value: 'SELESAI',
        label: 'Tiket Selesai (Ditutup)',
        group: 'Kondisi Utama',
    },
    // Grup Tahapan Dinas
    {
        value: 'DITERUSKAN',
        label: 'Diteruskan (Menunggu Respons)',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'DITERIMA',
        label: 'Diterima Dinas',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'DISURVEI',
        label: 'Selesai Survei Lapangan',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'TERJADWAL_ANGGARAN',
        label: 'Terjadwal Anggaran',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'DIKERJAKAN',
        label: 'Sedang Dikerjakan',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'MENUNGGU_VERIFIKASI',
        label: 'Menunggu Verifikasi Warga',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'DISENGKETAKAN',
        label: 'Perbaikan Disengketakan',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'MENUNGGU_KEPUTUSAN_AUDITOR',
        label: 'Menunggu Keputusan Auditor',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'USULAN_TOLAK',
        label: 'Usulan Penolakan Dinas',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'TERTUTUP_WARGA',
        label: 'Ditutup Warga',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'TERTUTUP_AUDITOR',
        label: 'Ditutup Auditor',
        group: 'Tahap Operasional Dinas',
    },
    {
        value: 'DITOLAK',
        label: 'Ditolak Permanen',
        group: 'Tahap Operasional Dinas',
    },
];

export default function AntreanFilterBar({
    filters,
    kategoriList,
    kelurahanList = [],
    onFilterChange,
    onReset,
    isLoading = false,
}: AntreanFilterBarProps) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const selectedStatus =
        filters.status === 'verifikasi'
            ? 'MENUNGGU_VERIFIKASI'
            : filters.status || 'semua';

    const selectedKategori = filters.kategori_id
        ? String(filters.kategori_id)
        : 'semua';
    const selectedLokasi = filters.kelurahan_id
        ? String(filters.kelurahan_id)
        : 'semua';

    const hasFilters = Boolean(
        filters.q ||
        filters.kategori_id ||
        filters.kelurahan_id ||
        filters.status,
    );

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onFilterChange({ q: searchQuery.trim() || undefined });
    };

    // Opsi Kategori untuk Searchable Dropdown
    const kategoriOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Kategori' },
        ];
        for (const kat of kategoriList) {
            opts.push({
                value: String(kat.id),
                label: kat.nama,
            });
        }
        return opts;
    }, [kategoriList]);

    // Opsi Lokasi (Kelurahan) untuk Searchable Dropdown
    const lokasiOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Lokasi' },
        ];
        for (const kel of kelurahanList) {
            opts.push({
                value: String(kel.id),
                label: `Kel. ${kel.nama}`,
            });
        }
        return opts;
    }, [kelurahanList]);

    // Style umum tombol pill filter agar besar, teks jelas, dan nyaman dibaca
    const pillTriggerClass =
        'h-10 sm:h-11 rounded-full border border-border/80 bg-card px-4 sm:px-5 text-body-sm font-semibold shadow-2xs hover:bg-muted/60 transition-all cursor-pointer whitespace-nowrap min-w-[130px] max-w-[280px] text-foreground';

    return (
        <div className="w-full space-y-3.5">
            {/* Baris 1: Search Bar Utama Sesuai Wireframe */}
            <form
                onSubmit={handleSearchSubmit}
                className="flex w-full items-center gap-2.5 sm:gap-3"
            >
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="cari-laporan"
                        type="search"
                        placeholder="Jalan berlubang..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-11 rounded-xl border-border/80 bg-card pr-4 pl-10 text-body-sm shadow-2xs transition-all hover:border-foreground/30 focus-visible:border-foreground sm:h-12"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 shrink-0 cursor-pointer rounded-xl bg-foreground px-5 text-body-sm font-bold text-background shadow-xs transition-all hover:bg-foreground/90 sm:h-12 sm:px-6"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        'Cari Laporan'
                    )}
                </Button>
            </form>

            {/* Baris 2: Pill / Chip Filter yang Searchable (Bisa Diketik) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                {/* Pill 1: Filter Status (Searchable) */}
                <div className="inline-block">
                    <SearchableFilterDropdown
                        value={selectedStatus}
                        placeholder="Status"
                        searchPlaceholder="Ketik status (misal: aktif, selesai, disurvei)..."
                        options={STATUS_FILTER_OPTIONS}
                        onSelect={(val) =>
                            onFilterChange({
                                status:
                                    !val || val === 'semua' ? undefined : val,
                            })
                        }
                        triggerClassName={pillTriggerClass}
                        popoverClassName="w-80"
                        align="start"
                    />
                </div>

                {/* Pill 2: Filter Kategori (Searchable) */}
                <div className="inline-block">
                    <SearchableFilterDropdown
                        value={selectedKategori}
                        placeholder="Kategori"
                        searchPlaceholder="Ketik kategori (misal: jalan, sampah, lampu)..."
                        options={kategoriOptions}
                        onSelect={(val) =>
                            onFilterChange({
                                kategori_id:
                                    !val || val === 'semua' ? undefined : val,
                            })
                        }
                        triggerClassName={pillTriggerClass}
                        popoverClassName="w-80"
                        align="start"
                    />
                </div>

                {/* Pill 3: Filter Lokasi / Kelurahan (Searchable) */}
                {kelurahanList.length > 0 && (
                    <div className="inline-block">
                        <SearchableFilterDropdown
                            value={selectedLokasi}
                            placeholder="Lokasi"
                            searchPlaceholder="Ketik kelurahan (misal: mampang, beji, pancoran)..."
                            options={lokasiOptions}
                            onSelect={(val) =>
                                onFilterChange({
                                    kelurahan_id:
                                        !val || val === 'semua'
                                            ? undefined
                                            : val,
                                })
                            }
                            triggerClassName={pillTriggerClass}
                            popoverClassName="w-80"
                            align="start"
                        />
                    </div>
                )}

                {/* Tombol Reset jika filter aktif */}
                {hasFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery('');
                            onReset();
                        }}
                        className="h-10 cursor-pointer gap-2 rounded-full px-4 text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:h-11"
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset Filter</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

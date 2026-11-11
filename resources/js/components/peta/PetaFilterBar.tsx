import {
    Search,
    Filter,
    RotateCcw,
    SlidersHorizontal,
    Check,
} from 'lucide-react';
import { MasterFilterPeta, PetaFilterState, KondisiSla } from '@/types/peta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PetaFilterBarProps {
    filters: PetaFilterState;
    onFilterChange: (newFilters: PetaFilterState) => void;
    masterFilter: MasterFilterPeta;
    totalFiltered: number;
    onReset: () => void;
    onToggleDrawer?: () => void;
    isDrawerOpen?: boolean;
}

const KONDISI_SLA_OPTIONS: Array<{
    value: KondisiSla | 'semua';
    label: string;
    color: string;
}> = [
    { value: 'semua', label: 'Semua Status SLA', color: 'bg-muted-foreground' },
    { value: 'dalam_sla', label: 'Dalam SLA (Aman)', color: 'bg-emerald-500' },
    {
        value: 'hampir_lewat',
        label: 'Hampir Lewat (Kritis)',
        color: 'bg-amber-500',
    },
    {
        value: 'lewat_sla',
        label: 'Lewat SLA (Terlambat)',
        color: 'bg-rose-500',
    },
    {
        value: 'menunggu_warga',
        label: 'Menunggu Warga / Arbitrase',
        color: 'bg-blue-500',
    },
    { value: 'selesai', label: 'Selesai / Ditutup', color: 'bg-slate-500' },
];

export default function PetaFilterBar({
    filters,
    onFilterChange,
    masterFilter,
    totalFiltered,
    onReset,
    onToggleDrawer,
    isDrawerOpen = false,
}: PetaFilterBarProps) {
    const isFilterActive =
        filters.kategori_id !== null ||
        filters.kecamatan_id !== null ||
        filters.kondisi_sla !== null ||
        filters.instansi_id !== null ||
        filters.rentang_waktu !== null ||
        filters.search.trim() !== '';

    const handleSearchChange = (val: string) => {
        onFilterChange({ ...filters, search: val });
    };

    const handleKategoriChange = (val: string | null) => {
        onFilterChange({
            ...filters,
            kategori_id: val && val !== 'semua' ? Number(val) : null,
        });
    };

    const handleKecamatanChange = (val: string | null) => {
        onFilterChange({
            ...filters,
            kecamatan_id: val && val !== 'semua' ? Number(val) : null,
        });
    };

    const handleKondisiSlaChange = (val: string | null) => {
        onFilterChange({
            ...filters,
            kondisi_sla: val && val !== 'semua' ? (val as KondisiSla) : null,
        });
    };

    const handleInstansiChange = (val: string | null) => {
        onFilterChange({
            ...filters,
            instansi_id: val && val !== 'semua' ? Number(val) : null,
        });
    };

    const handleRentangWaktuChange = (val: string | null) => {
        onFilterChange({
            ...filters,
            rentang_waktu: val && val !== 'semua' ? Number(val) : null,
        });
    };

    return (
        <div className="space-y-3 rounded-2xl border border-border bg-card/95 p-3 shadow-md backdrop-blur-md sm:p-4">
            {/* Baris Atas: Pencarian Teks & Filter Primer */}
            <div className="flex flex-col items-stretch gap-2.5 md:flex-row md:items-center">
                {/* Input Pencarian Nomor Tiket / Judul */}
                <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Cari nomor tiket atau judul laporan..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="h-10 rounded-xl border-border bg-background pl-9 text-body-sm"
                    />
                </div>

                {/* Filter Kategori */}
                <div className="w-full md:w-[210px]">
                    <Select
                        value={
                            filters.kategori_id
                                ? String(filters.kategori_id)
                                : 'semua'
                        }
                        onValueChange={handleKategoriChange}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-body-sm">
                            <span className="flex-1 truncate text-left">
                                {filters.kategori_id
                                    ? masterFilter.kategori.find(
                                          (k) => k.id === filters.kategori_id,
                                      )?.nama || 'Kategori'
                                    : 'Semua Kategori'}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">
                            <SelectItem
                                value="semua"
                                className="text-body-sm font-medium"
                            >
                                Semua Kategori
                            </SelectItem>
                            {masterFilter.kategori.map((kat) => (
                                <SelectItem
                                    key={kat.id}
                                    value={String(kat.id)}
                                    className="text-body-sm"
                                >
                                    {kat.nama}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filter Kondisi SLA */}
                <div className="w-full md:w-[210px]">
                    <Select
                        value={filters.kondisi_sla ?? 'semua'}
                        onValueChange={handleKondisiSlaChange}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-body-sm">
                            <span className="flex-1 truncate text-left">
                                {filters.kondisi_sla
                                    ? KONDISI_SLA_OPTIONS.find(
                                          (k) =>
                                              k.value === filters.kondisi_sla,
                                      )?.label
                                    : 'Semua Status SLA'}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {KONDISI_SLA_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-body-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`size-2.5 rounded-full ${opt.color}`}
                                        />
                                        <span>{opt.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filter Kecamatan */}
                <div className="w-full md:w-[190px]">
                    <Select
                        value={
                            filters.kecamatan_id
                                ? String(filters.kecamatan_id)
                                : 'semua'
                        }
                        onValueChange={handleKecamatanChange}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-body-sm">
                            <span className="flex-1 truncate text-left">
                                {filters.kecamatan_id
                                    ? masterFilter.kecamatan.find(
                                          (k) => k.id === filters.kecamatan_id,
                                      )?.nama || 'Kecamatan'
                                    : 'Semua Kecamatan'}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">
                            <SelectItem
                                value="semua"
                                className="text-body-sm font-medium"
                            >
                                Semua Kecamatan
                            </SelectItem>
                            {masterFilter.kecamatan.map((kec) => (
                                <SelectItem
                                    key={kec.id}
                                    value={String(kec.id)}
                                    className="text-body-sm"
                                >
                                    Kec. {kec.nama}
                                    {kec.kota_nama ? ` (${kec.kota_nama})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tombol Filter Lanjutan (Instansi & Rentang Waktu) */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 shrink-0 gap-1.5 rounded-xl border-border px-3 text-body-sm"
                            >
                                <SlidersHorizontal className="size-4 text-muted-foreground" />
                                <span className="hidden sm:inline">
                                    Lanjutan
                                </span>
                                {(filters.instansi_id !== null ||
                                    filters.rentang_waktu !== null) && (
                                    <span className="size-2 rounded-full bg-primary" />
                                )}
                            </Button>
                        }
                    />
                    <DropdownMenuContent
                        align="end"
                        className="w-64 space-y-3 rounded-2xl p-3"
                    >
                        <DropdownMenuLabel className="p-0 text-body-sm font-bold text-foreground">
                            Filter Lanjutan
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Filter Instansi */}
                        <div className="space-y-1.5">
                            <label className="text-caption-xs font-semibold text-muted-foreground">
                                Instansi Penanggung Jawab
                            </label>
                            <Select
                                value={
                                    filters.instansi_id
                                        ? String(filters.instansi_id)
                                        : 'semua'
                                }
                                onValueChange={handleInstansiChange}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl border-border bg-background text-body-sm">
                                    <span className="flex-1 truncate text-left">
                                        {filters.instansi_id
                                            ? masterFilter.instansi.find(
                                                  (i) =>
                                                      i.id ===
                                                      filters.instansi_id,
                                              )?.nama || 'Instansi'
                                            : 'Semua Instansi'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-h-52 rounded-xl">
                                    <SelectItem
                                        value="semua"
                                        className="text-body-sm font-medium"
                                    >
                                        Semua Instansi
                                    </SelectItem>
                                    {masterFilter.instansi.map((ins) => (
                                        <SelectItem
                                            key={ins.id}
                                            value={String(ins.id)}
                                            className="text-body-sm"
                                        >
                                            {ins.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter Rentang Waktu */}
                        <div className="space-y-1.5">
                            <label className="text-caption-xs font-semibold text-muted-foreground">
                                Rentang Waktu Laporan
                            </label>
                            <Select
                                value={
                                    filters.rentang_waktu
                                        ? String(filters.rentang_waktu)
                                        : 'semua'
                                }
                                onValueChange={handleRentangWaktuChange}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl border-border bg-background text-body-sm">
                                    <span className="flex-1 truncate text-left">
                                        {filters.rentang_waktu === 7
                                            ? '7 Hari Terakhir'
                                            : filters.rentang_waktu === 30
                                              ? '30 Hari Terakhir'
                                              : filters.rentang_waktu === 90
                                                ? '90 Hari Terakhir'
                                                : 'Seluruh Waktu'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem
                                        value="semua"
                                        className="text-body-sm font-medium"
                                    >
                                        Seluruh Waktu
                                    </SelectItem>
                                    <SelectItem
                                        value="7"
                                        className="text-body-sm"
                                    >
                                        7 Hari Terakhir
                                    </SelectItem>
                                    <SelectItem
                                        value="30"
                                        className="text-body-sm"
                                    >
                                        30 Hari Terakhir
                                    </SelectItem>
                                    <SelectItem
                                        value="90"
                                        className="text-body-sm"
                                    >
                                        90 Hari Terakhir
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Tombol Reset Filter */}
                {isFilterActive && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onReset}
                        className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                        title="Reset Filter"
                    >
                        <RotateCcw className="size-4" />
                    </Button>
                )}
            </div>

            {/* Baris Bawah: Counter Hasil & Toggle Drawer */}
            <div className="flex items-center justify-between border-t border-border/60 pt-1 text-body-sm">
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="px-2.5 py-0.5 text-caption-xs font-mono font-semibold"
                    >
                        {totalFiltered} Laporan Ditemukan
                    </Badge>
                    {isFilterActive && (
                        <span className="hidden text-caption-xs text-muted-foreground sm:inline">
                            (Filter aktif)
                        </span>
                    )}
                </div>

                {onToggleDrawer && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onToggleDrawer}
                        className="h-8 gap-1.5 rounded-lg border-border text-caption-xs font-semibold"
                    >
                        <Filter className="size-3.5" />
                        {isDrawerOpen ? 'Tutup Daftar' : 'Buka Daftar Tiket'}
                    </Button>
                )}
            </div>
        </div>
    );
}

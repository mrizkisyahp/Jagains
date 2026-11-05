import { useState } from 'react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { INSTANSI_STATUS } from '@/components/instansi/InstansiStatusBadge';

interface AntreanFilterBarProps {
    filters: { q?: string; kategori_id?: string | number; status?: string };
    kategoriList: Array<{ id: number; nama: string }>;
    onFilterChange: (filters: {
        q?: string;
        kategori_id?: string;
        status?: string;
    }) => void;
    onReset: () => void;
    isLoading?: boolean;
}

const GROUP_FILTERS: Record<string, string> = {
    perlu_respons: 'Perlu respons awal',
    survei_anggaran: 'Survei & penjadwalan anggaran',
    pengerjaan: 'Penjadwalan & pengerjaan',
    sengketa: 'Sengketa & peninjauan Auditor',
    selesai_verifikasi: 'Verifikasi & tiket selesai',
};

export default function AntreanFilterBar({
    filters,
    kategoriList,
    onFilterChange,
    onReset,
    isLoading = false,
}: AntreanFilterBarProps) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const selectedStatus =
        filters.status === 'verifikasi'
            ? 'MENUNGGU_VERIFIKASI'
            : filters.status || 'semua';
    const hasFilters = Boolean(
        filters.q || filters.kategori_id || filters.status,
    );
    return (
        <div className="flex flex-wrap items-center gap-2">
            <form
                className="flex min-w-0 flex-1 basis-72 items-center gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    onFilterChange({ q: searchQuery.trim() || undefined });
                }}
            >
                <Field className="relative min-w-0 flex-1 gap-0">
                    <FieldLabel htmlFor="cari-tiket" className="sr-only">
                        Cari nomor atau judul tiket
                    </FieldLabel>
                    <div className="relative">
                        <Input
                            id="cari-tiket"
                            type="search"
                            placeholder="Cari nomor atau judul tiket…"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            className="h-11 pl-9 text-body-base shadow-none md:h-9 md:text-body-sm"
                        />
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </div>
                </Field>
                <Button
                    type="submit"
                    variant="outline"
                    className="h-11 shadow-none md:h-9"
                >
                    {isLoading && (
                        <Loader2
                            className="animate-spin"
                            data-icon="inline-start"
                        />
                    )}
                    Cari
                </Button>
            </form>
            <Field className="w-full gap-0 sm:w-52">
                <FieldLabel htmlFor="status-tiket" className="sr-only">
                    Filter status tiket
                </FieldLabel>
                <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                        onFilterChange({
                            status:
                                !value || value === 'semua' ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger
                        id="status-tiket"
                        className="w-full text-body-base shadow-none data-[size=default]:h-11 md:text-body-sm md:data-[size=default]:h-9"
                    >
                        <SelectValue>
                            {(value: string | null) =>
                                value === 'semua'
                                    ? 'Semua status'
                                    : (INSTANSI_STATUS[value ?? '']?.label ??
                                      GROUP_FILTERS[value ?? ''] ??
                                      'Pilih status')
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="semua">Semua status</SelectItem>
                            {Object.entries(INSTANSI_STATUS).map(
                                ([value, status]) => (
                                    <SelectItem key={value} value={value}>
                                        {status.label}
                                    </SelectItem>
                                ),
                            )}
                            {GROUP_FILTERS[selectedStatus] && (
                                <SelectItem value={selectedStatus}>
                                    {GROUP_FILTERS[selectedStatus]}
                                </SelectItem>
                            )}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
            <Field className="min-w-0 flex-1 basis-40 gap-0 sm:max-w-56">
                <FieldLabel htmlFor="kategori-tiket" className="sr-only">
                    Filter kategori laporan
                </FieldLabel>
                <Select
                    value={
                        filters.kategori_id
                            ? String(filters.kategori_id)
                            : 'semua'
                    }
                    onValueChange={(value) =>
                        onFilterChange({
                            kategori_id:
                                !value || value === 'semua' ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger
                        id="kategori-tiket"
                        className="w-full text-body-base shadow-none data-[size=default]:h-11 md:text-body-sm md:data-[size=default]:h-9"
                    >
                        <SelectValue>
                            {(value: string | null) =>
                                kategoriList.find(
                                    (kategori) => String(kategori.id) === value,
                                )?.nama ?? 'Semua kategori'
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="semua">
                                Semua kategori
                            </SelectItem>
                            {kategoriList.map((kategori) => (
                                <SelectItem
                                    key={kategori.id}
                                    value={String(kategori.id)}
                                >
                                    {kategori.nama}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
            {hasFilters && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        setSearchQuery('');
                        onReset();
                    }}
                    className="h-11 md:h-9"
                >
                    <RotateCcw data-icon="inline-start" />
                    Reset
                </Button>
            )}
        </div>
    );
}

import { type FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { AuditLogFilterState } from '@/types/audit';
import { RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AuditLogFilterBarProps {
    filters: AuditLogFilterState;
    daftarAksi: string[];
    routeUrl: string;
}

export default function AuditLogFilterBar({
    filters,
    daftarAksi,
    routeUrl,
}: AuditLogFilterBarProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [aksi, setAksi] = useState(filters.aksi ?? '');
    const [waktuMulai, setWaktuMulai] = useState(filters.waktu_mulai ?? '');
    const [waktuSelesai, setWaktuSelesai] = useState(
        filters.waktu_selesai ?? '',
    );

    const hasActiveFilter = Boolean(
        search || aksi || waktuMulai || waktuSelesai,
    );

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            routeUrl,
            {
                search: search || undefined,
                aksi: aksi || undefined,
                waktu_mulai: waktuMulai || undefined,
                waktu_selesai: waktuSelesai || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setAksi('');
        setWaktuMulai('');
        setWaktuSelesai('');
        router.get(routeUrl, {}, { preserveState: true, replace: true });
    };

    return (
        <form onSubmit={handleFilter} className="w-full min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative min-w-[220px] flex-1">
                    <Search
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari pelaku, nomor tiket, objek, alasan..."
                        className="h-9 pl-9 text-xs"
                    />
                </div>

                {/* Filter Jenis Aksi */}
                <div className="w-[180px]">
                    <Select
                        value={aksi || 'semua'}
                        onValueChange={(val) =>
                            setAksi(val === 'semua' ? '' : (val ?? ''))
                        }
                    >
                        <SelectTrigger className="h-9 w-full text-xs">
                            <SelectValue placeholder="Semua Jenis Aksi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="semua">
                                    Semua Jenis Aksi
                                </SelectItem>
                                {daftarAksi.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tanggal Mulai */}
                <div className="w-[145px]">
                    <Input
                        type="date"
                        value={waktuMulai}
                        onChange={(e) => setWaktuMulai(e.target.value)}
                        className="h-9 text-xs"
                        title="Dari Tanggal"
                    />
                </div>

                {/* Tanggal Selesai */}
                <div className="w-[145px]">
                    <Input
                        type="date"
                        value={waktuSelesai}
                        onChange={(e) => setWaktuSelesai(e.target.value)}
                        className="h-9 text-xs"
                        title="Sampai Tanggal"
                    />
                </div>

                {/* Tombol Terapkan */}
                <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    className="h-9 gap-1"
                    title="Terapkan Filter Log"
                    aria-label="Terapkan Filter Log"
                >
                    <Search className="size-3.5 sm:hidden" aria-hidden="true" />
                    <span className="hidden sm:inline">Terapkan</span>
                </Button>

                {/* Tombol Reset (hanya jika ada filter aktif) */}
                {hasActiveFilter && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleReset}
                        className="h-9 gap-1"
                        title="Reset Filter Log"
                        aria-label="Reset Filter Log"
                    >
                        <RotateCcw
                            className="size-3 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>
                )}
            </div>
        </form>
    );
}

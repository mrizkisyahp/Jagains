import { useState } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface KategoriItem {
    id: number;
    nama: string;
}

interface AntreanFilterBarProps {
    filters: {
        q?: string;
        kategori_id?: string | number;
    };
    kategoriList: KategoriItem[];
    onFilterChange: (newFilters: { q?: string; kategori_id?: string }) => void;
    onReset: () => void;
}

export default function AntreanFilterBar({
    filters,
    kategoriList,
    onFilterChange,
    onReset,
}: AntreanFilterBarProps) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({
            q: searchQuery.trim(),
            kategori_id: filters.kategori_id ? String(filters.kategori_id) : undefined,
        });
    };

    const handleKategoriSelect = (val: string | null) => {
        const kategoriVal = !val || val === 'semua' ? undefined : val;
        onFilterChange({
            q: searchQuery.trim() || undefined,
            kategori_id: kategoriVal,
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        onReset();
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
            {/* Form Pencarian Teks */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari nomor tiket (JAG-xxxx) atau uraian kerusakan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-body-sm w-full"
                />
            </form>

            <div className="flex items-center gap-2">
                {/* Dropdown Kategori Kerusakan */}
                <Select
                    value={filters.kategori_id ? String(filters.kategori_id) : 'semua'}
                    onValueChange={handleKategoriSelect}
                >
                    <SelectTrigger className="h-9 w-[190px] text-body-sm">
                        <Filter className="size-3.5 text-muted-foreground mr-1.5" />
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="semua">Semua Kategori</SelectItem>
                        {kategoriList.map((kat) => (
                            <SelectItem key={kat.id} value={String(kat.id)}>
                                {kat.nama}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Tombol Terapkan / Reset */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-9 gap-1.5 text-caption-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    <RotateCcw className="size-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                </Button>
            </div>
        </div>
    );
}

import { useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Edit2, History, Save, Search, Settings2, X } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export interface PengaturanRow {
    key: string;
    nilai: string;
    tipe: string;
    versi: number;
    diubah_oleh: number | null;
    waktu: string | null;
    pengubah?: {
        id: number;
        username: string;
    } | null;
}

interface KonfigurasiParameterTabProps {
    pengaturan: PengaturanRow[];
}

export default function KonfigurasiParameterTab({
    pengaturan,
}: KonfigurasiParameterTabProps) {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterTipe, setFilterTipe] = useState('semua');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            nilai: '',
            alasan: '',
        });

    const filteredPengaturan = useMemo(() => {
        return pengaturan.filter((p) => {
            const matchSearch =
                !search.trim() ||
                p.key.toLowerCase().includes(search.trim().toLowerCase()) ||
                p.nilai.toLowerCase().includes(search.trim().toLowerCase());
            const matchTipe = filterTipe === 'semua' || p.tipe === filterTipe;
            return matchSearch && matchTipe;
        });
    }, [pengaturan, search, filterTipe]);

    const paginatedPengaturan = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredPengaturan.slice(start, start + PAGE_SIZE);
    }, [filteredPengaturan, page]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
    };

    const handleTipeChange = (val: string | null) => {
        setFilterTipe(val ?? 'semua');
        setPage(1);
    };

    const mulaiEdit = (param: PengaturanRow) => {
        setEditingKey(param.key);
        setData({
            nilai: param.nilai,
            alasan: '',
        });
        clearErrors();
    };

    const batalEdit = () => {
        setEditingKey(null);
        reset();
        clearErrors();
    };

    const simpanParam = (key: string) => {
        put(`/admin/konfigurasi/parameter/${key}`, {
            onSuccess: () => {
                setEditingKey(null);
                reset();
            },
        });
    };

    const formatTanggal = (iso: string | null) => {
        if (!iso) {
            return '-';
        }
        return new Date(iso).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-body-medium font-semibold text-foreground">
                            <Settings2
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <span>Parameter Global Sistem</span>
                        </h3>
                        <p className="text-caption-xs text-muted-foreground">
                            Konfigurasi operasional tingkat aplikasi dengan
                            pencatatan nomor versi dan log audit.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 sm:w-60">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari key atau nilai..."
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="h-9 pr-8 pl-9 text-xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label="Hapus filter pencarian"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        <Select
                            value={filterTipe}
                            onValueChange={handleTipeChange}
                        >
                            <SelectTrigger className="h-9 w-[130px] text-xs">
                                <SelectValue placeholder="Tipe Data" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="semua">
                                        Semua Tipe
                                    </SelectItem>
                                    <SelectItem value="integer">
                                        Integer
                                    </SelectItem>
                                    <SelectItem value="boolean">
                                        Boolean
                                    </SelectItem>
                                    <SelectItem value="string">
                                        String
                                    </SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Key Parameter
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Tipe
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Nilai Konfigurasi
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Versi
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Pengubah Terakhir
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPengaturan.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-32 text-center"
                                >
                                    <AdminEmptyState
                                        icon={Settings2}
                                        title="Parameter Tidak Ditemukan"
                                        description="Tidak ada parameter yang cocok dengan kata kunci atau filter tipe."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedPengaturan.map((param) => {
                                const isEditing = editingKey === param.key;
                                return (
                                    <TableRow
                                        key={param.key}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <TableCell className="text-body-sm font-mono font-semibold text-foreground">
                                            {param.key}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-[11px]"
                                            >
                                                {param.tipe}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="max-w-xs space-y-1.5">
                                                    <Input
                                                        type="text"
                                                        value={data.nilai}
                                                        onChange={(e) =>
                                                            setData(
                                                                'nilai',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 text-xs"
                                                    />
                                                    <Input
                                                        type="text"
                                                        placeholder="Alasan perubahan (opsional)..."
                                                        value={data.alasan}
                                                        onChange={(e) =>
                                                            setData(
                                                                'alasan',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-7 text-[11px]"
                                                    />
                                                    {errors.nilai && (
                                                        <p className="text-[10px] text-destructive">
                                                            {errors.nilai}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="rounded border border-border bg-muted/40 px-2.5 py-1 text-caption-xs font-mono font-semibold text-foreground">
                                                    {param.nilai}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                                <History
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                v{param.versi}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-body-sm text-foreground">
                                            <div>
                                                <span className="font-medium text-foreground">
                                                    {param.pengubah?.username ||
                                                        'Sistem / Seeder'}
                                                </span>
                                                <span className="block text-caption-xs text-muted-foreground tabular-nums">
                                                    {formatTanggal(param.waktu)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="default"
                                                        disabled={processing}
                                                        onClick={() =>
                                                            simpanParam(
                                                                param.key,
                                                            )
                                                        }
                                                        title="Simpan Parameter"
                                                        aria-label="Simpan Parameter"
                                                    >
                                                        <Save
                                                            className="size-3"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="hidden sm:inline">
                                                            Simpan
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon-sm"
                                                        variant="outline"
                                                        onClick={batalEdit}
                                                    >
                                                        <X
                                                            className="size-3"
                                                            aria-hidden="true"
                                                        />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        mulaiEdit(param)
                                                    }
                                                    title={`Ubah parameter ${param.key}`}
                                                    aria-label={`Ubah parameter ${param.key}`}
                                                >
                                                    <Edit2
                                                        className="size-3 text-muted-foreground"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="hidden sm:inline">
                                                        Ubah
                                                    </span>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                <AdminTablePagination
                    currentPage={page}
                    totalItems={filteredPengaturan.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    itemName="parameter"
                />
            </div>
        </div>
    );
}

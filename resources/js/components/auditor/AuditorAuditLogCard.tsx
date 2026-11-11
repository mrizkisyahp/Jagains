import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AuditLogItem,
    AuditLogFilterState,
    PaginatedData,
} from '@/types/audit';
import { Eye, RotateCcw, Search, ShieldCheck } from 'lucide-react';
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
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import AuditorTablePagination from '@/components/auditor/AuditorTablePagination';
import AuditorEmptyState from '@/components/auditor/AuditorEmptyState';
import AuditorModalDetailAuditLog from '@/components/auditor/AuditorModalDetailAuditLog';

interface AuditorAuditLogCardProps {
    logs: PaginatedData<AuditLogItem>;
    filters: AuditLogFilterState;
    daftarAksi: string[];
}

export default function AuditorAuditLogCard({
    logs,
    filters,
    daftarAksi,
}: AuditorAuditLogCardProps) {
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    // Filter states
    const [search, setSearch] = useState(filters.search ?? '');
    const [aksi, setAksi] = useState(filters.aksi ?? '');
    const [waktuMulai, setWaktuMulai] = useState(filters.waktu_mulai ?? '');
    const [waktuSelesai, setWaktuSelesai] = useState(
        filters.waktu_selesai ?? '',
    );

    const hasActiveFilter = Boolean(
        search || aksi || waktuMulai || waktuSelesai,
    );

    const handleFilterSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/auditor/audit-log',
            {
                search: search || undefined,
                aksi: aksi || undefined,
                waktu_mulai: waktuMulai || undefined,
                waktu_selesai: waktuSelesai || undefined,
                page: 1,
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
        router.get(
            '/auditor/audit-log',
            {},
            { preserveState: false, replace: true },
        );
    };

    const handlePageChange = (newPage: number) => {
        router.get(
            '/auditor/audit-log',
            {
                ...filters,
                page: newPage,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatJam = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getAksiBadgeVariant = (itemAksi: string) => {
        if (itemAksi.includes('BUKA_IDENTITAS')) {
            return 'sla-warn' as const;
        }
        if (itemAksi.includes('MODERASI') || itemAksi.includes('SEMBUNYIKAN')) {
            return 'destructive' as const;
        }
        if (itemAksi.includes('ROUTING') || itemAksi.includes('DISPOSISI')) {
            return 'stage-verify' as const;
        }
        if (
            itemAksi.includes('GANTI_SANDI') ||
            itemAksi.includes('BUAT_AKUN')
        ) {
            return 'secondary' as const;
        }
        return 'outline' as const;
    };

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            {/* Header Card: Toolbar Pencarian & Filter Terpadu */}
            <form
                onSubmit={handleFilterSubmit}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4"
            >
                {/* Search Input di Kiri */}
                <div className="relative w-full sm:w-72 md:w-80">
                    <Search
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari pelaku, nomor tiket, objek..."
                        className="h-9 pr-8 pl-9 text-xs"
                    />
                </div>

                {/* Filter & Tombol Aksi di Kanan */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Jenis Aksi */}
                    <div className="w-full sm:w-[170px]">
                        <Select
                            value={aksi || 'semua'}
                            onValueChange={(val) =>
                                setAksi(val === 'semua' ? '' : (val ?? ''))
                            }
                        >
                            <SelectTrigger className="h-9 w-full text-xs">
                                <span className="flex-1 truncate text-left">
                                    {aksi || 'Semua Jenis Aksi'}
                                </span>
                            </SelectTrigger>
                            <SelectContent
                                align="start"
                                className="max-h-72 w-[220px]"
                            >
                                <SelectItem value="semua">
                                    Semua Jenis Aksi
                                </SelectItem>
                                {daftarAksi.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tanggal Mulai */}
                    <div className="w-full sm:w-[135px]">
                        <Input
                            type="date"
                            value={waktuMulai}
                            onChange={(e) => setWaktuMulai(e.target.value)}
                            aria-label="Filter Tanggal Mulai"
                            className="h-9 text-xs"
                        />
                    </div>

                    {/* Tanggal Selesai */}
                    <div className="w-full sm:w-[135px]">
                        <Input
                            type="date"
                            value={waktuSelesai}
                            onChange={(e) => setWaktuSelesai(e.target.value)}
                            aria-label="Filter Tanggal Selesai"
                            className="h-9 text-xs"
                        />
                    </div>

                    {/* Tombol Terapkan */}
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 px-3.5 text-xs font-semibold"
                    >
                        Terapkan
                    </Button>

                    {/* Tombol Reset */}
                    {hasActiveFilter && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset</span>
                        </Button>
                    )}
                </div>
            </form>

            {/* Body Card: Tabel Log Audit */}
            <div className="w-full min-w-0 overflow-x-auto">
                <Table className="w-full min-w-[760px] table-fixed">
                    <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border">
                            <TableHead className="w-[15%] min-w-[120px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Waktu (WIB)
                            </TableHead>
                            <TableHead className="w-[15%] min-w-[120px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Pelaku
                            </TableHead>
                            <TableHead className="w-[18%] min-w-[130px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Jenis Aksi
                            </TableHead>
                            <TableHead className="w-[14%] min-w-[100px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Objek / Entitas
                            </TableHead>
                            <TableHead className="w-[14%] min-w-[110px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Tiket Terkait
                            </TableHead>
                            <TableHead className="w-[16%] min-w-[120px] text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Alasan Tindakan
                            </TableHead>
                            <TableHead className="w-[8%] min-w-[70px] text-right text-caption-xs font-semibold tracking-wider text-foreground uppercase">
                                Rincian
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-12 text-center"
                                >
                                    <AuditorEmptyState
                                        title="Log Audit Kosong"
                                        description="Tidak ada rekaman log audit forensik yang cocok dengan kriteria pencarian ini."
                                        action={
                                            hasActiveFilter ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleReset}
                                                    className="h-8 text-xs"
                                                >
                                                    Reset filter
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.data.map((log) => (
                                <TableRow
                                    key={log.id}
                                    className="border-b border-border transition-colors hover:bg-muted/20"
                                >
                                    <TableCell className="min-w-0 font-mono whitespace-nowrap">
                                        <div className="text-body-sm font-semibold text-foreground tabular-nums">
                                            {formatTanggal(log.waktu)}
                                        </div>
                                        <div className="text-caption-xs text-muted-foreground tabular-nums">
                                            {formatJam(log.waktu)} WIB
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-0">
                                        <div
                                            className="truncate text-body-sm font-semibold text-foreground"
                                            title={
                                                log.pelaku?.username ?? 'Sistem'
                                            }
                                        >
                                            {log.pelaku?.username ?? 'Sistem'}
                                        </div>
                                        {log.pelaku?.peran && (
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                {log.pelaku.peran}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="min-w-0">
                                        <Badge
                                            variant={getAksiBadgeVariant(
                                                log.aksi,
                                            )}
                                            className="max-w-full truncate font-mono text-[11px]"
                                            title={log.aksi}
                                        >
                                            {log.aksi}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="min-w-0 truncate text-caption-xs font-mono text-foreground">
                                        {log.objek_tipe ? (
                                            <span
                                                title={`${log.objek_tipe} #${log.objek_id || ''}`}
                                            >
                                                <strong className="font-semibold text-foreground">
                                                    {log.objek_tipe}
                                                </strong>
                                                {log.objek_id && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        #{log.objek_id}
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="min-w-0 truncate text-caption-xs font-mono">
                                        {log.laporan ? (
                                            <a
                                                href={`/tiket/${log.laporan.nomor_tiket}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-semibold text-primary hover:underline"
                                            >
                                                {log.laporan.nomor_tiket}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className="min-w-0 truncate text-body-sm text-muted-foreground"
                                        title={log.alasan ?? '-'}
                                    >
                                        {log.alasan || (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedLog(log)}
                                            title={`Lihat rincian log #${log.id}`}
                                            aria-label={`Lihat rincian log #${log.id}`}
                                            className="h-8 gap-1 px-2.5 text-xs font-medium"
                                        >
                                            <Eye
                                                className="size-3 shrink-0 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <span className="hidden sm:inline">
                                                Lihat
                                            </span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Card: Paginasi Standar Auditor */}
            <AuditorTablePagination
                currentPage={logs.current_page}
                totalItems={logs.total}
                pageSize={logs.per_page}
                onPageChange={handlePageChange}
                itemName="rekaman log"
            />

            {/* Modal Detail Audit Log dengan Ukuran Luas */}
            <AuditorModalDetailAuditLog
                log={selectedLog}
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}

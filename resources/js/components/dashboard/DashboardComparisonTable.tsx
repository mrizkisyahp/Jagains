import { useState, useMemo } from 'react';
import { MatriksKinerjaRow } from '@/types/dashboard';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardComparisonTableProps {
    rows: MatriksKinerjaRow[];
    ambangBatas: number;
}

type SortField = keyof Omit<MatriksKinerjaRow, 'id' | 'data_cukup'>;
type SortDirection = 'asc' | 'desc';

export default function DashboardComparisonTable({
    rows,
    ambangBatas,
}: DashboardComparisonTableProps) {
    const [sortField, setSortField] = useState<SortField>('total_tiket');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedRows = useMemo(() => {
        return [...rows].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortDirection === 'asc'
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });
    }, [rows, sortField, sortDirection]);

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return (
                <ArrowUpDown className="ml-1 inline size-3 text-muted-foreground/60" />
            );
        }
        return sortDirection === 'asc' ? (
            <ArrowUp className="ml-1 inline size-3 text-primary" />
        ) : (
            <ArrowDown className="ml-1 inline size-3 text-primary" />
        );
    };

    return (
        <TooltipProvider>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="text-caption-sm w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                <th
                                    onClick={() => handleSort('nama')}
                                    className="cursor-pointer p-3.5 pl-4 transition-colors hover:text-foreground"
                                >
                                    <span>Unit / Wilayah</span>
                                    {renderSortIcon('nama')}
                                </th>
                                <th
                                    onClick={() => handleSort('total_tiket')}
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <span>Total Tiket</span>
                                    {renderSortIcon('total_tiket')}
                                </th>
                                <th
                                    onClick={() => handleSort('tiket_selesai')}
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <span>Tiket Selesai</span>
                                    {renderSortIcon('tiket_selesai')}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('median_respons_hk')
                                    }
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Median Respons</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Median selisih hari kerja dari
                                            diteruskan hingga direspons pertama.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('median_respons_hk')}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('median_selesai_hk')
                                    }
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Waktu Selesai</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Median hari kerja dari diterima
                                            dinas hingga pengajuan selesai fisik.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('median_selesai_hk')}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('janji_ditepati_persen')
                                    }
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Janji Ditepati</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Persentase penyelesaian fisik paling
                                            lambat pada tanggal target awal APBD.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('janji_ditepati_persen')}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('anggaran_menggantung_total')
                                    }
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Anggaran Menggantung</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Jumlah tiket terjadwal anggaran yang
                                            melampaui tanggal target janji.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon(
                                        'anggaran_menggantung_total',
                                    )}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('tingkat_verifikasi_persen')
                                    }
                                    className="cursor-pointer p-3.5 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Verifikasi Warga</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Rasio tiket yang disetujui kuorum
                                            warga kelurahan.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon(
                                        'tingkat_verifikasi_persen',
                                    )}
                                </th>
                                <th
                                    onClick={() =>
                                        handleSort('tingkat_sengketa_persen')
                                    }
                                    className="cursor-pointer p-3.5 pr-4 text-center transition-colors hover:text-foreground"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Tingkat Sengketa</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Rasio penolakan perbaikan warga yang
                                            berlanjut ke sengketa.
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('tingkat_sengketa_persen')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {sortedRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        Belum ada data tiket untuk periode yang
                                        dipilih.
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="transition-colors hover:bg-muted/20"
                                    >
                                        <td className="p-3.5 pl-4 font-semibold text-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>{row.nama}</span>
                                                {!row.data_cukup && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-amber-500/30 bg-amber-500/5 py-0 text-[10px] font-medium text-amber-600"
                                                    >
                                                        Data belum cukup
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-center font-mono font-medium">
                                            {row.total_tiket}
                                        </td>
                                        <td className="p-3.5 text-center font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                            {row.tiket_selesai}
                                        </td>

                                        {/* Metrik Objektif dengan Penanganan Ambang P-21 */}
                                        {!row.data_cukup ? (
                                            <td
                                                colSpan={6}
                                                className="p-3.5 text-center text-xs text-muted-foreground italic"
                                            >
                                                Data belum cukup (&lt;{' '}
                                                {ambangBatas} tiket tertutup)
                                                untuk menghitung statistik
                                                reliabel
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.median_respons_hk !==
                                                    null
                                                        ? `${row.median_respons_hk} HK`
                                                        : '-'}
                                                </td>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.median_selesai_hk !==
                                                    null
                                                        ? `${row.median_selesai_hk} HK`
                                                        : '-'}
                                                </td>
                                                <td className="p-3.5 text-center font-mono font-semibold">
                                                    <span
                                                        className={
                                                            row.janji_ditepati_persen >=
                                                            80
                                                                ? 'text-emerald-600'
                                                                : 'text-amber-600'
                                                        }
                                                    >
                                                        {
                                                            row.janji_ditepati_persen
                                                        }
                                                        %
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.anggaran_menggantung_total >
                                                    0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-destructive/30 bg-destructive/5 font-mono text-destructive"
                                                        >
                                                            {
                                                                row.anggaran_menggantung_total
                                                            }{' '}
                                                            tiket
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            0
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-center font-mono text-purple-600 dark:text-purple-400">
                                                    {
                                                        row.tingkat_verifikasi_persen
                                                    }
                                                    %
                                                </td>
                                                <td className="p-3.5 pr-4 text-center font-mono">
                                                    <span
                                                        className={
                                                            row.tingkat_sengketa_persen >
                                                            20
                                                                ? 'font-bold text-destructive'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {
                                                            row.tingkat_sengketa_persen
                                                        }
                                                        %
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TooltipProvider>
    );
}

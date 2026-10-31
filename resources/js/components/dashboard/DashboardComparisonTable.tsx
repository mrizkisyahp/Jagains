import { useState, useMemo } from 'react';
import { MatriksKinerjaRow } from '@/types/dashboard';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
            return <ArrowUpDown className="size-3 text-muted-foreground/60 ml-1 inline" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp className="size-3 text-primary ml-1 inline" />
        ) : (
            <ArrowDown className="size-3 text-primary ml-1 inline" />
        );
    };

    return (
        <TooltipProvider>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-caption-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                                <th
                                    onClick={() => handleSort('nama')}
                                    className="p-3.5 pl-4 cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <span>Unit / Wilayah</span>
                                    {renderSortIcon('nama')}
                                </th>
                                <th
                                    onClick={() => handleSort('total_tiket')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <span>Total Tiket</span>
                                    {renderSortIcon('total_tiket')}
                                </th>
                                <th
                                    onClick={() => handleSort('tiket_selesai')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <span>Tiket Selesai</span>
                                    {renderSortIcon('tiket_selesai')}
                                </th>
                                <th
                                    onClick={() => handleSort('median_respons_hk')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Median Respons</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Median selisih hari kerja dari diteruskan hingga direspons pertama (BR-IND-01).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('median_respons_hk')}
                                </th>
                                <th
                                    onClick={() => handleSort('median_selesai_hk')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Waktu Selesai</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Median hari kerja dari diterima dinas hingga pengajuan selesai fisik (BR-IND-02).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('median_selesai_hk')}
                                </th>
                                <th
                                    onClick={() => handleSort('janji_ditepati_persen')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Janji Ditepati</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Persentase penyelesaian fisik paling lambat pada tanggal target awal APBD (BR-IND-03).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('janji_ditepati_persen')}
                                </th>
                                <th
                                    onClick={() => handleSort('anggaran_menggantung_total')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Anggaran Menggantung</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Jumlah tiket terjadwal anggaran yang melampaui tanggal target janji (BR-IND-04).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('anggaran_menggantung_total')}
                                </th>
                                <th
                                    onClick={() => handleSort('tingkat_verifikasi_persen')}
                                    className="p-3.5 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Verifikasi Warga</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Rasio tiket yang disetujui kuorum warga kelurahan (BR-IND-05).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('tingkat_verifikasi_persen')}
                                </th>
                                <th
                                    onClick={() => handleSort('tingkat_sengketa_persen')}
                                    className="p-3.5 pr-4 text-center cursor-pointer hover:text-foreground transition-colors"
                                >
                                    <Tooltip>
                                        <TooltipTrigger className="inline-flex items-center gap-1">
                                            <span>Tingkat Sengketa</span>
                                            <HelpCircle className="size-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Rasio penolakan perbaikan warga yang berlanjut ke sengketa (BR-IND-06).
                                        </TooltipContent>
                                    </Tooltip>
                                    {renderSortIcon('tingkat_sengketa_persen')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {sortedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                        Belum ada data tiket untuk periode yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-3.5 pl-4 font-semibold text-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>{row.nama}</span>
                                                {!row.data_cukup && (
                                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/5 font-medium py-0">
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
                                            <td colSpan={6} className="p-3.5 text-center text-muted-foreground italic text-xs">
                                                Data belum cukup (&lt; {ambangBatas} tiket tertutup) untuk menghitung statistik reliabel
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.median_respons_hk !== null ? `${row.median_respons_hk} HK` : '-'}
                                                </td>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.median_selesai_hk !== null ? `${row.median_selesai_hk} HK` : '-'}
                                                </td>
                                                <td className="p-3.5 text-center font-mono font-semibold">
                                                    <span className={row.janji_ditepati_persen >= 80 ? 'text-emerald-600' : 'text-amber-600'}>
                                                        {row.janji_ditepati_persen}%
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center font-mono">
                                                    {row.anggaran_menggantung_total > 0 ? (
                                                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 font-mono">
                                                            {row.anggaran_menggantung_total} tiket
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">0</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-center font-mono text-purple-600 dark:text-purple-400">
                                                    {row.tingkat_verifikasi_persen}%
                                                </td>
                                                <td className="p-3.5 pr-4 text-center font-mono">
                                                    <span className={row.tingkat_sengketa_persen > 20 ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                                        {row.tingkat_sengketa_persen}%
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

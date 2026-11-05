import { ReactNode, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { PolaPengawasanData } from '@/types/auditor';
import {
    ArrowRight,
    ArrowRightLeft,
    Building2,
    Search,
    X,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AuditorTablePagination from '@/components/auditor/AuditorTablePagination';

interface PolaPengawasanProps {
    analitik: PolaPengawasanData;
}

export default function PolaPengawasanPage({ analitik }: PolaPengawasanProps) {
    const { ringkasan, pengalihan, performa_instansi } = analitik;

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const pageSize = 10;

    const sortedPerforma = useMemo(() => {
        return [...performa_instansi].sort((a, b) => {
            if (b.total_tiket !== a.total_tiket) {
                return b.total_tiket - a.total_tiket;
            }
            return a.nama.localeCompare(b.nama);
        });
    }, [performa_instansi]);

    const filteredPerforma = useMemo(() => {
        if (!searchQuery.trim()) return sortedPerforma;
        const q = searchQuery.toLowerCase().trim();
        return sortedPerforma.filter(
            (item) =>
                item.nama.toLowerCase().includes(q) ||
                (item.singkatan && item.singkatan.toLowerCase().includes(q)),
        );
    }, [sortedPerforma, searchQuery]);

    const paginatedPerforma = useMemo(() => {
        const from = (currentPage - 1) * pageSize;
        return filteredPerforma.slice(from, from + pageSize);
    }, [filteredPerforma, currentPage, pageSize]);

    const kpiMetrics = [
        {
            label: 'Eskalasi aktif terbuka',
            value: ringkasan.eskalasi_aktif,
            description: 'Kasus membutuhkan tindak lanjut sidang',
        },
        {
            label: 'Perintah SLA diterbitkan',
            value: ringkasan.perintah_diterbitkan,
            description: 'Instruksi percepatan resmi dinas',
        },
        {
            label: 'Perbaikan sah diputus',
            value: ringkasan.perbaikan_sah,
            description: 'Status berubah TERTUTUP_AUDITOR',
        },
        {
            label: 'Perintah kerjakan ulang',
            value: ringkasan.perintah_kerja_ulang,
            description: 'Status dikembalikan ke DIKERJAKAN',
        },
    ];

    const getRasioBadgeVariant = (rasio: number) => {
        if (rasio > 30) {
            return 'destructive' as const;
        }
        if (rasio > 10) {
            return 'sla-warn' as const;
        }
        return 'sla-safe' as const;
    };

    return (
        <div className="w-full min-w-0 space-y-6">
            <Head title="Pola pengawasan auditor" />

            {/* Header Konteks */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-display-sm font-display font-semibold tracking-tight text-foreground">
                        Pola Pengawasan & Analitik Kepatuhan
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Pemantauan pola pengalihan tiket antar-instansi
                        (<em>inter-agency bounce</em>), evaluasi rasio sengketa
                        warga, dan riwayat intervensi putusan Auditor
                        Independen.
                    </p>
                </div>
            </div>

            {/* Strip Grid Metrik Kunci (KPI) */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiMetrics.map((metric, idx) => (
                        <div
                            key={metric.label}
                            className={`flex flex-col justify-center gap-1 p-4 sm:p-5 ${
                                idx % 2 === 0
                                    ? 'sm:border-r sm:border-border'
                                    : ''
                            } ${
                                idx < 2
                                    ? 'border-b border-border lg:border-b-0'
                                    : ''
                            } ${
                                idx < 3
                                    ? 'lg:border-r lg:border-border'
                                    : ''
                            }`}
                        >
                            <dt className="text-caption-sm text-muted-foreground">
                                {metric.label}
                            </dt>
                            <dd className="text-display-sm font-display font-semibold tabular-nums text-foreground">
                                {metric.value}
                            </dd>
                            <span className="text-caption-xs text-muted-foreground">
                                {metric.description}
                            </span>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Bagian 1: Tabel Performa & Rasio Sengketa Antar-Instansi */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-body-medium font-semibold text-foreground">
                            Evaluasi Kepatuhan & Rasio Sengketa per Instansi
                        </h3>
                        <p className="mt-0.5 text-caption-sm text-muted-foreground">
                            Indikator komparatif transparansi pekerjaan fisik dan
                            kepatuhan waktu penanganan laporan publik.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Cari instansi atau singkatan..."
                            className="h-8.5 pr-8 pl-8 text-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Hapus pencarian"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-[32%] px-3 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Instansi Pelaksana
                                </TableHead>
                                <TableHead className="w-[13%] px-2 text-right text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                    Tiket Selesai
                                </TableHead>
                                <TableHead className="w-[13%] px-2 text-right text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                    Sengketa Warga
                                </TableHead>
                                <TableHead className="w-[13%] px-2 text-right text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                    Rasio Sengketa
                                </TableHead>
                                <TableHead className="w-[14%] px-2 text-right text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                    Pelanggaran SLA
                                </TableHead>
                                <TableHead className="w-[15%] pr-4 pl-2 text-right text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                    Anggaran Tertahan
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedPerforma.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-12 text-center text-body-sm text-muted-foreground"
                                    >
                                        {searchQuery ? (
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <p>
                                                    Tidak ada instansi yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setCurrentPage(1);
                                                    }}
                                                    className="h-7 text-xs"
                                                >
                                                    Reset pencarian
                                                </Button>
                                            </div>
                                        ) : (
                                            'Belum ada data penanganan tiket fisik tercatat.'
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPerforma.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="border-b border-border transition-colors hover:bg-muted/20"
                                    >
                                        <TableCell className="px-3 min-w-0 font-medium text-foreground">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span
                                                    className="truncate"
                                                    title={item.nama}
                                                >
                                                    {item.nama}
                                                </span>
                                                {item.singkatan && (
                                                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                                        {item.singkatan}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-2 text-right font-mono tabular-nums whitespace-nowrap">
                                            <span className="font-semibold text-foreground">
                                                {item.tiket_selesai}
                                            </span>
                                            <span className="text-muted-foreground">
                                                /{item.total_tiket}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-2 text-right font-mono tabular-nums text-foreground whitespace-nowrap">
                                            {item.tiket_sengketa}
                                        </TableCell>
                                        <TableCell className="px-2 text-right whitespace-nowrap">
                                            <Badge
                                                variant={getRasioBadgeVariant(
                                                    item.rasio_sengketa,
                                                )}
                                                className="font-mono tabular-nums"
                                            >
                                                {item.rasio_sengketa}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-2 text-right font-mono tabular-nums text-destructive whitespace-nowrap">
                                            {item.eskalasi_sla}
                                        </TableCell>
                                        <TableCell className="pr-4 pl-2 text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                                            {item.anggaran_tertahan}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {filteredPerforma.length > 0 && (
                    <AuditorTablePagination
                        currentPage={currentPage}
                        totalItems={filteredPerforma.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        itemName="instansi"
                    />
                )}
            </section>

            {/* Bagian 2: Pola Pengalihan Antar-Instansi (Inter-Agency Bounce) */}
            <section className="overflow-hidden rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="size-4 text-muted-foreground" />
                    <h3 className="text-body-medium font-semibold text-foreground">
                        Matriks Pengalihan Tiket Antar-Instansi (
                        <em>Inter-Agency Bounce</em>)
                    </h3>
                </div>
                <p className="mt-1 text-caption-sm leading-relaxed text-muted-foreground">
                    Mendeteksi instansi asal yang kerap mengalihkan tanggung
                    jawab tiket ke instansi tujuan lain sebagai indikator
                    perlunya evaluasi aturan routing otomatis atau tupoksi.
                </p>

                <div className="mt-4">
                    {pengalihan.length === 0 ? (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-body-sm text-muted-foreground">
                            Belum ada riwayat pengalihan tiket tercatat
                            antar-instansi.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {pengalihan.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 text-caption-sm"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="truncate font-medium text-foreground">
                                            {p.asal}
                                        </span>
                                        <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                                        <span className="truncate font-medium text-foreground">
                                            {p.tujuan}
                                        </span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0 font-mono tabular-nums text-foreground"
                                    >
                                        {p.total} kali
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

PolaPengawasanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Pola pengawasan" breadcrumb="Auditor > Analitik">
        {page}
    </InternalLayout>
);

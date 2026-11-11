import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    Download,
    FileSpreadsheet,
    Printer,
    ChevronLeft,
    ChevronRight,
    Building2,
    Check,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import InstansiTrenKecepatanChart from '@/components/instansi/InstansiTrenKecepatanChart';
import InstansiIndikatorCards from '@/components/instansi/InstansiIndikatorCards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PeringkatInstansiItem {
    peringkat: number;
    id: number;
    nama: string;
    respon_pertama: string;
    penyelesaian_laporan: string;
    janji_ditepati_persen: number;
    laporan_terverifikasi_persen: number;
    anggaran_menggantung_total: number;
    rata_rata_keterlambatan_anggaran: number;
    is_instansi_saya: boolean;
}

interface KualitasKinerjaPageProps {
    periode: '7_hari' | '30_hari' | '90_hari' | 'semua';
    instansi?: {
        id: number;
        nama: string;
        singkatan?: string | null;
    };
    indikator_kinerja: {
        janji_ditepati: {
            persen: number;
            label_tingkat: string;
            tepat_waktu: number;
            terlambat: number;
        };
        persentase_verifikasi: {
            persen: number;
            label_tingkat: string;
            diverifikasi: number;
            ditolak: number;
        };
        anggaran_menggantung: {
            total_tiket: number;
            rata_rata_keterlambatan_hari: number;
        };
    };
    tren_kecepatan: {
        labels: string[];
        median_diterima: number[];
        median_selesai: number[];
    };
    peringkat_instansi: PeringkatInstansiItem[];
}

const PERIODE_OPTIONS = [
    { value: '7_hari', label: '7 Hari Terakhir' },
    { value: '30_hari', label: '30 Hari Terakhir' },
    { value: '90_hari', label: '90 Hari Terakhir' },
    { value: 'semua', label: 'Semua Waktu' },
] as const;

const ITEMS_PER_PAGE = 10;

export default function KualitasKinerjaPage({
    periode,
    instansi,
    indikator_kinerja,
    tren_kecepatan,
    peringkat_instansi,
}: KualitasKinerjaPageProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const activePeriodLabel =
        PERIODE_OPTIONS.find((opt) => opt.value === periode)?.label ||
        '30 Hari Terakhir';

    const handleGantiPeriode = (val: string) => {
        router.get(
            '/instansi/kualitas-kinerja',
            { periode: val },
            { preserveScroll: true, replace: true },
        );
    };

    // Ekspor Laporan CSV
    const handleEksporCSV = () => {
        if (!peringkat_instansi || peringkat_instansi.length === 0) {
            toast.warning('Tidak ada data peringkat untuk diekspor.');
            return;
        }

        const headers = [
            'Peringkat',
            'Instansi',
            'Respon Pertama',
            'Penyelesaian Laporan',
            'Tingkat Janji Ditepati (%)',
            'Laporan Terverifikasi (%)',
            'Anggaran Menggantung (Tiket)',
            'Rata-rata Keterlambatan Anggaran (Hari)',
        ];

        const rows = peringkat_instansi.map((row) => [
            row.peringkat,
            `"${row.nama.replace(/"/g, '""')}"`,
            `"${row.respon_pertama}"`,
            `"${row.penyelesaian_laporan}"`,
            row.janji_ditepati_persen,
            row.laporan_terverifikasi_persen,
            row.anggaran_menggantung_total,
            row.rata_rata_keterlambatan_anggaran,
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `laporan_kualitas_kinerja_${periode}_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(
            'Ekspor Berhasil',
            'Laporan kualitas kinerja berhasil diunduh dalam format CSV.',
        );
    };

    const handleCetak = () => {
        window.print();
    };

    // Paginasi Tabel Peringkat
    const totalPages = Math.max(
        1,
        Math.ceil((peringkat_instansi?.length || 0) / ITEMS_PER_PAGE),
    );

    const paginatedPeringkat = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return (peringkat_instansi || []).slice(start, start + ITEMS_PER_PAGE);
    }, [peringkat_instansi, currentPage]);

    return (
        <InternalLayout
            title="Laporan Kualitas Kinerja"
            breadcrumb="Instansi > Laporan Kualitas Kinerja"
        >
            <Head>
                <title>Laporan Kualitas Kinerja — Jagains</title>
                <meta
                    name="description"
                    content="Laporan analitik kepatuhan SLA, tren kecepatan penanganan laporan, dan peringkat kualitas kinerja instansi teknis."
                />
            </Head>

            <div className="space-y-6 pb-20 sm:space-y-8">
                {/* Bar Kontrol Atas Sesuai Wireframe - 57 */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    {/* Dropdown Filter Periode Sesuai Wireframe: 30 Hari Terakhir v */}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="outline"
                                    className="h-10 w-fit cursor-pointer justify-between gap-2 rounded-xl border-border/80 bg-card px-4 font-semibold text-foreground shadow-2xs hover:bg-muted sm:justify-start"
                                />
                            }
                        >
                            <span>{activePeriodLabel}</span>
                            <ChevronDown className="size-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="w-48 rounded-xl shadow-lg"
                        >
                            {PERIODE_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() =>
                                        handleGantiPeriode(opt.value)
                                    }
                                    className="flex cursor-pointer items-center justify-between py-2 text-body-sm"
                                >
                                    <span>{opt.label}</span>
                                    {periode === opt.value && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Tombol Ekspor Laporan Sesuai Wireframe: Tombol Hitam Kanan */}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button className="h-10 w-fit cursor-pointer gap-2 self-end rounded-xl bg-zinc-950 px-5 font-semibold text-white shadow-md hover:bg-zinc-800 sm:self-auto dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" />
                            }
                        >
                            <Download className="size-4" />
                            <span>Ekspor Laporan</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-52 rounded-xl shadow-lg"
                        >
                            <DropdownMenuItem
                                onClick={handleEksporCSV}
                                className="flex cursor-pointer items-center gap-2.5 py-2.5 text-body-sm"
                            >
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                <span>Unduh Lembar Kerja (.CSV)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleCetak}
                                className="flex cursor-pointer items-center gap-2.5 py-2.5 text-body-sm"
                            >
                                <Printer className="size-4 text-muted-foreground" />
                                <span>Cetak / Simpan PDF</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Seksi 1: Tren Kecepatan Penanganan Sesuai Wireframe */}
                <section>
                    <InstansiTrenKecepatanChart
                        data={tren_kecepatan}
                        labelDiterima="Median Respon Pertama"
                        labelSelesai="Median Penyelesaian Laporan"
                        className="shadow-2xs"
                    />
                </section>

                {/* Seksi 2: 3 Kartu Indikator Kinerja Sesuai Wireframe */}
                <section>
                    <InstansiIndikatorCards
                        janjiDitepati={indikator_kinerja.janji_ditepati}
                        persentaseVerifikasi={
                            indikator_kinerja.persentase_verifikasi
                        }
                        anggaranMenggantung={
                            indikator_kinerja.anggaran_menggantung
                        }
                    />
                </section>

                {/* Seksi 3: Tabel Peringkat Kualitas Kinerja Sesuai Wireframe */}
                <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                    <div className="flex flex-col justify-between gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-body-lg font-display font-bold tracking-tight text-foreground sm:text-xl">
                                Peringkat Kualitas Kinerja
                            </h2>
                            <p className="mt-0.5 text-body-xs text-muted-foreground">
                                Tolok ukur kepatuhan SLA dan perbandingan
                                kinerja pelayanan antar instansi teknis Kota
                                Depok.
                            </p>
                        </div>
                        {instansi && (
                            <div className="flex items-center gap-2 text-caption-xs font-medium text-muted-foreground">
                                <Building2 className="size-3.5" />
                                <span>{instansi.nama}</span>
                            </div>
                        )}
                    </div>

                    {/* Tabel Data */}
                    <div className="-mx-5 overflow-x-auto sm:mx-0">
                        <table className="w-full min-w-[760px] border-collapse text-left text-body-sm">
                            <thead>
                                <tr className="border-b border-border/80 text-caption-xs font-bold tracking-wider text-muted-foreground uppercase">
                                    <th className="w-20 px-4 py-3">
                                        Peringkat
                                    </th>
                                    <th className="px-4 py-3">Instansi</th>
                                    <th className="px-4 py-3">
                                        Respon Pertama
                                    </th>
                                    <th className="px-4 py-3">
                                        Penyelesaian Laporan
                                    </th>
                                    <th className="px-4 py-3">
                                        Tingkat Janji Ditepati
                                    </th>
                                    <th className="px-4 py-3">
                                        Laporan Terverifikasi
                                    </th>
                                    <th className="px-4 py-3">
                                        Anggaran Menggantung
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {paginatedPeringkat.length > 0 ? (
                                    paginatedPeringkat.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={cn(
                                                'transition-colors hover:bg-muted/40',
                                                row.is_instansi_saya &&
                                                    'bg-primary/5 font-medium',
                                            )}
                                        >
                                            <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                                                {row.peringkat}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span>{row.nama}</span>
                                                    {row.is_instansi_saya && (
                                                        <Badge
                                                            variant="outline"
                                                            className="shrink-0 rounded-md border-primary/20 bg-primary/10 px-2 py-0 text-[10px] text-primary"
                                                        >
                                                            Instansi Anda
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                {row.respon_pertama}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                {row.penyelesaian_laporan}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                                                <span
                                                    className={cn(
                                                        row.janji_ditepati_persen >=
                                                            85
                                                            ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                                            : row.janji_ditepati_persen >=
                                                                70
                                                              ? 'text-foreground'
                                                              : 'font-semibold text-amber-600 dark:text-amber-400',
                                                    )}
                                                >
                                                    {row.janji_ditepati_persen}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                                                <span
                                                    className={cn(
                                                        row.laporan_terverifikasi_persen >=
                                                            80
                                                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                                                            : 'text-foreground',
                                                    )}
                                                >
                                                    {
                                                        row.laporan_terverifikasi_persen
                                                    }
                                                    %
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-caption-xs font-mono text-muted-foreground sm:text-body-sm">
                                                <span className="font-semibold text-foreground">
                                                    {
                                                        row.anggaran_menggantung_total
                                                    }{' '}
                                                    Tiket
                                                </span>{' '}
                                                <span className="text-[11px] text-muted-foreground">
                                                    (avg{' '}
                                                    {row.rata_rata_keterlambatan_anggaran.toLocaleString(
                                                        'id-ID',
                                                        {
                                                            minimumFractionDigits: 1,
                                                        },
                                                    )}{' '}
                                                    hr)
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-body-sm text-muted-foreground"
                                        >
                                            Belum ada data rekaman kinerja
                                            instansi untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Sesuai Wireframe - 57: [1] [2] [3] [>] */}
                    {totalPages > 1 && (
                        <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
                            <span className="text-caption-xs text-muted-foreground">
                                Menampilkan{' '}
                                {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                                {Math.min(
                                    currentPage * ITEMS_PER_PAGE,
                                    peringkat_instansi?.length || 0,
                                )}{' '}
                                dari {peringkat_instansi?.length || 0} instansi
                            </span>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
                                    title="Halaman Sebelumnya"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            'flex size-8 cursor-pointer items-center justify-center rounded-lg border text-body-xs font-mono font-semibold transition-all',
                                            currentPage === page
                                                ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-zinc-950'
                                                : 'border-border/80 bg-card text-foreground hover:bg-muted',
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
                                    title="Halaman Berikutnya"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </InternalLayout>
    );
}

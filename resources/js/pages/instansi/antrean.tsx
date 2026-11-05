import { cn } from '@/lib/utils';
import { type ReactNode, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AntreanTiketTable, {
    LaporanItem,
} from '@/components/instansi/AntreanTiketTable';
import AntreanFilterBar from '@/components/instansi/AntreanFilterBar';
import ModalTerimaTiket from '@/components/instansi/ModalTerimaTiket';
import ModalAlihkanTiket from '@/components/instansi/ModalAlihkanTiket';
import ModalKembalikanTiket from '@/components/instansi/ModalKembalikanTiket';
import ModalSurveiSelesai from '@/components/instansi/ModalSurveiSelesai';
import ModalJadwalAnggaran from '@/components/instansi/ModalJadwalAnggaran';
import ModalMulaiPengerjaan from '@/components/instansi/ModalMulaiPengerjaan';
import ModalBeritaAcara from '@/components/instansi/ModalBeritaAcara';
import ModalAjukanSelesai from '@/components/instansi/ModalAjukanSelesai';
import ModalTanggapanResmi from '@/components/instansi/ModalTanggapanResmi';
import ModalUsulanTolak from '@/components/instansi/ModalUsulanTolak';
import ModalRevisiTarget from '@/components/instansi/ModalRevisiTarget';
import ModalResponsSengketa from '@/components/instansi/ModalResponsSengketa';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { antrean as antreanRoute } from '@/routes/instansi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

interface PaginatedAntrean {
    data: LaporanItem[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
}

interface AntreanPageProps {
    antrean: PaginatedAntrean;
    filters: {
        status?: string;
        q?: string;
        kategori_id?: string | number;
        per_page?: string | number;
    };
    ringkasan: {
        semua: number;
        perlu_respons: number;
        survei_anggaran: number;
        pengerjaan: number;
        verifikasi: number;
        sengketa: number;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    instansiList: Array<{ id: number; nama: string; singkatan: string }>;
    instansiSaya?: {
        id: number;
        nama: string;
        singkatan: string;
    } | null;
}

export default function AntreanInstansiPage({
    antrean,
    filters,
    ringkasan,
    kategoriList,
    instansiList,
}: AntreanPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const visitOptions = {
        preserveState: true,
        preserveScroll: true,
        onStart: () => {
            setLoadError(false);
            setIsLoading(true);
        },
        onFinish: () => setIsLoading(false),
        onError: () => setLoadError(true),
        onNetworkError: () => {
            setLoadError(true);
            return false;
        },
    };
    useEffect(() => {
        if (!filters.per_page || filters.status === 'verifikasi') {
            router.get(
                antreanRoute.url(),
                {
                    ...filters,
                    per_page: filters.per_page || 10,
                    page: antrean.current_page,
                    status:
                        filters.status === 'verifikasi'
                            ? 'MENUNGGU_VERIFIKASI'
                            : filters.status,
                },
                { replace: true, preserveState: true, preserveScroll: true },
            );
        }
    }, [filters, antrean.current_page]);

    // State Modal Aksi
    const [selectedTiket, setSelectedTiket] = useState<LaporanItem | null>(
        null,
    );
    const [modalTerimaOpen, setModalTerimaOpen] = useState(false);
    const [modalAlihkanOpen, setModalAlihkanOpen] = useState(false);
    const [modalKembalikanOpen, setModalKembalikanOpen] = useState(false);
    const [modalSurveiOpen, setModalSurveiOpen] = useState(false);
    const [modalAnggaranOpen, setModalAnggaranOpen] = useState(false);
    const [modalMulaiOpen, setModalMulaiOpen] = useState(false);
    const [modalBeritaAcaraOpen, setModalBeritaAcaraOpen] = useState(false);
    const [modalAjukanSelesaiOpen, setModalAjukanSelesaiOpen] = useState(false);
    const [modalTanggapanOpen, setModalTanggapanOpen] = useState(false);
    const [modalUsulTolakOpen, setModalUsulTolakOpen] = useState(false);
    const [modalRevisiTargetOpen, setModalRevisiTargetOpen] = useState(false);
    const [modalResponsSengketaOpen, setModalResponsSengketaOpen] =
        useState(false);

    // Handler Filter Teks / Kategori
    const handleFilterChange = (newFilters: {
        q?: string;
        kategori_id?: string;
        status?: string;
    }) => {
        router.get(
            antreanRoute.url(),
            {
                ...filters,
                ...newFilters,
                page: undefined,
            },
            visitOptions,
        );
    };

    const handleResetFilters = () => {
        router.get(
            antreanRoute.url(),
            { per_page: antrean.per_page },
            { ...visitOptions, preserveState: false },
        );
    };

    // Handler Paginasi
    const handlePageChange = (targetPage: number) => {
        if (
            targetPage < 1 ||
            targetPage > antrean.last_page ||
            targetPage === antrean.current_page
        )
            return;
        router.get(
            antreanRoute.url(),
            {
                ...filters,
                page: targetPage,
            },
            visitOptions,
        );
    };

    const lastPage = Math.max(1, antrean.last_page);
    const pageNumbers = [
        ...new Set([
            1,
            lastPage,
            antrean.current_page - 1,
            antrean.current_page,
            antrean.current_page + 1,
        ]),
    ]
        .filter((page) => page > 0 && page <= lastPage)
        .sort((a, b) => a - b);
    const handlePageSizeChange = (value: string | null) => {
        if (!value) return;
        router.get(
            antreanRoute.url(),
            { ...filters, per_page: Number(value), page: 1 },
            visitOptions,
        );
    };

    // Dispatcher Aksi dari Baris Tabel
    const handleTriggerAksi = (aksi: string, item: LaporanItem) => {
        setSelectedTiket(item);
        switch (aksi) {
            case 'terima':
                setModalTerimaOpen(true);
                break;
            case 'alihkan':
                setModalAlihkanOpen(true);
                break;
            case 'kembalikan':
                setModalKembalikanOpen(true);
                break;
            case 'survei':
                setModalSurveiOpen(true);
                break;
            case 'anggaran':
                setModalAnggaranOpen(true);
                break;
            case 'mulai':
                setModalMulaiOpen(true);
                break;
            case 'berita_acara':
                setModalBeritaAcaraOpen(true);
                break;
            case 'selesai':
                setModalAjukanSelesaiOpen(true);
                break;
            case 'tanggapan':
                setModalTanggapanOpen(true);
                break;
            case 'usul_tolak':
                setModalUsulTolakOpen(true);
                break;
            case 'revisi_target':
                setModalRevisiTargetOpen(true);
                break;
            case 'respons_sengketa':
                setModalResponsSengketaOpen(true);
                break;
        }
    };

    return (
        <div className="flex w-full min-w-0 flex-col gap-5 pb-6">
            <Head title="Antrean tiket" />
            <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-display-sm font-display font-semibold tracking-tight">
                            Antrean tiket
                        </h1>
                        <p className="mt-1 text-body-sm text-muted-foreground">
                            Laporan masuk dari warga yang menunggu untuk ditindaklanjuti oleh instansi Anda.
                        </p>
                    </div>                                     
            </header>
            
            <AntreanFilterBar
                key={filters.q ?? ''}
                filters={filters}
                kategoriList={kategoriList}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                isLoading={isLoading}
            />
            <dl
                className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-3 xl:grid-cols-6"
                aria-label="Ringkasan tiket instansi"
            >
                {(
                    [
                        ['Semua tiket', ringkasan.semua],
                        ['Perlu respons', ringkasan.perlu_respons],
                        ['Survei & anggaran', ringkasan.survei_anggaran],
                        ['Pengerjaan', ringkasan.pengerjaan],
                        ['Verifikasi warga', ringkasan.verifikasi],
                        ['Sengketa & audit', ringkasan.sengketa],
                    ] as const
                ).map(([label, count]) => (
                    <div
                        key={label}
                        className="flex flex-col gap-1 border-r border-b border-border px-4 py-3 last:border-r-0 xl:border-b-0"
                    >
                        <dt className="text-body-sm text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="font-display text-2xl font-semibold text-foreground tabular-nums">
                            {count.toLocaleString('id-ID')}
                        </dd>
                    </div>
                ))}
            </dl>
            {loadError && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Daftar tiket gagal diperbarui. Terapkan kembali filter
                        untuk mencoba lagi.
                    </AlertDescription>
                </Alert>
            )}
            <section
                aria-label="Daftar tiket"
                aria-busy={isLoading}
                className="min-w-0 overflow-hidden rounded-xl border border-border bg-card"
            >
                <AntreanTiketTable
                    items={antrean.data}
                    onAksi={handleTriggerAksi}
                    hasFilters={Boolean(
                        filters.status || filters.q || filters.kategori_id,
                    )}
                    onReset={handleResetFilters}
                />
                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <p className="text-body-sm text-muted-foreground">
                            {antrean.from ?? 0}–{antrean.to ?? 0} dari{' '}
                            <span className="font-medium text-foreground">
                                {antrean.total.toLocaleString('id-ID')}
                            </span>{' '}
                            tiket
                        </p>
                        <Field
                            orientation="horizontal"
                            className="w-auto items-center gap-2"
                        >
                            <FieldLabel
                                htmlFor="jumlah-baris"
                                className="text-body-sm font-normal text-muted-foreground"
                            >
                                Baris per halaman
                            </FieldLabel>
                            <Select
                                value={String(antrean.per_page)}
                                onValueChange={handlePageSizeChange}
                            >
                                <SelectTrigger
                                    id="jumlah-baris"
                                    className="w-20 shadow-none data-[size=default]:h-11 md:data-[size=default]:h-9"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {[
                                            ...new Set([
                                                5,
                                                10,
                                                15,
                                                25,
                                                antrean.per_page,
                                            ]),
                                        ]
                                            .sort((a, b) => a - b)
                                            .map((size) => (
                                                <SelectItem
                                                    key={size}
                                                    value={String(size)}
                                                >
                                                    {size}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <nav
                        aria-label="Halaman antrean tiket"
                        className="flex items-center gap-1"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Halaman pertama"
                            disabled={antrean.current_page <= 1 || isLoading}
                            onClick={() => handlePageChange(1)}
                            className="hidden size-11 sm:inline-flex md:size-9"
                        >
                            <ChevronsLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Halaman sebelumnya"
                            disabled={antrean.current_page <= 1 || isLoading}
                            onClick={() =>
                                handlePageChange(antrean.current_page - 1)
                            }
                            className="size-11 shadow-none md:size-9"
                        >
                            <ChevronLeft />
                        </Button>
                        {pageNumbers.map((page, index) => (
                            <span
                                key={page}
                                className={cn(
                                    'flex items-center gap-1',
                                    Math.abs(page - antrean.current_page) > 1 &&
                                        'hidden sm:flex',
                                )}
                            >
                                {index > 0 &&
                                    page - pageNumbers[index - 1] > 1 && (
                                        <span className="px-1 text-body-sm text-muted-foreground">
                                            …
                                        </span>
                                    )}
                                <Button
                                    variant={
                                        page === antrean.current_page
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    aria-current={
                                        page === antrean.current_page
                                            ? 'page'
                                            : undefined
                                    }
                                    aria-label={`Halaman ${page}`}
                                    disabled={isLoading}
                                    onClick={() => handlePageChange(page)}
                                    className="size-11 p-0 tabular-nums shadow-none md:size-9"
                                >
                                    {page}
                                </Button>
                            </span>
                        ))}
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Halaman berikutnya"
                            disabled={
                                antrean.current_page >= lastPage || isLoading
                            }
                            onClick={() =>
                                handlePageChange(antrean.current_page + 1)
                            }
                            className="size-11 shadow-none md:size-9"
                        >
                            <ChevronRight />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Halaman terakhir"
                            disabled={
                                antrean.current_page >= lastPage || isLoading
                            }
                            onClick={() => handlePageChange(lastPage)}
                            className="hidden size-11 sm:inline-flex md:size-9"
                        >
                            <ChevronsRight />
                        </Button>
                    </nav>
                </footer>
            </section>

            {/* Modal Dialog Aksi-Aksi Operasional */}
            <ModalTerimaTiket
                key={`ModalTerimaTiket-${selectedTiket?.id ?? 'none'}`}
                open={modalTerimaOpen}
                onClose={() => setModalTerimaOpen(false)}
                laporan={selectedTiket}
            />

            <ModalAlihkanTiket
                key={`ModalAlihkanTiket-${selectedTiket?.id ?? 'none'}`}
                open={modalAlihkanOpen}
                onClose={() => setModalAlihkanOpen(false)}
                laporan={selectedTiket}
                instansiList={instansiList}
            />

            <ModalKembalikanTiket
                key={`ModalKembalikanTiket-${selectedTiket?.id ?? 'none'}`}
                open={modalKembalikanOpen}
                onClose={() => setModalKembalikanOpen(false)}
                laporan={selectedTiket}
            />

            <ModalSurveiSelesai
                key={`ModalSurveiSelesai-${selectedTiket?.id ?? 'none'}`}
                open={modalSurveiOpen}
                onClose={() => setModalSurveiOpen(false)}
                laporan={selectedTiket}
            />

            <ModalJadwalAnggaran
                key={`ModalJadwalAnggaran-${selectedTiket?.id ?? 'none'}`}
                open={modalAnggaranOpen}
                onClose={() => setModalAnggaranOpen(false)}
                laporan={selectedTiket}
            />

            <ModalMulaiPengerjaan
                key={`ModalMulaiPengerjaan-${selectedTiket?.id ?? 'none'}`}
                open={modalMulaiOpen}
                onClose={() => setModalMulaiOpen(false)}
                laporan={selectedTiket}
            />

            <ModalBeritaAcara
                key={`ModalBeritaAcara-${selectedTiket?.id ?? 'none'}`}
                open={modalBeritaAcaraOpen}
                onClose={() => setModalBeritaAcaraOpen(false)}
                laporan={selectedTiket}
            />

            <ModalAjukanSelesai
                key={`ModalAjukanSelesai-${selectedTiket?.id ?? 'none'}`}
                open={modalAjukanSelesaiOpen}
                onClose={() => setModalAjukanSelesaiOpen(false)}
                onOpenBeritaAcara={() => {
                    setModalAjukanSelesaiOpen(false);
                    setModalBeritaAcaraOpen(true);
                }}
                laporan={selectedTiket}
            />

            <ModalTanggapanResmi
                key={`ModalTanggapanResmi-${selectedTiket?.id ?? 'none'}`}
                open={modalTanggapanOpen}
                onClose={() => setModalTanggapanOpen(false)}
                laporan={selectedTiket}
            />

            <ModalUsulanTolak
                key={`ModalUsulanTolak-${selectedTiket?.id ?? 'none'}`}
                open={modalUsulTolakOpen}
                onClose={() => setModalUsulTolakOpen(false)}
                laporan={selectedTiket}
            />

            <ModalRevisiTarget
                key={`ModalRevisiTarget-${selectedTiket?.id ?? 'none'}`}
                open={modalRevisiTargetOpen}
                onClose={() => setModalRevisiTargetOpen(false)}
                laporan={selectedTiket}
            />

            <ModalResponsSengketa
                key={`ModalResponsSengketa-${selectedTiket?.id ?? 'none'}`}
                open={modalResponsSengketaOpen}
                onClose={() => setModalResponsSengketaOpen(false)}
                laporan={selectedTiket}
            />
        </div>
    );
}

AntreanInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean tiket" breadcrumb="Instansi">
        {page}
    </InternalLayout>
);

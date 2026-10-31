import { ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AntreanTiketTable, { LaporanItem } from '@/components/instansi/AntreanTiketTable';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Inbox,
    Clock,
    ClipboardCheck,
    Hammer,
    ShieldCheck,
    AlertOctagon,
    ChevronLeft,
    ChevronRight,
    Building2,
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
    instansiSaya,
}: AntreanPageProps) {
    const currentTab = filters.status || 'semua';

    // State Modal Aksi
    const [selectedTiket, setSelectedTiket] = useState<LaporanItem | null>(null);
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
    const [modalResponsSengketaOpen, setModalResponsSengketaOpen] = useState(false);

    // Navigasi Filter Tab
    const handleTabChange = (val: string) => {
        router.get(
            '/instansi/antrean',
            {
                ...filters,
                status: val === 'semua' ? undefined : val,
                page: undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Handler Filter Teks / Kategori
    const handleFilterChange = (newFilters: { q?: string; kategori_id?: string }) => {
        router.get(
            '/instansi/antrean',
            {
                ...filters,
                ...newFilters,
                page: undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        router.get('/instansi/antrean', {}, { preserveState: false });
    };

    // Handler Paginasi
    const handlePageChange = (targetPage: number) => {
        router.get(
            '/instansi/antrean',
            {
                ...filters,
                page: targetPage,
            },
            { preserveState: true, preserveScroll: true }
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
        <div className="w-full space-y-6 pb-12">
            <Head title="Antrean Tiket Instansi" />

            {/* Header & Profil Instansi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Antrean Penanganan Tiket
                    </h1>
                    <p className="text-body-sm text-muted-foreground mt-1">
                        Daftar aduan masyarakat yang didelegasikan ke OPD Anda, diurutkan berdasarkan sisa waktu SLA paling mendesak.
                    </p>
                </div>

                {instansiSaya && (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card shadow-2xs self-start sm:self-auto">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                            <Building2 className="size-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-caption-xs font-semibold text-foreground">{instansiSaya.nama}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">Kode OPD: {instansiSaya.singkatan}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Rekapitulasi Metrik Alur Kerja Instansi */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div
                    onClick={() => handleTabChange('semua')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'semua'
                            ? 'bg-primary/10 border-primary text-primary shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Semua Tiket</span>
                        <Inbox className="size-3.5" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.semua}</p>
                </div>

                <div
                    onClick={() => handleTabChange('perlu_respons')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'perlu_respons'
                            ? 'bg-sky-500/10 border-sky-500 text-sky-700 dark:text-sky-300 shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Perlu Respons</span>
                        <Clock className="size-3.5 text-sky-600" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.perlu_respons}</p>
                </div>

                <div
                    onClick={() => handleTabChange('survei_anggaran')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'survei_anggaran'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Survei & Anggaran</span>
                        <ClipboardCheck className="size-3.5 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.survei_anggaran}</p>
                </div>

                <div
                    onClick={() => handleTabChange('pengerjaan')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'pengerjaan'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Pengerjaan Fisik</span>
                        <Hammer className="size-3.5 text-amber-600" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.pengerjaan}</p>
                </div>

                <div
                    onClick={() => handleTabChange('verifikasi')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'verifikasi'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Verifikasi Warga</span>
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.verifikasi}</p>
                </div>

                <div
                    onClick={() => handleTabChange('sengketa')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentTab === 'sengketa'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-caption-xs font-semibold text-muted-foreground">Sengketa/Revisi</span>
                        <AlertOctagon className="size-3.5 text-rose-600" />
                    </div>
                    <p className="text-xl font-bold font-mono mt-1 text-foreground">{ringkasan.sengketa}</p>
                </div>
            </div>

            {/* Filter Bar Teks & Kategori */}
            <AntreanFilterBar
                filters={filters}
                kategoriList={kategoriList}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />

            {/* Tabel Antrean Tiket */}
            <AntreanTiketTable items={antrean.data} onAksi={handleTriggerAksi} />

            {/* Kontrol Paginasi */}
            {antrean.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-body-sm text-muted-foreground">
                    <p className="text-caption-xs">
                        Menampilkan <span className="font-semibold text-foreground">{antrean.from || 0}</span> s.d.{' '}
                        <span className="font-semibold text-foreground">{antrean.to || 0}</span> dari{' '}
                        <span className="font-semibold text-foreground">{antrean.total}</span> tiket
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={antrean.current_page <= 1}
                            onClick={() => handlePageChange(antrean.current_page - 1)}
                            className="h-8 gap-1 text-caption-xs"
                        >
                            <ChevronLeft className="size-3.5" />
                            Sebelumnya
                        </Button>
                        <span className="text-caption-xs font-mono font-semibold px-2 text-foreground">
                            {antrean.current_page} / {antrean.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={antrean.current_page >= antrean.last_page}
                            onClick={() => handlePageChange(antrean.current_page + 1)}
                            className="h-8 gap-1 text-caption-xs"
                        >
                            Berikutnya
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal Dialog Aksi-Aksi Operasional */}
            <ModalTerimaTiket
                open={modalTerimaOpen}
                onClose={() => setModalTerimaOpen(false)}
                laporan={selectedTiket}
            />

            <ModalAlihkanTiket
                open={modalAlihkanOpen}
                onClose={() => setModalAlihkanOpen(false)}
                laporan={selectedTiket}
                instansiList={instansiList}
            />

            <ModalKembalikanTiket
                open={modalKembalikanOpen}
                onClose={() => setModalKembalikanOpen(false)}
                laporan={selectedTiket}
            />

            <ModalSurveiSelesai
                open={modalSurveiOpen}
                onClose={() => setModalSurveiOpen(false)}
                laporan={selectedTiket}
            />

            <ModalJadwalAnggaran
                open={modalAnggaranOpen}
                onClose={() => setModalAnggaranOpen(false)}
                laporan={selectedTiket}
            />

            <ModalMulaiPengerjaan
                open={modalMulaiOpen}
                onClose={() => setModalMulaiOpen(false)}
                laporan={selectedTiket}
            />

            <ModalBeritaAcara
                open={modalBeritaAcaraOpen}
                onClose={() => setModalBeritaAcaraOpen(false)}
                laporan={selectedTiket}
            />

            <ModalAjukanSelesai
                open={modalAjukanSelesaiOpen}
                onClose={() => setModalAjukanSelesaiOpen(false)}
                laporan={selectedTiket}
            />

            <ModalTanggapanResmi
                open={modalTanggapanOpen}
                onClose={() => setModalTanggapanOpen(false)}
                laporan={selectedTiket}
            />

            <ModalUsulanTolak
                open={modalUsulTolakOpen}
                onClose={() => setModalUsulTolakOpen(false)}
                laporan={selectedTiket}
            />

            <ModalRevisiTarget
                open={modalRevisiTargetOpen}
                onClose={() => setModalRevisiTargetOpen(false)}
                laporan={selectedTiket}
            />

            <ModalResponsSengketa
                open={modalResponsSengketaOpen}
                onClose={() => setModalResponsSengketaOpen(false)}
                laporan={selectedTiket as any}
            />
        </div>
    );
}

AntreanInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean Tiket Instansi" breadcrumb="Instansi > Antrean Tiket">
        {page}
    </InternalLayout>
);

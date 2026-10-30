import { ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    MasterFilterPeta,
    TitikLaporanPeta,
    PetaFilterState,
    KondisiSla,
} from '@/types/peta';
import PetaCanvas from '@/components/peta/PetaCanvas';
import PetaFilterBar from '@/components/peta/PetaFilterBar';
import PetaDrawerList from '@/components/peta/PetaDrawerList';
import TiketQuickSummary from '@/components/peta/TiketQuickSummary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PetaPageProps {
    masterFilter: MasterFilterPeta;
    filterAwal?: {
        kategori_id?: string;
        kecamatan_id?: string;
        kondisi_sla?: string;
        instansi_id?: string;
    };
}

export default function PetaLaporanPage({ masterFilter, filterAwal }: PetaPageProps) {
    const [allTitik, setAllTitik] = useState<TitikLaporanPeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTiket, setSelectedTiket] = useState<TitikLaporanPeta | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<PetaFilterState>({
        kategori_id: filterAwal?.kategori_id ? Number(filterAwal.kategori_id) : null,
        kecamatan_id: filterAwal?.kecamatan_id ? Number(filterAwal.kecamatan_id) : null,
        kondisi_sla: (filterAwal?.kondisi_sla as KondisiSla) || null,
        instansi_id: filterAwal?.instansi_id ? Number(filterAwal.instansi_id) : null,
        rentang_waktu: null,
        search: '',
    });

    // Fetch data sebaran titik dari API publik
    const fetchTitik = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/peta/titik', {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Gagal memuat data sebaran (HTTP ${res.status})`);
            }

            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                setAllTitik(data.data);
            } else {
                throw new Error('Format data tidak sesuai');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menghubungi server');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTitik();
    }, [fetchTitik]);

    // Filter reaktif client-side untuk performa respons < 100ms
    const filteredTitik = useMemo(() => {
        return allTitik.filter((item) => {
            // 1. Filter Kategori
            if (filters.kategori_id !== null && item.kategori_id !== filters.kategori_id) {
                return false;
            }

            // 2. Filter Kecamatan
            if (filters.kecamatan_id !== null && item.kecamatan_id !== filters.kecamatan_id) {
                return false;
            }

            // 3. Filter Kondisi SLA
            if (filters.kondisi_sla !== null && item.kondisi_sla !== filters.kondisi_sla) {
                return false;
            }

            // 4. Filter Instansi
            if (filters.instansi_id !== null && item.instansi_id !== filters.instansi_id) {
                return false;
            }

            // 5. Filter Rentang Waktu (hari)
            if (filters.rentang_waktu !== null) {
                const createdAt = new Date(item.created_at).getTime();
                const batasWaktu = Date.now() - filters.rentang_waktu * 24 * 60 * 60 * 1000;
                if (createdAt < batasWaktu) {
                    return false;
                }
            }

            // 6. Pencarian Teks
            if (filters.search.trim() !== '') {
                const query = filters.search.toLowerCase();
                const matchNomor = item.nomor_tiket.toLowerCase().includes(query);
                const matchJudul = item.judul.toLowerCase().includes(query);
                const matchKelurahan = item.kelurahan_nama.toLowerCase().includes(query);
                if (!matchNomor && !matchJudul && !matchKelurahan) {
                    return false;
                }
            }

            return true;
        });
    }, [allTitik, filters]);

    const handleResetFilter = () => {
        setFilters({
            kategori_id: null,
            kecamatan_id: null,
            kondisi_sla: null,
            instansi_id: null,
            rentang_waktu: null,
            search: '',
        });
    };

    return (
        <>
            <Head title="Peta Laporan Fasilitas Publik" />

            <div className="w-full space-y-4 pb-8">
                {/* Header Halaman (Proporsional sesuai panduan desain) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                            Peta Laporan Fasilitas Publik
                        </h1>
                        <p className="text-body-sm text-muted-foreground mt-1">
                            Peta interaktif sebaran laporan kerusakan fasilitas publik di Kota Depok dengan indikator batas waktu SLA dan status tindak lanjut.
                        </p>
                    </div>

                    {/* Ringkasan Statistik Singkat */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="px-3 py-1.5 bg-muted/60 rounded-xl border border-border text-center">
                            <span className="block text-[11px] text-muted-foreground font-medium">Laporan Aktif</span>
                            <span className="font-mono text-body-sm font-bold text-foreground">
                                {masterFilter?.statistik?.laporan_aktif ?? 0}
                            </span>
                        </div>
                        <div className="px-3 py-1.5 bg-muted/60 rounded-xl border border-border text-center">
                            <span className="block text-[11px] text-muted-foreground font-medium">Telah Selesai</span>
                            <span className="font-mono text-body-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {masterFilter?.statistik?.laporan_selesai ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* State Error & Retry Button */}
                {error && (
                    <Alert variant="destructive" className="rounded-2xl">
                        <AlertTriangle className="size-4" />
                        <AlertDescription className="flex items-center justify-between text-body-sm">
                            <span>{error}. Data gagal dimuat.</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchTitik}
                                className="h-8 gap-1.5 text-caption-xs font-semibold rounded-lg"
                            >
                                <RefreshCw className="size-3.5" />
                                Coba Lagi
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bilah Filter Multi-Kriteria (Floating Bar) */}
                {masterFilter && (
                    <PetaFilterBar
                        filters={filters}
                        onFilterChange={setFilters}
                        masterFilter={masterFilter}
                        totalFiltered={filteredTitik.length}
                        onReset={handleResetFilter}
                        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
                        isDrawerOpen={isDrawerOpen}
                    />
                )}

                {/* Kontainer Peta Utama */}
                <div className="relative w-full h-[620px] lg:h-[700px] overflow-hidden rounded-2xl shadow-sm">
                    <PetaCanvas
                        titikList={filteredTitik}
                        selectedTiket={selectedTiket}
                        onSelectTiket={setSelectedTiket}
                        isLoading={isLoading}
                    />

                    {/* Drawer Daftar Tiket Laporan (Slide-in) */}
                    <PetaDrawerList
                        titikList={filteredTitik}
                        selectedTiket={selectedTiket}
                        onSelectTiket={(tiket) => {
                            setSelectedTiket(tiket);
                        }}
                        onClose={() => setIsDrawerOpen(false)}
                        isOpen={isDrawerOpen}
                        onResetFilter={handleResetFilter}
                    />

                    {/* Quick Summary Card / Sheet */}
                    <TiketQuickSummary
                        tiket={selectedTiket}
                        onClose={() => setSelectedTiket(null)}
                    />
                </div>
            </div>
        </>
    );
}

PetaLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Peta Laporan Fasilitas" breadcrumb="Warga > Peta Laporan">
        {page}
    </InternalLayout>
);

import { ReactNode, useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    MasterFilterPeta,
    TitikLaporanPeta,
    PetaFilterState,
    KondisiSla,
} from '@/types/peta';
import PetaDrawerList from '@/components/peta/PetaDrawerList';
import TiketQuickSummary from '@/components/peta/TiketQuickSummary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const PetaCanvas = lazy(() => import('@/components/peta/PetaCanvas'));
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PetaPageProps {
    masterFilter: MasterFilterPeta;
    filterAwal?: {
        kategori_id?: string;
        kecamatan_id?: string;
        kota_id?: string;
        status?: string;
        kondisi_sla?: string;
        instansi_id?: string;
    };
}

export default function PetaLaporanPage({ masterFilter, filterAwal }: PetaPageProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [allTitik, setAllTitik] = useState<TitikLaporanPeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTiket, setSelectedTiket] = useState<TitikLaporanPeta | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Filter State
    const [filters, setFilters] = useState<PetaFilterState>({
        kategori_id: filterAwal?.kategori_id ? Number(filterAwal.kategori_id) : null,
        kecamatan_id: filterAwal?.kecamatan_id ? Number(filterAwal.kecamatan_id) : null,
        kota_id: filterAwal?.kota_id ? Number(filterAwal.kota_id) : null,
        status: filterAwal?.status || null,
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

    // Tangani parameter fokus tiket dari URL (?fokus={nomor_tiket})
    useEffect(() => {
        if (allTitik.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const fokusTiket = urlParams.get('fokus');
            if (fokusTiket) {
                const target = allTitik.find(
                    (t) => t.nomor_tiket.toUpperCase() === fokusTiket.toUpperCase(),
                );
                if (target) {
                    setSelectedTiket(target);
                }
            }
        }
    }, [allTitik]);

    // Filter reaktif client-side untuk performa respons < 100ms
    const filteredTitik = useMemo(() => {
        return allTitik.filter((item) => {
            // 1. Filter Kategori
            if (filters.kategori_id !== null && item.kategori_id !== filters.kategori_id) {
                return false;
            }

            // 2. Filter Kota
            if (filters.kota_id && item.kota_id !== filters.kota_id) {
                return false;
            }

            // 3. Filter Kecamatan
            if (filters.kecamatan_id !== null && item.kecamatan_id !== filters.kecamatan_id) {
                return false;
            }

            // 4. Filter Status
            if (filters.status && item.status !== filters.status) {
                return false;
            }

            // 5. Filter Kondisi SLA
            if (filters.kondisi_sla !== null && item.kondisi_sla !== filters.kondisi_sla) {
                return false;
            }

            // 6. Filter Instansi
            if (filters.instansi_id !== null && item.instansi_id !== filters.instansi_id) {
                return false;
            }

            // 7. Filter Rentang Waktu (hari)
            if (filters.rentang_waktu !== null) {
                const createdAt = new Date(item.created_at).getTime();
                const batasWaktu = Date.now() - filters.rentang_waktu * 24 * 60 * 60 * 1000;
                if (createdAt < batasWaktu) {
                    return false;
                }
            }

            // 8. Pencarian Teks
            if (filters.search.trim() !== '') {
                const query = filters.search.toLowerCase();
                const matchNomor = item.nomor_tiket.toLowerCase().includes(query);
                const matchJudul = item.judul.toLowerCase().includes(query);
                const matchKelurahan = item.kelurahan_nama?.toLowerCase().includes(query);
                const matchKecamatan = item.kecamatan_nama?.toLowerCase().includes(query);
                const matchKota = item.kota_nama?.toLowerCase().includes(query);
                if (!matchNomor && !matchJudul && !matchKelurahan && !matchKecamatan && !matchKota) {
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
            kota_id: null,
            status: null,
            kondisi_sla: null,
            instansi_id: null,
            rentang_waktu: null,
            search: '',
        });
    };

    const handleSelectTiket = (tiket: TitikLaporanPeta | null) => {
        setSelectedTiket(tiket);
    };

    return (
        <InternalLayout title="Eksplorasi" breadcrumb="Warga > Eksplorasi" fullWidth noPadding>
            <Head title="Eksplorasi - Jagains" />

            <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
                {/* State Error & Retry Button Floating Alert */}
                {error && (
                    <div className="absolute top-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
                        <Alert variant="destructive" className="rounded-xl shadow-lg">
                            <AlertTriangle className="size-4" />
                            <AlertDescription className="flex items-center justify-between text-caption-xs sm:text-body-sm">
                                <span>{error}. Data gagal dimuat.</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchTitik}
                                    className="h-7 gap-1 rounded-lg text-caption-xs font-semibold"
                                >
                                    <RefreshCw className="size-3" />
                                    Coba Lagi
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Kontainer Peta Interaktif Utama */}
                {isMounted ? (
                    <Suspense
                        fallback={
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                                <RefreshCw className="size-6 animate-spin text-primary" />
                                <span className="text-body-sm font-medium">Memuat peta interaktif...</span>
                            </div>
                        }
                    >
                        <PetaCanvas
                            titikList={filteredTitik}
                            selectedTiket={selectedTiket}
                            onSelectTiket={handleSelectTiket}
                            isLoading={isLoading}
                            className="h-full w-full rounded-none border-none shadow-none"
                        />
                    </Suspense>
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                        <RefreshCw className="size-6 animate-spin text-primary" />
                        <span className="text-body-sm font-medium">Memuat peta interaktif...</span>
                    </div>
                )}

                {/* Sliding Drawer List Laporan & Filter (Left to Right) */}
                <PetaDrawerList
                    titikList={filteredTitik}
                    selectedTiket={selectedTiket}
                    onSelectTiket={handleSelectTiket}
                    onClose={() => setIsDrawerOpen(false)}
                    onToggle={() => setIsDrawerOpen((prev) => !prev)}
                    isOpen={isDrawerOpen}
                    filters={filters}
                    onFilterChange={setFilters}
                    masterFilter={masterFilter}
                    onResetFilter={handleResetFilter}
                />

                {/* Quick Summary Floating Card on Map */}
                <TiketQuickSummary
                    tiket={selectedTiket}
                    onClose={() => setSelectedTiket(null)}
                />
            </div>
        </InternalLayout>
    );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MasterFilterPeta, TitikLaporanPeta, PetaFilterState, KondisiSla } from '@/types/peta';
import PetaCanvas from '@/components/peta/PetaCanvas';
import PetaFilterBar from '@/components/peta/PetaFilterBar';
import PetaDrawerList from '@/components/peta/PetaDrawerList';
import TiketQuickSummary from '@/components/peta/TiketQuickSummary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface PetaSectionProps {
    masterFilter: MasterFilterPeta;
}

export default function PetaSection({ masterFilter }: PetaSectionProps) {
    const [allTitik, setAllTitik] = useState<TitikLaporanPeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTiket, setSelectedTiket] = useState<TitikLaporanPeta | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<PetaFilterState>({
        kategori_id: null,
        kecamatan_id: null,
        kondisi_sla: null,
        instansi_id: null,
        rentang_waktu: null,
        search: '',
    });

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

    // Filter reaktif client-side
    const filteredTitik = useMemo(() => {
        return allTitik.filter((item) => {
            if (filters.kategori_id !== null && item.kategori_id !== filters.kategori_id) {
                return false;
            }
            if (filters.kecamatan_id !== null && item.kecamatan_id !== filters.kecamatan_id) {
                return false;
            }
            if (filters.kondisi_sla !== null && item.kondisi_sla !== filters.kondisi_sla) {
                return false;
            }
            if (filters.instansi_id !== null && item.instansi_id !== filters.instansi_id) {
                return false;
            }
            if (filters.rentang_waktu !== null) {
                const createdAt = new Date(item.created_at).getTime();
                const batasWaktu = Date.now() - filters.rentang_waktu * 24 * 60 * 60 * 1000;
                if (createdAt < batasWaktu) {
                    return false;
                }
            }
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
        <section id="sebaran-peta" className="py-20 sm:py-28 bg-muted/30 border-t border-border/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
                {/* Header Seksi Sesuai Wireframe Mockup */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-caption-xs font-semibold text-primary border border-primary/20">
                            <Layers className="size-3.5" />
                            <span>Peta Sebaran Laporan Publik</span>
                        </div>

                        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                            Lihat apa yang dilaporkan di sekitar Anda.
                        </h2>

                        <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed">
                            Siapa saja bisa melihat. Penanda dibedakan oleh bentuk isi dan teks status, bukan warna saja.
                        </p>
                    </div>

                    {/* Ringkasan Jumlah Tiket Aktif & Selesai */}
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
                        <div className="px-4 py-2 bg-card rounded-2xl border border-border shadow-xs text-center">
                            <span className="block text-caption-xs text-muted-foreground font-medium">Laporan Aktif</span>
                            <span className="font-mono text-lg font-bold text-foreground">
                                {masterFilter?.statistik?.laporan_aktif ?? 0}
                            </span>
                        </div>
                        <div className="px-4 py-2 bg-card rounded-2xl border border-border shadow-xs text-center">
                            <span className="block text-caption-xs text-muted-foreground font-medium">Selesai Diverifikasi</span>
                            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {masterFilter?.statistik?.laporan_selesai ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* State Error & Retry */}
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

                {/* Bilah Filter Multi-Kriteria */}
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

                {/* Kanvas Peta Interaktif Leaflet + Clustering */}
                <div className="relative w-full h-[620px] lg:h-[720px] overflow-hidden rounded-3xl shadow-md border border-border">
                    <PetaCanvas
                        titikList={filteredTitik}
                        selectedTiket={selectedTiket}
                        onSelectTiket={setSelectedTiket}
                        isLoading={isLoading}
                    />

                    {/* Drawer Daftar Tiket Laporan */}
                    <PetaDrawerList
                        titikList={filteredTitik}
                        selectedTiket={selectedTiket}
                        onSelectTiket={(tiket) => setSelectedTiket(tiket)}
                        onClose={() => setIsDrawerOpen(false)}
                        isOpen={isDrawerOpen}
                        onResetFilter={handleResetFilter}
                    />

                    {/* Quick Summary Card / Bottom Sheet */}
                    <TiketQuickSummary
                        tiket={selectedTiket}
                        onClose={() => setSelectedTiket(null)}
                    />
                </div>
            </div>
        </section>
    );
}

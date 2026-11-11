import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    lazy,
    Suspense,
} from 'react';
import {
    MasterFilterPeta,
    TitikLaporanPeta,
    PetaFilterState,
    KondisiSla,
} from '@/types/peta';
import TiketQuickSummary from '@/components/peta/TiketQuickSummary';

const PetaCanvas = lazy(() => import('@/components/peta/PetaCanvas'));
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeroSectionProps {
    masterFilter?: MasterFilterPeta;
}

export default function HeroSection({ masterFilter }: HeroSectionProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [allTitik, setAllTitik] = useState<TitikLaporanPeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTiket, setSelectedTiket] = useState<TitikLaporanPeta | null>(
        null,
    );
    const [masterFilterData, setMasterFilterData] = useState<
        MasterFilterPeta | undefined
    >(masterFilter);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Ambil master filter dari API jika belum tersedia dari prop Inertia
    useEffect(() => {
        if (
            masterFilter &&
            (masterFilter.kecamatan?.length > 0 ||
                masterFilter.kategori?.length > 0)
        ) {
            setMasterFilterData(masterFilter);
        } else {
            fetch('/api/peta/master-filter', {
                headers: {
                    Accept: 'application/json',
                },
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then((resJson) => {
                    if (resJson.status === 'success' && resJson.data) {
                        setMasterFilterData(resJson.data);
                    }
                })
                .catch((err) => {
                    console.error('Gagal mengambil master filter:', err);
                });
        }
    }, [masterFilter]);

    const kecamatanList = masterFilterData?.kecamatan ?? [];
    const kategoriList = masterFilterData?.kategori ?? [];

    // State Filter Minimalis
    const [filters, setFilters] = useState<PetaFilterState>({
        kategori_id: null,
        kecamatan_id: null,
        kota_id: null,
        status: null,
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
                throw new Error(
                    `Gagal memuat data sebaran (HTTP ${res.status})`,
                );
            }

            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                setAllTitik(data.data);
            } else {
                throw new Error('Format data tidak sesuai');
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Gagal menghubungi server',
            );
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
                    (t) =>
                        t.nomor_tiket.toUpperCase() ===
                        fokusTiket.toUpperCase(),
                );
                if (target) {
                    setSelectedTiket(target);
                }
            }
        }
    }, [allTitik]);

    // Filter reaktif client-side
    const filteredTitik = useMemo(() => {
        return allTitik.filter((item) => {
            if (
                filters.kategori_id !== null &&
                item.kategori_id !== filters.kategori_id
            ) {
                return false;
            }
            if (
                filters.kecamatan_id !== null &&
                item.kecamatan_id !== filters.kecamatan_id
            ) {
                return false;
            }
            if (
                filters.kondisi_sla !== null &&
                item.kondisi_sla !== filters.kondisi_sla
            ) {
                return false;
            }
            if (
                filters.instansi_id !== null &&
                item.instansi_id !== filters.instansi_id
            ) {
                return false;
            }
            if (filters.rentang_waktu !== null) {
                const createdAt = new Date(item.created_at).getTime();
                const batasWaktu =
                    Date.now() - filters.rentang_waktu * 24 * 60 * 60 * 1000;
                if (createdAt < batasWaktu) {
                    return false;
                }
            }
            if (filters.search.trim() !== '') {
                const query = filters.search.toLowerCase();
                const matchNomor = item.nomor_tiket
                    .toLowerCase()
                    .includes(query);
                const matchJudul = item.judul.toLowerCase().includes(query);
                const matchKelurahan = item.kelurahan_nama
                    .toLowerCase()
                    .includes(query);
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
            kota_id: null,
            status: null,
            kondisi_sla: null,
            instansi_id: null,
            rentang_waktu: null,
            search: '',
        });
    };

    const hasActiveFilters =
        filters.kategori_id !== null ||
        filters.kecamatan_id !== null ||
        filters.kondisi_sla !== null ||
        filters.search.trim() !== '';

    return (
        <section
            id="sebaran-peta"
            className="relative w-full overflow-hidden bg-background"
        >
            {/* Kanvas Peta Interaktif Leaflet (Full 1 Canvas, Edge-to-Edge tanpa rounded) */}
            <div className="relative h-[680px] w-full overflow-hidden bg-muted/40 sm:h-[760px] lg:h-[840px]">
                {isMounted ? (
                    <Suspense
                        fallback={
                            <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                                <span className="text-body-small font-medium">
                                    Memuat peta sebaran...
                                </span>
                            </div>
                        }
                    >
                        <PetaCanvas
                            titikList={filteredTitik}
                            selectedTiket={selectedTiket}
                            onSelectTiket={setSelectedTiket}
                            isLoading={isLoading}
                            className="h-full w-full rounded-none border-none shadow-none"
                        />
                    </Suspense>
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                        <span className="text-body-small font-medium">
                            Memuat peta sebaran...
                        </span>
                    </div>
                )}

                {/* Container Atas dengan Gradasi Putih/Background Menipis ke Bawah */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center bg-gradient-to-b from-background via-background/90 to-transparent pt-8 pb-20 sm:pt-12 sm:pb-32 md:pt-14">
                    <div className="pointer-events-auto mx-auto w-full max-w-4xl px-4 text-center">
                        {/* Heading Sesuai Referensi Gambar */}
                        <h1 className="font-display text-4xl leading-[1.12] font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
                            Lapor. Pantau. Pastikan.
                        </h1>

                        {/* Subtitle Sesuai Referensi Gambar */}
                        <p className="sm:text-body-large mx-auto mt-3.5 max-w-2xl text-body-base leading-relaxed text-muted-foreground sm:mt-4">
                            Laporkan masalah di sekitarmu, pantau janji instansi
                            secara terbuka, dan pastikan sendiri hasilnya
                            bersama warga.
                        </p>

                        {/* Bilah Filter Minimalis Berbentuk Capsule Melayang */}
                        <div className="mx-auto mt-6 flex w-full max-w-2xl items-center justify-between gap-1 rounded-full border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md sm:mt-8 sm:gap-2 sm:p-2.5">
                            {/* 1. Filter Wilayah / Kecamatan */}
                            <div className="min-w-0 flex-1 px-3 py-1 text-left sm:px-4">
                                <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Wilayah
                                </label>
                                <Select
                                    value={
                                        filters.kecamatan_id !== null
                                            ? String(filters.kecamatan_id)
                                            : 'semua'
                                    }
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kecamatan_id:
                                                val === 'semua'
                                                    ? null
                                                    : Number(val),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-6 w-full cursor-pointer gap-1 border-0 bg-transparent p-0 text-caption-xs font-semibold text-foreground shadow-none focus:ring-0 sm:text-body-sm">
                                        <span className="truncate">
                                            {filters.kecamatan_id !== null
                                                ? kecamatanList.find(
                                                      (k) =>
                                                          k.id ===
                                                          filters.kecamatan_id,
                                                  )?.nama || 'Kecamatan'
                                                : 'Semua Wilayah'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="z-[1050] max-h-60 min-w-[200px] rounded-xl">
                                        <SelectItem
                                            value="semua"
                                            className="text-body-sm font-medium"
                                        >
                                            Semua Wilayah
                                        </SelectItem>
                                        {kecamatanList.map((kec) => (
                                            <SelectItem
                                                key={kec.id}
                                                value={String(kec.id)}
                                                className="text-body-sm"
                                            >
                                                {kec.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-7 w-px shrink-0 bg-border/80" />

                            {/* 2. Filter Kategori */}
                            <div className="min-w-0 flex-1 px-3 py-1 text-left sm:px-4">
                                <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Kategori
                                </label>
                                <Select
                                    value={
                                        filters.kategori_id !== null
                                            ? String(filters.kategori_id)
                                            : 'semua'
                                    }
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kategori_id:
                                                val === 'semua'
                                                    ? null
                                                    : Number(val),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-6 w-full cursor-pointer gap-1 border-0 bg-transparent p-0 text-caption-xs font-semibold text-foreground shadow-none focus:ring-0 sm:text-body-sm">
                                        <span className="truncate">
                                            {filters.kategori_id !== null
                                                ? kategoriList.find(
                                                      (k) =>
                                                          k.id ===
                                                          filters.kategori_id,
                                                  )?.nama || 'Kategori'
                                                : 'Semua Kategori'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="z-[1050] max-h-60 min-w-[200px] rounded-xl">
                                        <SelectItem
                                            value="semua"
                                            className="text-body-sm font-medium"
                                        >
                                            Semua Kategori
                                        </SelectItem>
                                        {kategoriList.map((kat) => (
                                            <SelectItem
                                                key={kat.id}
                                                value={String(kat.id)}
                                                className="text-body-sm"
                                            >
                                                {kat.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-7 w-px shrink-0 bg-border/80" />

                            {/* 3. Filter Kondisi SLA (Bersih tanpa icon warna) */}
                            <div className="min-w-0 flex-1 px-3 py-1 text-left sm:px-4">
                                <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Kondisi SLA
                                </label>
                                <Select
                                    value={filters.kondisi_sla ?? 'semua'}
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kondisi_sla:
                                                val === 'semua'
                                                    ? null
                                                    : (val as KondisiSla),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-6 w-full cursor-pointer gap-1 border-0 bg-transparent p-0 text-caption-xs font-semibold text-foreground shadow-none focus:ring-0 sm:text-body-sm">
                                        <span className="truncate">
                                            {filters.kondisi_sla === 'dalam_sla'
                                                ? 'Aman SLA'
                                                : filters.kondisi_sla ===
                                                    'hampir_lewat'
                                                  ? 'Mendekati Batas'
                                                  : filters.kondisi_sla ===
                                                      'lewat_sla'
                                                    ? 'Lewat SLA'
                                                    : filters.kondisi_sla ===
                                                        'menunggu_warga'
                                                      ? 'Menunggu Verifikasi'
                                                      : filters.kondisi_sla ===
                                                          'selesai'
                                                        ? 'Selesai'
                                                        : 'Semua Status'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="z-[1050] max-h-60 min-w-[200px] rounded-xl">
                                        <SelectItem
                                            value="semua"
                                            className="text-body-sm font-medium"
                                        >
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem
                                            value="dalam_sla"
                                            className="text-body-sm"
                                        >
                                            Aman Dalam SLA
                                        </SelectItem>
                                        <SelectItem
                                            value="hampir_lewat"
                                            className="text-body-sm"
                                        >
                                            Mendekati Batas SLA
                                        </SelectItem>
                                        <SelectItem
                                            value="lewat_sla"
                                            className="text-body-sm"
                                        >
                                            Lewat Batas Waktu SLA
                                        </SelectItem>
                                        <SelectItem
                                            value="menunggu_warga"
                                            className="text-body-sm"
                                        >
                                            Menunggu Verifikasi Warga
                                        </SelectItem>
                                        <SelectItem
                                            value="selesai"
                                            className="text-body-sm"
                                        >
                                            Selesai Diverifikasi
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tombol Aksi: Reset & Search */}
                            <div className="flex shrink-0 items-center gap-1.5 pl-1">
                                {hasActiveFilters && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleResetFilter}
                                        className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                                        title="Reset Filter"
                                    >
                                        <RotateCcw className="size-4" />
                                    </Button>
                                )}
                                <div
                                    className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm select-none"
                                    title="Pencarian Aktif"
                                >
                                    <Search className="size-4.5" />
                                </div>
                            </div>
                        </div>

                        {/* Banner Kesalahan jika fetch titik gagal */}
                        {error && (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-1.5 text-caption-xs text-destructive">
                                <AlertTriangle className="size-3.5" />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={fetchTitik}
                                    className="ml-1 flex cursor-pointer items-center gap-1 font-semibold underline"
                                >
                                    <RefreshCw className="size-3" /> Coba Lagi
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Quick Summary Card saat marker dipilih */}
                <TiketQuickSummary
                    tiket={selectedTiket}
                    onClose={() => setSelectedTiket(null)}
                />
            </div>
        </section>
    );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MasterFilterPeta,
    TitikLaporanPeta,
    PetaFilterState,
    KondisiSla,
} from '@/types/peta';
import PetaCanvas from '@/components/peta/PetaCanvas';
import PetaDrawerList from '@/components/peta/PetaDrawerList';
import TiketQuickSummary from '@/components/peta/TiketQuickSummary';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, List, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeroSectionProps {
    masterFilter?: MasterFilterPeta;
}

export default function HeroSection({ masterFilter }: HeroSectionProps) {
    const [allTitik, setAllTitik] = useState<TitikLaporanPeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTiket, setSelectedTiket] = useState<TitikLaporanPeta | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // State Filter Minimalis
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

    // Tangani parameter fokus tiket dari URL (?fokus={nomor_tiket})
    useEffect(() => {
        if (allTitik.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const fokusTiket = urlParams.get('fokus');
            if (fokusTiket) {
                const target = allTitik.find(
                    (t) => t.nomor_tiket.toUpperCase() === fokusTiket.toUpperCase()
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

    const hasActiveFilters =
        filters.kategori_id !== null ||
        filters.kecamatan_id !== null ||
        filters.kondisi_sla !== null ||
        filters.search.trim() !== '';

    return (
        <section id="sebaran-peta" className="relative w-full overflow-hidden bg-background">
            {/* Kanvas Peta Interaktif Leaflet (Full 1 Canvas, Edge-to-Edge tanpa rounded) */}
            <div className="relative w-full h-[680px] sm:h-[760px] lg:h-[840px] overflow-hidden">
                <PetaCanvas
                    titikList={filteredTitik}
                    selectedTiket={selectedTiket}
                    onSelectTiket={setSelectedTiket}
                    isLoading={isLoading}
                    className="w-full h-full rounded-none border-none shadow-none"
                />

                {/* Container Atas dengan Gradasi Putih/Background Menipis ke Bawah */}
                <div className="absolute inset-x-0 top-0 z-20 pointer-events-none flex flex-col items-center pt-8 sm:pt-12 md:pt-14 pb-20 sm:pb-32 bg-gradient-to-b from-background via-background/90 to-transparent">
                    <div className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto">
                        {/* Heading Sesuai Referensi Gambar */}
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                            Lapor. Pantau. Pastikan.
                        </h1>

                        {/* Subtitle Sesuai Referensi Gambar */}
                        <p className="mt-3.5 sm:mt-4 text-body-base sm:text-body-large text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Laporkan masalah di sekitarmu, pantau janji instansi secara terbuka, dan pastikan sendiri hasilnya bersama warga.
                        </p>

                        {/* Bilah Filter Minimalis Berbentuk Capsule Melayang */}
                        <div className="mt-6 sm:mt-8 mx-auto w-full max-w-2xl rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl p-2 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2">
                            {/* 1. Filter Wilayah / Kecamatan */}
                            <div className="flex-1 min-w-0 px-3 sm:px-4 py-1 text-left">
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Wilayah
                                </label>
                                <Select
                                    value={filters.kecamatan_id ? String(filters.kecamatan_id) : 'semua'}
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kecamatan_id: val === 'semua' ? null : Number(val),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full h-6 border-0 shadow-none bg-transparent p-0 text-caption-xs sm:text-body-sm font-semibold text-foreground focus:ring-0 gap-1 cursor-pointer">
                                        <span className="truncate">
                                            {filters.kecamatan_id
                                                ? masterFilter?.kecamatan?.find((k) => k.id === filters.kecamatan_id)?.nama || 'Kecamatan'
                                                : 'Semua Wilayah'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 rounded-xl">
                                        <SelectItem value="semua" className="text-body-sm font-medium">
                                            Semua Wilayah
                                        </SelectItem>
                                        {masterFilter?.kecamatan?.map((kec) => (
                                            <SelectItem key={kec.id} value={String(kec.id)} className="text-body-sm">
                                                {kec.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-7 w-px bg-border/80 shrink-0" />

                            {/* 2. Filter Kategori */}
                            <div className="flex-1 min-w-0 px-3 sm:px-4 py-1 text-left">
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Kategori
                                </label>
                                <Select
                                    value={filters.kategori_id ? String(filters.kategori_id) : 'semua'}
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kategori_id: val === 'semua' ? null : Number(val),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full h-6 border-0 shadow-none bg-transparent p-0 text-caption-xs sm:text-body-sm font-semibold text-foreground focus:ring-0 gap-1 cursor-pointer">
                                        <span className="truncate">
                                            {filters.kategori_id
                                                ? masterFilter?.kategori?.find((k) => k.id === filters.kategori_id)?.nama || 'Kategori'
                                                : 'Semua Kategori'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 rounded-xl">
                                        <SelectItem value="semua" className="text-body-sm font-medium">
                                            Semua Kategori
                                        </SelectItem>
                                        {masterFilter?.kategori?.map((kat) => (
                                            <SelectItem key={kat.id} value={String(kat.id)} className="text-body-sm">
                                                {kat.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-7 w-px bg-border/80 shrink-0" />

                            {/* 3. Filter Kondisi SLA */}
                            <div className="flex-1 min-w-0 px-3 sm:px-4 py-1 text-left">
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Kondisi SLA
                                </label>
                                <Select
                                    value={filters.kondisi_sla ?? 'semua'}
                                    onValueChange={(val) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            kondisi_sla: val === 'semua' ? null : (val as KondisiSla),
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full h-6 border-0 shadow-none bg-transparent p-0 text-caption-xs sm:text-body-sm font-semibold text-foreground focus:ring-0 gap-1 cursor-pointer">
                                        <span className="truncate">
                                            {filters.kondisi_sla === 'dalam_sla'
                                                ? '🟢 Aman SLA'
                                                : filters.kondisi_sla === 'hampir_lewat'
                                                ? '🟡 Mendekati Batas'
                                                : filters.kondisi_sla === 'lewat_sla'
                                                ? '🔴 Lewat SLA'
                                                : filters.kondisi_sla === 'menunggu_warga'
                                                ? '🔵 Verifikasi'
                                                : filters.kondisi_sla === 'selesai'
                                                ? '⚪ Selesai'
                                                : 'Semua Status'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 rounded-xl">
                                        <SelectItem value="semua" className="text-body-sm font-medium">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="dalam_sla" className="text-body-sm">
                                            🟢 Aman Dalam SLA
                                        </SelectItem>
                                        <SelectItem value="hampir_lewat" className="text-body-sm">
                                            🟡 Mendekati Batas SLA
                                        </SelectItem>
                                        <SelectItem value="lewat_sla" className="text-body-sm">
                                            🔴 Lewat Batas Waktu SLA
                                        </SelectItem>
                                        <SelectItem value="menunggu_warga" className="text-body-sm">
                                            🔵 Menunggu Verifikasi Warga
                                        </SelectItem>
                                        <SelectItem value="selesai" className="text-body-sm">
                                            ⚪ Selesai Diverifikasi
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tombol Aksi: Reset & Search */}
                            <div className="flex items-center gap-1.5 shrink-0 pl-1">
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
                                    className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm select-none"
                                    title="Pencarian Aktif"
                                >
                                    <Search className="size-4.5" />
                                </div>
                            </div>
                        </div>

                        {/* Banner Kesalahan jika fetch titik gagal */}
                        {error && (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-1.5 text-caption-xs text-destructive">
                                <AlertTriangle className="size-3.5" />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={fetchTitik}
                                    className="underline font-semibold ml-1 cursor-pointer flex items-center gap-1"
                                >
                                    <RefreshCw className="size-3" /> Coba Lagi
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drawer Daftar Tiket Laporan */}
                <PetaDrawerList
                    titikList={filteredTitik}
                    selectedTiket={selectedTiket}
                    onSelectTiket={(tiket) => setSelectedTiket(tiket)}
                    onClose={() => setIsDrawerOpen(false)}
                    isOpen={isDrawerOpen}
                    onResetFilter={handleResetFilter}
                />

                {/* Floating Quick Summary Card saat marker dipilih */}
                <TiketQuickSummary
                    tiket={selectedTiket}
                    onClose={() => setSelectedTiket(null)}
                    className="md:bottom-8 md:left-8 md:w-[420px]"
                />

                {/* Tombol Buka Drawer Daftar Laporan di Kiri Bawah Peta */}
                <div className="absolute bottom-6 left-6 z-1000 hidden sm:flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDrawerOpen((prev) => !prev)}
                        className="rounded-full shadow-md bg-card/90 backdrop-blur-md border-border text-foreground text-caption-xs font-semibold gap-1.5 h-9 px-4 hover:bg-muted"
                    >
                        <List className="size-3.5 text-primary" />
                        <span>Daftar Laporan ({filteredTitik.length})</span>
                    </Button>
                </div>
            </div>
        </section>
    );
}

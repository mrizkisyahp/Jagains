import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Plus,
    MapPin,
    Wrench,
    ThumbsUp,
    ArrowRight,
    Clock,
    Compass,
    FileText,
    X,
    ImageIcon,
    Share2,
    Check,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Button } from '@/components/ui/button';
import InstansiIndikatorCards from '@/components/instansi/InstansiIndikatorCards';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { TitikLaporanPeta } from '@/types/peta';

const WargaBerandaMap = lazy(
    () => import('@/components/warga/WargaBerandaMap'),
);

interface LaporanItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    status: string;
    kategori_nama: string;
    lokasi: string;
    foto_url: string | null;
    sisa_hari_sla: number | null;
    sisa_teks: string;
    kondisi_sla: string;
    jumlah_dukungan: number;
    tanggal_format?: string;
    is_selected_from_map?: boolean;
}

interface BerandaWargaPageProps {
    nama_warga: string;
    nama_wilayah: string;
    peta: {
        titik: TitikLaporanPeta[];
        laporan_unggulan: LaporanItem | null;
        pusat: {
            lat: number;
            lng: number;
        };
    };
    riwayat_laporan: LaporanItem[];
    kinerja_wilayah: {
        median_respons_hari: number | string;
        median_durasi_hari: number | string;
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
    };
}

export default function BerandaWargaPage({
    nama_warga,
    nama_wilayah,
    peta,
    riwayat_laporan,
    kinerja_wilayah,
}: BerandaWargaPageProps) {
    const [selectedPoint, setSelectedPoint] = useState<TitikLaporanPeta | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleCopyLink = (e: React.MouseEvent, nomorTiket: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window !== 'undefined' && navigator.clipboard) {
            const url = `${window.location.origin}/tiket/${nomorTiket}`;
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    // Default pusat peta
    const mapCenter = useMemo<[number, number]>(() => {
        if (selectedPoint) {
            const lat = Number(
                selectedPoint.lintang ?? (selectedPoint as unknown as { lat?: number }).lat,
            );
            const lng = Number(
                selectedPoint.bujur ?? (selectedPoint as unknown as { lng?: number }).lng,
            );
            if (!isNaN(lat) && !isNaN(lng)) {
                return [lat, lng];
            }
        }
        if (peta?.pusat?.lat && peta?.pusat?.lng) {
            return [peta.pusat.lat, peta.pusat.lng];
        }
        return [-6.4025, 106.7942];
    }, [selectedPoint, peta]);

    return (
        <InternalLayout title="Beranda" breadcrumb="Warga > Beranda">
            <Head>
                <title>Beranda — Jagains</title>
                <meta
                    name="description"
                    content="Beranda platform Jagains untuk warga Jabodetabek: eksplorasi peta aduan, riwayat pelaporan, dan transparansi kinerja pelayanan publik."
                />
            </Head>

            <div className="space-y-8 pb-24 sm:space-y-10">
                {/* Header Sapaan Sesuai Wireframe - 15 */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-sm">
                            Hai {nama_warga}
                        </h1>
                        <p className="text-body-sm text-muted-foreground">
                            Selamat Datang di Jagains
                        </p>
                    </div>

                    <Link
                        href="/warga/lapor"
                        className="w-fit self-start sm:self-auto"
                    >
                        <Button className="h-10 cursor-pointer gap-2 rounded-xl bg-zinc-950 px-5 font-semibold text-white shadow-md hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                            <Plus className="size-4" />
                            <span>Tambah Laporan</span>
                        </Button>
                    </Link>
                </div>

                {/* Seksi 1: Peta Eksplor Sesuai Wireframe - 15 */}
                <section className="space-y-4">
                    <h2 className="text-body-lg font-display font-bold tracking-tight text-foreground sm:text-xl">
                        Peta Eksplor
                    </h2>

                    {/* Kontainer Peta Full-Width (Ditarik Sampai Kanan) */}
                    <div className="relative min-h-[460px] sm:min-h-[520px] w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xs">
                        {/* Peta Interaktif Leaflet Mengisi 100% Lebar & Tinggi */}
                        {isMounted ? (
                            <ErrorBoundary>
                                <Suspense
                                    fallback={
                                        <div className="size-full min-h-[460px] sm:min-h-[520px] animate-pulse bg-muted/30" />
                                    }
                                >
                                    <WargaBerandaMap
                                        center={mapCenter}
                                        titik={peta?.titik ?? []}
                                        selectedPointId={selectedPoint?.id}
                                        onSelectPoint={(pt) =>
                                            setSelectedPoint(pt)
                                        }
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        ) : (
                            <div className="size-full min-h-[460px] sm:min-h-[520px] animate-pulse bg-muted/30" />
                        )}

                        {/* Badge Wilayah di Sudut Kiri Bawah Peta */}
                        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-caption-xs font-semibold text-foreground shadow-xs backdrop-blur-md">
                                <Compass className="size-3.5 text-primary" />
                                <span>{nama_wilayah || 'Jabodetabek'}</span>
                            </span>
                        </div>

                        {/* Quick Summary Card: Muncul Hanya Saat User Klik Salah Satu Titik Marker */}
                        {selectedPoint && (
                            <div className="pointer-events-auto absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 z-20 w-auto sm:w-[360px] md:w-[380px] max-w-full sm:max-w-[calc(100%-2rem)] max-h-[85%] overflow-y-auto rounded-2xl border border-border/90 bg-card shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-right-4">
                                <Link
                                    href={`/tiket/${selectedPoint.nomor_tiket}`}
                                    className="group flex flex-col transition-colors"
                                >
                                    {/* Bagian Atas: Foto Laporan dengan Overlay Tombol Aksi & Badge */}
                                    <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-zinc-950">
                                        {selectedPoint.foto_url ? (
                                            <img
                                                src={selectedPoint.foto_url}
                                                alt={selectedPoint.judul}
                                                loading="lazy"
                                                decoding="async"
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex size-full flex-col items-center justify-center bg-muted/40 p-4 text-muted-foreground">
                                                <ImageIcon className="mb-1.5 size-8 opacity-40" />
                                                <span className="text-caption-xs font-medium">
                                                    Dokumentasi Laporan
                                                </span>
                                            </div>
                                        )}

                                        {/* Kategori Badge di Kiri Atas Gambar */}
                                        <div className="absolute top-2.5 left-2.5 z-10">
                                            <span className="rounded-full border border-border/60 bg-background/90 px-2.5 py-0.5 text-caption-xs font-semibold text-foreground shadow-xs backdrop-blur-md">
                                                {selectedPoint.kategori_nama}
                                            </span>
                                        </div>

                                        {/* Tombol Salin Tautan & Tutup di Kanan Atas Gambar */}
                                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={(e) =>
                                                    handleCopyLink(
                                                        e,
                                                        selectedPoint.nomor_tiket,
                                                    )
                                                }
                                                className="size-8 cursor-pointer rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
                                                title="Salin Tautan Tiket"
                                            >
                                                {copied ? (
                                                    <Check className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Share2 className="size-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedPoint(null);
                                                }}
                                                className="size-8 cursor-pointer rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
                                                title="Tutup Ringkasan"
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Bagian Isi Kartu */}
                                    <div className="flex flex-col space-y-3 p-4 sm:p-5">
                                        <div className="space-y-2">
                                            {/* Status Badge & Nomor Tiket */}
                                            <div className="flex items-center justify-between gap-2">
                                                <InstansiStatusBadge
                                                    status={selectedPoint.status}
                                                />
                                                <span className="font-mono text-caption-xs font-semibold text-muted-foreground">
                                                    #{selectedPoint.nomor_tiket}
                                                </span>
                                            </div>

                                            {/* Judul Laporan */}
                                            <h3 className="line-clamp-2 text-body-base font-display leading-snug font-bold text-foreground transition-colors group-hover:text-primary">
                                                {selectedPoint.judul}
                                            </h3>

                                            {/* Kategori */}
                                            <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                <Wrench className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {selectedPoint.kategori_nama}
                                                </span>
                                            </div>

                                            {/* Lokasi */}
                                            <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                <MapPin className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {selectedPoint.kelurahan_nama
                                                        ? `Kel. ${selectedPoint.kelurahan_nama}, Kec. ${selectedPoint.kecamatan_nama}${selectedPoint.kota_nama ? `, ${selectedPoint.kota_nama}` : ''}`
                                                        : nama_wilayah || 'Jabodetabek'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer Kartu: Sisa Hari Kerja & Jumlah Dukungan */}
                                        <div className="space-y-3 border-t border-border/60 pt-3">
                                            <div className="flex items-center justify-between text-caption-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Clock className="size-3.5 text-muted-foreground" />
                                                    <span className="line-clamp-1">
                                                        {selectedPoint.sisa_sla_teks ||
                                                            (selectedPoint.sisa_hari_sla !==
                                                            null
                                                                ? `Sisa ${selectedPoint.sisa_hari_sla} hari kerja`
                                                                : 'Sesuai SLA')}
                                                    </span>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1 font-semibold text-foreground">
                                                    <ThumbsUp className="size-3.5 text-muted-foreground" />
                                                    <span>
                                                        {(
                                                            selectedPoint.jumlah_dukungan ??
                                                            0
                                                        ).toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tombol Lihat Detail */}
                                            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-caption-xs font-semibold text-primary-foreground shadow-xs transition-opacity group-hover:opacity-90">
                                                <span>Lihat Detail Laporan</span>
                                                <ArrowRight className="size-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Seksi 2: Riwayat Laporan Sesuai Wireframe - 15 */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-body-lg font-display font-bold tracking-tight text-foreground sm:text-xl">
                            Riwayat Laporan
                        </h2>
                        <Link
                            href="/warga/riwayat"
                            className="inline-flex cursor-pointer items-center gap-1.5 text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <span>Lihat Lainnya</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    {/* Grid 3 Kartu Laporan */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {(riwayat_laporan ?? []).length > 0 ? (
                            (riwayat_laporan ?? []).map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/tiket/${item.nomor_tiket}`}
                                    className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs transition-all hover:shadow-md"
                                >
                                    {/* Foto Laporan */}
                                    <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-zinc-950">
                                        {item.foto_url ? (
                                            <img
                                                src={item.foto_url}
                                                alt={item.judul}
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="text-body-sm font-display font-medium text-zinc-500">
                                                Foto Laporan
                                            </span>
                                        )}
                                    </div>

                                    {/* Isi Kartu */}
                                    <div className="flex flex-1 flex-col justify-between space-y-3 p-4 sm:p-5">
                                        <div className="space-y-2">
                                            {/* Status Badge */}
                                            <div>
                                                <InstansiStatusBadge
                                                    status={item.status}
                                                />
                                            </div>

                                            {/* Judul Laporan */}
                                            <h3 className="line-clamp-2 text-body-base font-display leading-snug font-bold text-foreground transition-colors group-hover:text-primary">
                                                {item.judul}
                                            </h3>

                                            {/* Kategori */}
                                            <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                <Wrench className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {item.kategori_nama}
                                                </span>
                                            </div>

                                            {/* Lokasi */}
                                            <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                                <MapPin className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {item.lokasi}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer Kartu */}
                                        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-caption-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock className="size-3.5 text-muted-foreground" />
                                                <span>{item.sisa_teks}</span>
                                            </div>

                                            <div className="flex items-center gap-1 font-semibold text-foreground">
                                                <ThumbsUp className="size-3.5 text-muted-foreground" />
                                                <span>
                                                    {(
                                                        item.jumlah_dukungan ??
                                                        0
                                                    ).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-1 space-y-3 rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center sm:p-10 md:col-span-3">
                                <FileText className="mx-auto size-10 text-muted-foreground/50" />
                                <h3 className="text-body-base font-semibold text-foreground">
                                    Belum Ada Laporan yang Diajukan
                                </h3>
                                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                    Temukan masalah infrastruktur publik di
                                    sekitar Anda dan laporkan segera agar
                                    ditindaklanjuti dinas terkait.
                                </p>
                                <Link
                                    href="/warga/lapor"
                                    className="mt-2 inline-block"
                                >
                                    <Button className="gap-2 rounded-xl font-semibold">
                                        <Plus className="size-4" />
                                        <span>Buat Laporan Pertama</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Seksi 3: Kualitas Kinerja di Wilayahmu Sesuai Wireframe - 15 */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-body-lg font-display font-bold tracking-tight text-foreground sm:text-xl">
                            Kualitas Kinerja di Wilayahmu
                        </h2>
                        <span className="text-caption-xs font-medium text-muted-foreground sm:text-body-sm">
                            {nama_wilayah || 'Jabodetabek'}
                        </span>
                    </div>

                    {/* Baris 1: Dua Kartu Median Waktu Respons & Median Durasi Perbaikan */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Kartu 1: Median Waktu Respons */}
                        <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-body-base font-display font-bold text-foreground">
                                    Median Waktu Respons
                                </h3>
                                <span className="text-caption-xs font-medium text-muted-foreground">
                                    per bulan
                                </span>
                            </div>

                            <div className="py-2">
                                <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                                    {typeof kinerja_wilayah?.median_respons_hari ===
                                    'number'
                                        ? kinerja_wilayah.median_respons_hari.toLocaleString(
                                              'id-ID',
                                              { minimumFractionDigits: 1 },
                                          )
                                        : (kinerja_wilayah?.median_respons_hari ??
                                          0)}{' '}
                                    <span className="text-body-base font-medium text-muted-foreground sm:text-body-lg">
                                        hari
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Kartu 2: Median Durasi Perbaikan */}
                        <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-body-base font-display font-bold text-foreground">
                                    Median Durasi Perbaikan
                                </h3>
                                <span className="text-caption-xs font-medium text-muted-foreground">
                                    per bulan
                                </span>
                            </div>

                            <div className="py-2">
                                <div className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-md">
                                    {typeof kinerja_wilayah?.median_durasi_hari ===
                                    'number'
                                        ? kinerja_wilayah.median_durasi_hari.toLocaleString(
                                              'id-ID',
                                              { minimumFractionDigits: 1 },
                                          )
                                        : (kinerja_wilayah?.median_durasi_hari ??
                                          0)}{' '}
                                    <span className="text-body-base font-medium text-muted-foreground sm:text-body-lg">
                                        hari
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Baris 2: Tiga Kartu Indikator Kinerja */}
                    <InstansiIndikatorCards
                        janjiDitepati={
                            kinerja_wilayah?.indikator_kinerja
                                ?.janji_ditepati ?? {
                                persen: 100,
                                label_tingkat: 'Sangat Baik',
                                tepat_waktu: 100,
                                terlambat: 0,
                            }
                        }
                        persentaseVerifikasi={
                            kinerja_wilayah?.indikator_kinerja
                                ?.persentase_verifikasi ?? {
                                persen: 100,
                                label_tingkat: 'Tinggi',
                                diverifikasi: 100,
                                ditolak: 0,
                            }
                        }
                        anggaranMenggantung={
                            kinerja_wilayah?.indikator_kinerja
                                ?.anggaran_menggantung ?? {
                                total_tiket: 0,
                                rata_rata_keterlambatan_hari: 0,
                            }
                        }
                    />
                </section>
            </div>
        </InternalLayout>
    );
}

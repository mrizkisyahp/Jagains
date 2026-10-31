import { ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Search,
    Filter,
    CheckCircle2,
    Users,
    AlertCircle,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KartuTiketVerifikasi from '@/components/verifikasi/KartuTiketVerifikasi';
import { TiketVerifikasiItem } from '@/types/verifikasi';

interface VerifikasiPageProps {
    daftarTiket: {
        data: TiketVerifikasiItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    kelurahan: { id: number; nama: string } | null;
    filters: {
        tab?: string;
        q?: string;
        kategori_id?: string;
    };
}

export default function VerifikasiWargaPage({
    daftarTiket,
    kategoriList,
    kelurahan,
    filters,
}: VerifikasiPageProps) {
    const [search, setSearch] = useState(filters.q || '');
    const [selectedKategori, setSelectedKategori] = useState(filters.kategori_id || '');
    const currentTab = filters.tab || 'perlu_suara';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/warga/verifikasi',
            {
                tab: currentTab,
                q: search || undefined,
                kategori_id: selectedKategori || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleTabChange = (tab: string) => {
        router.get(
            '/warga/verifikasi',
            {
                tab: tab,
                q: search || undefined,
                kategori_id: selectedKategori || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleKategoriChange = (katId: string) => {
        setSelectedKategori(katId);
        router.get(
            '/warga/verifikasi',
            {
                tab: currentTab,
                q: search || undefined,
                kategori_id: katId || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <div className="space-y-6">
            <Head title="Verifikasi Hasil Perbaikan Warga" />

            {/* Banner Edukasi Kedaulatan Kuorum */}
            <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-background to-blue-500/5 p-6 sm:p-8">
                <div className="max-w-2xl space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 text-xs font-bold">
                            Kedaulatan Warga Kelurahan {kelurahan?.nama || 'Depok'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="size-3.5" /> Kuorum Partisipatif (FR-VER-01 s/d 04)
                        </span>
                    </div>

                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                        Uji & Verifikasi Hasil Perbaikan Dinas
                    </h1>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Di Jagains, aparatur dinas <strong>tidak dapat menutup tiket sendiri</strong>. Penutupan tiket hanya sah melalui persetujuan warga setempat (Jalur A di lokasi bernilai 1.0 suara, Jalur B berbobot 0.5 suara). Jika pekerjaan tidak sesuai standar, warga berhak menolaknya untuk disengketakan.
                    </p>
                </div>
            </div>

            {/* Tab Navigasi & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
                {/* Tabs */}
                <div className="inline-flex rounded-2xl bg-muted/50 p-1 border border-border">
                    <button
                        type="button"
                        onClick={() => handleTabChange('perlu_suara')}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                            currentTab === 'perlu_suara'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Perlu Suara Anda
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('semua')}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                            currentTab === 'semua'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Semua Tiket Tahap Verifikasi
                    </button>
                </div>

                {/* Filter Form */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari nomor tiket..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 pl-8 text-xs rounded-xl"
                        />
                    </div>

                    <select
                        value={selectedKategori}
                        onChange={(e) => handleKategoriChange(e.target.value)}
                        className="h-9 px-3 text-xs rounded-xl border border-input bg-background text-foreground"
                    >
                        <option value="">Semua Kategori</option>
                        {kategoriList.map((kat) => (
                            <option key={kat.id} value={kat.id}>
                                {kat.nama}
                            </option>
                        ))}
                    </select>

                    <Button type="submit" size="sm" variant="outline" className="h-9 px-3 text-xs rounded-xl">
                        <Filter className="size-3 mr-1" /> Filter
                    </Button>
                </form>
            </div>

            {/* Grid Daftar Tiket Verifikasi */}
            {daftarTiket.data.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
                        <CheckCircle2 className="size-6" />
                    </div>
                    <h3 className="font-display text-base font-bold text-foreground">
                        {currentTab === 'perlu_suara'
                            ? 'Tidak Ada Tiket yang Menunggu Suara Anda'
                            : 'Belum Ada Tiket dalam Tahap Verifikasi'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        {currentTab === 'perlu_suara'
                            ? 'Seluruh pekerjaan perbaikan di kelurahan Anda saat ini sudah Anda beri suara atau belum ada pekerjaan fisik baru yang diajukan selesai oleh dinas.'
                            : 'Saat dinas mengajukan selesai pada suatu perbaikan, tiket akan otomatis muncul di sini selama 14 hari kalender untuk diverifikasi bersama warga.'}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/warga/riwayat')}
                        className="text-xs mt-2"
                    >
                        Lihat Riwayat Laporan Saya
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {daftarTiket.data.map((tiket) => (
                        <KartuTiketVerifikasi
                            key={tiket.id}
                            tiket={tiket}
                            onSuaraBerhasil={() => router.reload({ only: ['daftarTiket'] })}
                        />
                    ))}
                </div>
            )}

            {/* Paginasi */}
            {daftarTiket.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                    <span>
                        Menampilkan {daftarTiket.from} - {daftarTiket.to} dari total {daftarTiket.total} tiket
                    </span>
                    <div className="flex items-center gap-1">
                        {daftarTiket.links.map((link, idx) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="px-2.5 py-1 text-muted-foreground/50 text-xs"
                                    />
                                );
                            }
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => router.visit(link.url!)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'hover:bg-muted text-foreground'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

VerifikasiWargaPage.layout = (page: ReactNode) => (
    <InternalLayout title="Verifikasi Warga" breadcrumb="Warga > Verifikasi Kuorum">
        {page}
    </InternalLayout>
);

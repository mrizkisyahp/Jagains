import { ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { EskalasiItem } from '@/types/auditor';
import KartuEskalasi from '@/components/auditor/KartuEskalasi';
import ModalKeputusanAuditor from '@/components/auditor/ModalKeputusanAuditor';
import { Scale, Search, Clock, ShieldAlert, AlertTriangle, AlertCircle, Inbox, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AntreanAuditorProps {
    antrean: {
        data: EskalasiItem[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    kategoriList: Array<{ id: number; nama: string }>;
    instansiList: Array<{ id: number; nama: string; singkatan: string }>;
    ringkasan: {
        semua: number;
        sla: number;
        sanggahan: number;
        ronde: number;
        tanpa_kuorum: number;
    };
    filters: {
        tab?: string;
        q?: string;
        kategori_id?: string;
        instansi_id?: string;
    };
}

export default function AntreanAuditorPage({
    antrean,
    kategoriList,
    instansiList,
    ringkasan,
    filters,
}: AntreanAuditorProps) {
    const [selectedEskalasiId, setSelectedEskalasiId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const activeTab = filters.tab || 'semua';

    const handleTabChange = (tab: string) => {
        router.get(
            '/auditor/antrean',
            { ...filters, tab, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, val: string) => {
        router.get(
            '/auditor/antrean',
            { ...filters, [key]: val || undefined, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('q', searchQuery.trim());
    };

    const handleBukaPerkara = (id: number) => {
        setSelectedEskalasiId(id);
        setIsModalOpen(true);
    };

    return (
        <>
            <Head title="Antrean Eskalasi Auditor" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-2xl border border-zinc-200 bg-linear-to-r from-teal-900 via-zinc-900 to-zinc-900 p-6 text-white shadow-sm dark:border-zinc-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300 backdrop-blur-xs">
                                    <Scale className="size-3.5" />
                                    Meja Sidang Auditor Independen
                                </span>
                            </div>
                            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                                Antrean Eskalasi & Sengketa Terbuka
                            </h1>
                            <p className="max-w-2xl text-xs text-zinc-300 leading-relaxed">
                                Penelaahan independen atas laporan warga yang mengalami kebuntuan sengketa fisik, ketiadaan kuorum setelah 14 hari, atau pelanggaran batas waktu SLA kedinasan.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md">
                            <Scale className="size-8 text-teal-400" />
                            <div>
                                <span className="text-[11px] font-medium text-zinc-300">Total Kasus Terbuka</span>
                                <div className="font-mono text-2xl font-bold text-white font-numeric">
                                    {ringkasan.semua}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Filter Pemicu */}
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => handleTabChange('semua')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'semua'
                                ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <span>Semua Kasus</span>
                        <span className="rounded-full bg-zinc-200/60 px-1.5 py-0.2 text-[10px] dark:bg-zinc-700 font-numeric">
                            {ringkasan.semua}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('sla')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'sla'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <Clock className="size-3.5" />
                        <span>Keterlambatan SLA</span>
                        <span className="rounded-full bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[10px] dark:bg-rose-900/40 dark:text-rose-300 font-numeric">
                            {ringkasan.sla}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('sanggahan')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'sanggahan'
                                ? 'bg-violet-700 text-white shadow-xs'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <ShieldAlert className="size-3.5" />
                        <span>Sanggahan Instansi</span>
                        <span className="rounded-full bg-violet-100 text-violet-800 px-1.5 py-0.2 text-[10px] dark:bg-violet-900/40 dark:text-violet-300 font-numeric">
                            {ringkasan.sanggahan}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('ronde')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'ronde'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <AlertTriangle className="size-3.5" />
                        <span>Sengketa Ronde 4x</span>
                        <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] dark:bg-amber-900/40 dark:text-amber-300 font-numeric">
                            {ringkasan.ronde}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('tanpa_kuorum')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'tanpa_kuorum'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <AlertCircle className="size-3.5" />
                        <span>14 Hari Tanpa Kuorum</span>
                        <span className="rounded-full bg-indigo-100 text-indigo-800 px-1.5 py-0.2 text-[10px] dark:bg-indigo-900/40 dark:text-indigo-300 font-numeric">
                            {ringkasan.tanpa_kuorum}
                        </span>
                    </button>
                </div>

                {/* Filter & Pencarian Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor tiket atau judul laporan..."
                            className="pl-9 text-xs"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Instansi */}
                        <select
                            value={filters.instansi_id || ''}
                            onChange={(e) => handleFilterChange('instansi_id', e.target.value)}
                            aria-label="Filter berdasarkan instansi"
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-2xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                            <option value="">Semua Instansi</option>
                            {instansiList.map((ins) => (
                                <option key={ins.id} value={ins.id}>
                                    {ins.singkatan ? `${ins.singkatan} - ` : ''}{ins.nama}
                                </option>
                            ))}
                        </select>

                        {/* Filter Kategori */}
                        <select
                            value={filters.kategori_id || ''}
                            onChange={(e) => handleFilterChange('kategori_id', e.target.value)}
                            aria-label="Filter berdasarkan kategori"
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-2xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                            <option value="">Semua Kategori</option>
                            {kategoriList.map((kat) => (
                                <option key={kat.id} value={kat.id}>
                                    {kat.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Daftar Grid Kasus Eskalasi */}
                {antrean.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                        <Inbox className="size-12 text-zinc-300 dark:text-zinc-600" />
                        <h3 className="mt-4 font-display text-base font-bold text-zinc-800 dark:text-zinc-200">
                            Tidak Ada Perkara Eskalasi Terbuka
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                            Seluruh laporan fisik berjalan dalam koridor pemungutan suara warga dan kepatuhan SLA instansi. Tidak ada perkara yang memerlukan intervensi putusan saat ini.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {antrean.data.map((item) => (
                            <KartuEskalasi
                                key={item.id}
                                eskalasi={item}
                                onBukaPerkara={handleBukaPerkara}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {antrean.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                        <span className="text-xs text-zinc-500">
                            Menampilkan halaman <strong className="font-numeric">{antrean.current_page}</strong> dari <strong className="font-numeric">{antrean.last_page}</strong> ({antrean.total} kasus)
                        </span>
                        <div className="flex gap-2">
                            {antrean.prev_page_url && (
                                <button
                                    type="button"
                                    onClick={() => router.get(antrean.prev_page_url!)}
                                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                >
                                    Sebelumnya
                                </button>
                            )}
                            {antrean.next_page_url && (
                                <button
                                    type="button"
                                    onClick={() => router.get(antrean.next_page_url!)}
                                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                >
                                    Berikutnya
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Telaah Sidang Putusan */}
            <ModalKeputusanAuditor
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eskalasiId={selectedEskalasiId}
                onSuccess={() => {
                    router.reload();
                }}
            />
        </>
    );
}

AntreanAuditorPage.layout = (page: ReactNode) => (
    <InternalLayout title="Antrean Eskalasi" breadcrumb="Auditor > Antrean">
        {page}
    </InternalLayout>
);

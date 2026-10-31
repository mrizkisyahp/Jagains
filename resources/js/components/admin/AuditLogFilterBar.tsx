import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AuditLogFilterState } from '@/types/audit';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface AuditLogFilterBarProps {
    filters: AuditLogFilterState;
    daftarAksi: string[];
    routeUrl: string;
}

export default function AuditLogFilterBar({
    filters,
    daftarAksi,
    routeUrl,
}: AuditLogFilterBarProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [aksi, setAksi] = useState(filters.aksi ?? '');
    const [waktuMulai, setWaktuMulai] = useState(filters.waktu_mulai ?? '');
    const [waktuSelesai, setWaktuSelesai] = useState(filters.waktu_selesai ?? '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            routeUrl,
            {
                search: search || undefined,
                aksi: aksi || undefined,
                waktu_mulai: waktuMulai || undefined,
                waktu_selesai: waktuSelesai || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleReset = () => {
        setSearch('');
        setAksi('');
        setWaktuMulai('');
        setWaktuSelesai('');
        router.get(routeUrl, {}, { preserveState: true, replace: true });
    };

    return (
        <form onSubmit={handleFilter} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari pelaku, nomor tiket, alasan..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>

                {/* Filter Jenis Aksi */}
                <div>
                    <select
                        value={aksi}
                        onChange={(e) => setAksi(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                        <option value="">Semua Jenis Aksi</option>
                        {daftarAksi.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Waktu Mulai */}
                <div>
                    <input
                        type="date"
                        value={waktuMulai}
                        onChange={(e) => setWaktuMulai(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        title="Dari Tanggal"
                    />
                </div>

                {/* Waktu Selesai */}
                <div>
                    <input
                        type="date"
                        value={waktuSelesai}
                        onChange={(e) => setWaktuSelesai(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        title="Sampai Tanggal"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reset</span>
                </button>
                <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Terapkan Filter</span>
                </button>
            </div>
        </form>
    );
}

import { ReactNode, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    AlertCircle,
    Building2,
    Calendar,
    ChevronRight,
    ExternalLink,
    FileText,
    Inbox,
    Layers,
    MapPin,
    Send,
    Tag,
    X,
} from 'lucide-react';

interface TiketRouting {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: string;
    status: string;
    kategori: string | null;
    kelurahan: string | null;
    foto: string | null;
    lintang: number;
    bujur: number;
    created_at: string;
}

interface InstansiOption {
    id: number;
    nama: string;
    singkatan: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
}

interface AntreanRoutingProps {
    antrean: PaginatedData<TiketRouting>;
    daftarInstansi: InstansiOption[];
}

export default function AntreanRoutingPage({
    antrean,
    daftarInstansi,
}: AntreanRoutingProps) {
    const [selectedTiket, setSelectedTiket] = useState<TiketRouting | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        instansi_id: '',
        catatan: '',
    });

    const bukaModalDisposisi = (tiket: TiketRouting) => {
        setSelectedTiket(tiket);
        setData({
            instansi_id: '',
            catatan: '',
        });
        clearErrors();
    };

    const tutupModalDisposisi = () => {
        setSelectedTiket(null);
        reset();
        clearErrors();
    };

    const handleKirimDisposisi = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTiket) return;

        post(`/admin/antrean-routing/${selectedTiket.nomor_tiket}/disposisi`, {
            onSuccess: () => {
                tutupModalDisposisi();
            },
        });
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <Head title="Antrean Disposisi Routing - Jagains Admin" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Antrean Routing Manual
                    </h1>
                    <p className="text-sm text-slate-500">
                        Tiket aduan masyarakat yang memerlukan penetapan instansi teknis penanggung jawab secara manual (FR-ADM-05).
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-semibold text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>{antrean.total} Tiket Menunggu Disposisi</span>
                </div>
            </div>

            {/* Daftar Tiket Menggantung */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {antrean.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-slate-800">
                            Tidak Ada Tiket Menggantung
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm">
                            Seluruh laporan yang masuk berhasil dipetakan ke instansi teknis melalui aturan routing otomatis.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {antrean.data.map((tiket) => (
                            <div
                                key={tiket.id}
                                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                            >
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                            {tiket.nomor_tiket}
                                        </span>
                                        <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
                                            PERLU ROUTING
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {formatTanggal(tiket.created_at)}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                                            {tiket.judul}
                                        </h3>
                                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                            {tiket.keterangan}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        {tiket.kategori && (
                                            <span className="inline-flex items-center gap-1">
                                                <Tag className="h-3 w-3 text-slate-400" />
                                                {tiket.kategori}
                                            </span>
                                        )}
                                        {tiket.kelurahan && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                Kelurahan {tiket.kelurahan}
                                            </span>
                                        )}
                                        <span className="capitalize text-slate-500">
                                            Keparahan: <strong>{tiket.keparahan}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <a
                                        href={`/tiket/${tiket.nomor_tiket}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-teal-600 transition"
                                    >
                                        <span>Detail</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => bukaModalDisposisi(tiket)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                    >
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>Disposisikan</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Links */}
            {antrean.last_page > 1 && (
                <div className="flex items-center justify-center gap-1">
                    {antrean.links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url || '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded px-3 py-1 text-xs font-medium ${
                                link.active
                                    ? 'bg-teal-600 text-white'
                                    : link.url
                                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    : 'text-slate-300 pointer-events-none'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Modal Dialog Disposisi */}
            {selectedTiket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-teal-600" />
                                <h3 className="font-semibold text-slate-900 text-base">
                                    Disposisi Manual Instansi
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={tutupModalDisposisi}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleKirimDisposisi} className="p-6 space-y-4">
                            {/* Ringkasan Tiket */}
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono font-bold text-slate-800">
                                        {selectedTiket.nomor_tiket}
                                    </span>
                                    <span className="text-slate-500">
                                        {selectedTiket.kelurahan || '-'}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-slate-900 line-clamp-1">
                                    {selectedTiket.judul}
                                </div>
                            </div>

                            {/* Pilihan Instansi Teknis */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Instansi Teknis Penanggung Jawab <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.instansi_id}
                                    onChange={(e) => setData('instansi_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">-- Pilih OPD / Dinas Terkait --</option>
                                    {daftarInstansi.map((ins) => (
                                        <option key={ins.id} value={ins.id}>
                                            {ins.singkatan} - {ins.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.instansi_id && (
                                    <p className="text-xs text-rose-600">{errors.instansi_id}</p>
                                )}
                            </div>

                            {/* Catatan Disposisi */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Catatan / Alasan Disposisi <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    rows={3}
                                    placeholder="Alasan penugasan tiket ini ke OPD terkait (minimal 10 karakter)..."
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <div className="flex justify-between text-[11px] text-slate-400">
                                    <span>Minimal 10 karakter untuk dicatat di audit log</span>
                                    <span className={data.catatan.length < 10 ? 'text-amber-600' : 'text-slate-600'}>
                                        {data.catatan.length} karakter
                                    </span>
                                </div>
                                {errors.catatan && (
                                    <p className="text-xs text-rose-600">{errors.catatan}</p>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={tutupModalDisposisi}
                                    disabled={processing}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.instansi_id || data.catatan.length < 10}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{processing ? 'Menyimpan...' : 'Kirim Disposisi'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

AntreanRoutingPage.layout = (page: ReactNode) => (
    <InternalLayout title="Perlu Routing" breadcrumb="Admin > Operasional">
        {page}
    </InternalLayout>
);

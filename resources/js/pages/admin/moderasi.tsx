import { ReactNode, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    AlertOctagon,
    AlertTriangle,
    Ban,
    CheckCircle2,
    EyeOff,
    ExternalLink,
    Filter,
    HelpCircle,
    Inbox,
    MessageSquare,
    Shield,
    ShieldAlert,
    User,
    X,
} from 'lucide-react';

interface PelanggaranItem {
    id: number;
    alasan: string;
    catatan: string | null;
    status: 'menunggu' | 'ditinjau' | 'selesai';
    tindakan: string | null;
    catatan_moderator: string | null;
    created_at: string;
    pelapor_pengadu: {
        id: number;
        username: string;
    } | null;
    moderator: {
        id: number;
        username: string;
    } | null;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        keterangan: string;
        keparahan: string;
        disembunyikan: boolean;
        kategori: string | null;
        kelurahan: string | null;
        foto: string | null;
        pelapor_tiket: {
            id: number;
            username: string;
            poin_peringatan: number;
            status_akun: string;
        } | null;
    };
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

interface ModerasiPageProps {
    antreanModerasi: PaginatedData<PelanggaranItem>;
    statusFilter: string;
}

const LABEL_ALASAN: Record<string, string> = {
    sara_ujaran_kebencian: 'SARA / Ujaran Kebencian',
    foto_tidak_senonoh: 'Foto Tidak Senonoh',
    spam_promosi: 'Spam / Iklan Promosi',
    informasi_palsu: 'Informasi Palsu / Hoaks',
    pelanggaran_privasi: 'Pelanggaran Privasi / PII',
    lainnya: 'Pelanggaran Lainnya',
};

const WARNA_ALASAN: Record<string, string> = {
    sara_ujaran_kebencian: 'bg-rose-100 text-rose-800 border-rose-200',
    foto_tidak_senonoh: 'bg-purple-100 text-purple-800 border-purple-200',
    spam_promosi: 'bg-amber-100 text-amber-800 border-amber-200',
    informasi_palsu: 'bg-blue-100 text-blue-800 border-blue-200',
    pelanggaran_privasi: 'bg-rose-100 text-rose-800 border-rose-200',
    lainnya: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function ModerasiPage({ antreanModerasi, statusFilter }: ModerasiPageProps) {
    const [selectedItem, setSelectedItem] = useState<PelanggaranItem | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        tindakan: 'diabaikan',
        catatan: '',
    });

    const bukaModalTindakan = (item: PelanggaranItem) => {
        setSelectedItem(item);
        setData({
            tindakan: 'diabaikan',
            catatan: '',
        });
        clearErrors();
    };

    const tutupModalTindakan = () => {
        setSelectedItem(null);
        reset();
        clearErrors();
    };

    const handleKirimTindakan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        post(`/admin/moderasi/${selectedItem.id}/tindak`, {
            onSuccess: () => {
                tutupModalTindakan();
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
            <Head title="Panel Moderasi Konten - Jagains Admin" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Panel Moderasi Konten
                    </h1>
                    <p className="text-sm text-slate-500">
                        Peninjauan aduan warga atas dugaan pelanggaran panduan komunitas dan sanksi akun (FR-ADM-06).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-semibold text-rose-800">
                        <ShieldAlert className="h-4 w-4 text-rose-600" />
                        <span>{antreanModerasi.total} Aduan Terdata</span>
                    </span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <a
                    href="/admin/moderasi?status=menunggu"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        statusFilter === 'menunggu'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Menunggu Tindakan
                </a>
                <a
                    href="/admin/moderasi?status=selesai"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        statusFilter === 'selesai'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Riwayat Selesai
                </a>
                <a
                    href="/admin/moderasi"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        !statusFilter || statusFilter === 'semua'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Semua
                </a>
            </div>

            {/* Card List Moderasi */}
            <div className="space-y-4">
                {antreanModerasi.data.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-slate-900">
                            Antrean Moderasi Bersih
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Tidak ada aduan pelanggaran konten yang memerlukan penanganan saat ini.
                        </p>
                    </div>
                ) : (
                    antreanModerasi.data.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
                        >
                            {/* Baris Atas: Aduan Info */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold ${
                                            WARNA_ALASAN[item.alasan] || 'bg-slate-100 text-slate-800'
                                        }`}
                                    >
                                        {LABEL_ALASAN[item.alasan] || item.alasan}
                                    </span>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs text-slate-500">
                                        Dilaporkan oleh warga{' '}
                                        <strong className="text-slate-700">
                                            {item.pelapor_pengadu?.username || 'Warga'}
                                        </strong>
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                        {formatTanggal(item.created_at)}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                            item.status === 'selesai'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}
                                    >
                                        {item.status === 'selesai' ? 'SELESAI' : 'MENUNGGU TINDAKAN'}
                                    </span>
                                </div>
                            </div>

                            {/* Catatan Pelapor Warga */}
                            {item.catatan && (
                                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                                    <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Catatan dari Pelapor:</span>
                                    </div>
                                    <p className="italic text-slate-600">"{item.catatan}"</p>
                                </div>
                            )}

                            {/* Kotak Konten Tiket Yang Diadukan */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                            {item.laporan.nomor_tiket}
                                        </span>
                                        {item.laporan.disembunyikan && (
                                            <span className="inline-flex items-center gap-1 rounded bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[11px] font-medium">
                                                <EyeOff className="h-3 w-3" />
                                                Disembunyikan dari Publik
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href={`/tiket/${item.laporan.nomor_tiket}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                                    >
                                        <span>Buka Halaman Tiket</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        {item.laporan.judul}
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                                        {item.laporan.keterangan}
                                    </p>
                                </div>

                                {/* Profil Pembuat Tiket */}
                                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1">
                                        <User className="h-3 w-3 text-slate-400" />
                                        Pembuat:{' '}
                                        <strong className="text-slate-700">
                                            {item.laporan.pelapor_tiket?.username || '-'}
                                        </strong>
                                    </span>
                                    <span>
                                        Poin Peringatan:{' '}
                                        <strong
                                            className={
                                                (item.laporan.pelapor_tiket?.poin_peringatan ?? 0) > 0
                                                    ? 'text-rose-600'
                                                    : 'text-slate-700'
                                            }
                                        >
                                            {item.laporan.pelapor_tiket?.poin_peringatan ?? 0}
                                        </strong>
                                    </span>
                                    <span>
                                        Status Akun:{' '}
                                        <strong className="text-slate-700">
                                            {item.laporan.pelapor_tiket?.status_akun || 'aktif'}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Status Penyelesaian atau Tombol Tindakan */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                {item.status === 'selesai' ? (
                                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 w-full">
                                        <div className="font-semibold flex items-center gap-1.5">
                                            <Shield className="h-4 w-4 text-emerald-700" />
                                            <span>
                                                Tindakan Diambil:{' '}
                                                <strong className="uppercase">{item.tindakan}</strong>
                                                {item.moderator && ` oleh ${item.moderator.username}`}
                                            </span>
                                        </div>
                                        {item.catatan_moderator && (
                                            <p className="mt-1 text-emerald-800">
                                                Catatan: "{item.catatan_moderator}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => bukaModalTindakan(item)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
                                    >
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        <span>Tentukan Tindakan Moderasi</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {antreanModerasi.last_page > 1 && (
                <div className="flex items-center justify-center gap-1">
                    {antreanModerasi.links.map((link, idx) => (
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

            {/* Modal Dialog Tindakan Moderasi */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-rose-600" />
                                <h3 className="font-semibold text-slate-900 text-base">
                                    Tindakan Moderasi Konten
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={tutupModalTindakan}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleKirimTindakan} className="p-6 space-y-4">
                            {/* Ringkasan */}
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
                                <div>
                                    Tiket:{' '}
                                    <strong className="font-mono">
                                        {selectedItem.laporan.nomor_tiket}
                                    </strong>{' '}
                                    — {selectedItem.laporan.judul}
                                </div>
                                <div>
                                    Pelanggaran yang diadukan:{' '}
                                    <strong className="text-rose-700">
                                        {LABEL_ALASAN[selectedItem.alasan] || selectedItem.alasan}
                                    </strong>
                                </div>
                            </div>

                            {/* Pilihan Tindakan */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Pilih Tindakan Moderasi <span className="text-rose-500">*</span>
                                </label>

                                <div className="space-y-2 text-xs">
                                    <label
                                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                                            data.tindakan === 'diabaikan'
                                                ? 'border-teal-500 bg-teal-50/50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="diabaikan"
                                            checked={data.tindakan === 'diabaikan'}
                                            onChange={(e) => setData('tindakan', e.target.value)}
                                            className="mt-0.5 text-teal-600 focus:ring-teal-500"
                                        />
                                        <div>
                                            <span className="font-semibold text-slate-900 block">
                                                Abaikan Laporan
                                            </span>
                                            <span className="text-slate-500">
                                                Aduan tidak terbukti melanggar ketentuan. Tiket tetap aktif dan tampil publik.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                                            data.tindakan === 'peringatan'
                                                ? 'border-amber-500 bg-amber-50/50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="peringatan"
                                            checked={data.tindakan === 'peringatan'}
                                            onChange={(e) => setData('tindakan', e.target.value)}
                                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                        />
                                        <div>
                                            <span className="font-semibold text-amber-900 block">
                                                Beri Peringatan (+1 Poin Peringatan)
                                            </span>
                                            <span className="text-slate-500">
                                                Berikan peringatan pada akun pembuat tiket atas konten yang kurang pantas.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                                            data.tindakan === 'disembunyikan'
                                                ? 'border-rose-500 bg-rose-50/50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="disembunyikan"
                                            checked={data.tindakan === 'disembunyikan'}
                                            onChange={(e) => setData('tindakan', e.target.value)}
                                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                        />
                                        <div>
                                            <span className="font-semibold text-rose-900 block">
                                                Sembunyikan Tiket dari Publik
                                            </span>
                                            <span className="text-slate-500">
                                                Tiket ditutup aksesnya dari peta & publik. Proses penanganan operasional instansi tetap berjalan.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                                            data.tindakan === 'dibekukan'
                                                ? 'border-purple-500 bg-purple-50/50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tindakan"
                                            value="dibekukan"
                                            checked={data.tindakan === 'dibekukan'}
                                            onChange={(e) => setData('tindakan', e.target.value)}
                                            className="mt-0.5 text-purple-600 focus:ring-purple-500"
                                        />
                                        <div>
                                            <span className="font-semibold text-purple-900 block">
                                                Bekukan Akun Pelapor (Sanksi Berat)
                                            </span>
                                            <span className="text-slate-500">
                                                Akun dinonaktifkan secara permanen karena pelanggaran berat atau penyalahgunaan sistem.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Catatan Keputusan Moderator */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Catatan Pertimbangan Moderator <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    rows={3}
                                    placeholder="Dasar pertimbangan dan bukti temuan moderator (minimal 10 karakter)..."
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                                <div className="flex justify-between text-[11px] text-slate-400">
                                    <span>Tercatat permanen di audit log</span>
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
                                    onClick={tutupModalTindakan}
                                    disabled={processing}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || data.catatan.length < 10}
                                    className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    {processing ? 'Menerapkan...' : 'Terapkan Keputusan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

ModerasiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Moderasi Konten" breadcrumb="Admin > Moderasi">
        {page}
    </InternalLayout>
);

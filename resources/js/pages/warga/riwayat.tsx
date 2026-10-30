import { ReactNode, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    FileText,
    ThumbsUp,
    MapPin,
    Building2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Copy,
    Check,
    Plus,
    Search,
    ShieldAlert,
    ImageIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface LaporanItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    kategori_nama: string | null;
    instansi_nama: string | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    sla_tahap: string | null;
    sla_jatuh_tempo: string | null;
    dibuat_pada: string;
    tanggal_format: string;
}

interface DukunganItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    status: string;
    kategori_nama: string | null;
    instansi_nama: string | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    didukung_pada: string;
}

interface RiwayatProps {
    laporanList: LaporanItem[];
    dukunganList: DukunganItem[];
}

const STATUS_CONFIG: Record<
    string,
    { label: string; badgeClass: string; icon: typeof Clock }
> = {
    PERLU_ROUTING: {
        label: 'Menunggu Penentuan Dinas',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Clock,
    },
    DITERUSKAN: {
        label: 'Diteruskan ke Dinas',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
        icon: Building2,
    },
    DITERIMA: {
        label: 'Diterima Dinas',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: CheckCircle2,
    },
    DISURVEI: {
        label: 'Survei Lapangan',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        icon: MapPin,
    },
    TERJADWAL_ANGGARAN: {
        label: 'Dijadwalkan Anggaran',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: Calendar,
    },
    DIKERJAKAN: {
        label: 'Pengerjaan Fisik',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: Clock,
    },
    MENUNGGU_VERIFIKASI: {
        label: 'Menunggu Konfirmasi Warga',
        badgeClass:
            'bg-teal-50 text-teal-800 border-teal-200 font-semibold ring-1 ring-teal-400',
        icon: AlertCircle,
    },
    DISENGKETAKAN: {
        label: 'Sengketa Hasil',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: ShieldAlert,
    },
    MENUNGGU_KEPUTUSAN_AUDITOR: {
        label: 'Audit Investigasi',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        icon: ShieldAlert,
    },
    TERTUTUP_WARGA: {
        label: 'Selesai (Dikonfirmasi Warga)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: CheckCircle2,
    },
    TERTUTUP_AUDITOR: {
        label: 'Selesai (Keputusan Auditor)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: CheckCircle2,
    },
    USULAN_TOLAK: {
        label: 'Diusulkan Ditolak',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: AlertCircle,
    },
    DITOLAK: {
        label: 'Laporan Ditolak',
        badgeClass: 'bg-red-100 text-red-900 border-red-300',
        icon: AlertCircle,
    },
};

const KEPARAHAN_CONFIG = {
    ringan: {
        label: 'Ringan',
        class: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
    sedang: {
        label: 'Sedang',
        class: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    berat: {
        label: 'Berat',
        class: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    },
};

export default function RiwayatLaporanPage({
    laporanList = [],
    dukunganList = [],
}: RiwayatProps) {
    const [activeTab, setActiveTab] = useState<'laporan' | 'dukungan'>('laporan');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

    const handleCopy = (ticket: string) => {
        navigator.clipboard.writeText(ticket);
        setCopiedTicket(ticket);
        toast.success(`Nomor tiket ${ticket} disalin!`);
        setTimeout(() => setCopiedTicket(null), 2000);
    };

    const filteredLaporan = laporanList.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_tiket.toLowerCase().includes(q) ||
            item.judul.toLowerCase().includes(q) ||
            (item.kategori_nama && item.kategori_nama.toLowerCase().includes(q)) ||
            (item.wilayah_nama && item.wilayah_nama.toLowerCase().includes(q))
        );
    });

    const filteredDukungan = dukunganList.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.nomor_tiket.toLowerCase().includes(q) ||
            item.judul.toLowerCase().includes(q) ||
            (item.kategori_nama && item.kategori_nama.toLowerCase().includes(q)) ||
            (item.wilayah_nama && item.wilayah_nama.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            <Head title="Riwayat Laporan & Dukungan" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        Riwayat Laporan & Dukungan
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        Pantau status pengerjaan fasilitas publik yang Anda laporkan dan dukung secara transparan.
                    </p>
                </div>
                <Link
                    href="/warga/lapor"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                    <Plus className="h-4 w-4" />
                    Buat Laporan Baru
                </Link>
            </div>

            {/* Tabs & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('laporan')}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            activeTab === 'laporan'
                                ? 'bg-zinc-900 text-white shadow'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                    >
                        <FileText className="h-4 w-4" />
                        Aduan Saya
                        <span
                            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                                activeTab === 'laporan'
                                    ? 'bg-zinc-700 text-white'
                                    : 'bg-zinc-200 text-zinc-700'
                            }`}
                        >
                            {laporanList.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('dukungan')}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            activeTab === 'dukungan'
                                ? 'bg-zinc-900 text-white shadow'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                    >
                        <ThumbsUp className="h-4 w-4" />
                        Aduan Didukung
                        <span
                            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                                activeTab === 'dukungan'
                                    ? 'bg-zinc-700 text-white'
                                    : 'bg-zinc-200 text-zinc-700'
                            }`}
                        >
                            {dukunganList.length}
                        </span>
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari tiket, judul, kelurahan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                </div>
            </div>

            {/* Tab: Laporan Saya */}
            {activeTab === 'laporan' && (
                <div>
                    {filteredLaporan.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-xs">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                                {searchQuery
                                    ? 'Tidak ada laporan yang sesuai pencarian'
                                    : 'Belum Ada Laporan yang Diajukan'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                                {searchQuery
                                    ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                                    : 'Anda belum pernah mengirimkan laporan kerusakan fasilitas umum. Laporkan jalan berlubang, lampu padam, atau fasilitas rusak lainnya sekarang.'}
                            </p>
                            {!searchQuery && (
                                <div className="mt-6">
                                    <Link
                                        href="/warga/lapor"
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Buat Laporan Pertama Anda
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {filteredLaporan.map((laporan) => {
                                const statusInfo =
                                    STATUS_CONFIG[laporan.status] || {
                                        label: laporan.status,
                                        badgeClass:
                                            'bg-zinc-100 text-zinc-800 border-zinc-200',
                                        icon: Clock,
                                    };
                                const StatusIcon = statusInfo.icon;
                                const keparahanInfo =
                                    KEPARAHAN_CONFIG[laporan.keparahan] ||
                                    KEPARAHAN_CONFIG.ringan;

                                return (
                                    <div
                                        key={laporan.id}
                                        className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                                    >
                                        <div className="space-y-3">
                                            {/* Top Info Bar */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-semibold text-zinc-900">
                                                        {laporan.nomor_tiket}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(
                                                                laporan.nomor_tiket
                                                            )
                                                        }
                                                        title="Salin Nomor Tiket"
                                                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                                    >
                                                        {copiedTicket ===
                                                        laporan.nomor_tiket ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}
                                                >
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {/* Photo & Main Details */}
                                            <div className="flex gap-4">
                                                {laporan.foto_url ? (
                                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                                                        <img
                                                            src={laporan.foto_url}
                                                            alt={laporan.judul}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                                                        <ImageIcon className="h-8 w-8" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {laporan.kategori_nama && (
                                                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                                                                {laporan.kategori_nama}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded border px-2 py-0.5 text-xs ${keparahanInfo.class}`}
                                                        >
                                                            {keparahanInfo.label}
                                                        </span>
                                                    </div>

                                                    <h3 className="line-clamp-1 font-semibold text-zinc-900">
                                                        {laporan.judul}
                                                    </h3>

                                                    <p className="line-clamp-2 text-xs text-zinc-500">
                                                        {laporan.keterangan}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location & Department */}
                                            <div className="space-y-1 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600">
                                                {laporan.wilayah_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                        <span className="truncate">
                                                            {laporan.wilayah_nama}
                                                            {laporan.kota_nama &&
                                                                `, ${laporan.kota_nama}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {laporan.instansi_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                        <span className="truncate font-medium text-zinc-700">
                                                            {laporan.instansi_nama}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SLA / Target Alert if any */}
                                            {laporan.sla_jatuh_tempo && (
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>
                                                        Batas SLA Tahap{' '}
                                                        <span className="font-semibold text-zinc-700">
                                                            {laporan.sla_tahap}
                                                        </span>
                                                        : {laporan.sla_jatuh_tempo}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Callout if status MENUNGGU_VERIFIKASI */}
                                            {laporan.status ===
                                                'MENUNGGU_VERIFIKASI' && (
                                                <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/70 p-2.5 text-xs">
                                                    <div className="flex items-center gap-2 text-teal-800">
                                                        <AlertCircle className="h-4 w-4 shrink-0 text-teal-600" />
                                                        <span>
                                                            Pekerjaan fisik telah selesai diklaim dinas.
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href="/warga/verifikasi"
                                                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-teal-900 hover:underline"
                                                    >
                                                        Konfirmasi Hasil
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Bar */}
                                        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                                            <span>Diajukan {laporan.dibuat_pada}</span>
                                            <div className="flex items-center gap-1 font-medium text-zinc-600">
                                                <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>
                                                    {laporan.jumlah_dukungan} dukungan
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Aduan yang Didukung */}
            {activeTab === 'dukungan' && (
                <div>
                    {filteredDukungan.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-xs">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <ThumbsUp className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                                {searchQuery
                                    ? 'Tidak ada dukungan yang sesuai pencarian'
                                    : 'Belum Ada Aduan yang Anda Dukung'}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                                {searchQuery
                                    ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                                    : 'Saat Anda membuat laporan dan sistem mendeteksi kerusakan serupa di dekat Anda, Anda dapat memberikan dukungan untuk mempercepat prioritas penanganan.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {filteredDukungan.map((item) => {
                                const statusInfo =
                                    STATUS_CONFIG[item.status] || {
                                        label: item.status,
                                        badgeClass:
                                            'bg-zinc-100 text-zinc-800 border-zinc-200',
                                        icon: Clock,
                                    };
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-semibold text-zinc-900">
                                                        {item.nomor_tiket}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(item.nomor_tiket)
                                                        }
                                                        title="Salin Nomor Tiket"
                                                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                                    >
                                                        {copiedTicket ===
                                                        item.nomor_tiket ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}
                                                >
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <div className="flex gap-4">
                                                {item.foto_url ? (
                                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                                                        <img
                                                            src={item.foto_url}
                                                            alt={item.judul}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                                                        <ImageIcon className="h-7 w-7" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    {item.kategori_nama && (
                                                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                                                            {item.kategori_nama}
                                                        </span>
                                                    )}
                                                    <h3 className="line-clamp-1 font-semibold text-zinc-900">
                                                        {item.judul}
                                                    </h3>
                                                    <p className="line-clamp-2 text-xs text-zinc-500">
                                                        {item.keterangan}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600">
                                                {item.wilayah_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                        <span className="truncate">
                                                            {item.wilayah_nama}
                                                            {item.kota_nama &&
                                                                `, ${item.kota_nama}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.instansi_nama && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                        <span className="truncate font-medium text-zinc-700">
                                                            {item.instansi_nama}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                                            <span>Didukung {item.didukung_pada}</span>
                                            <div className="flex items-center gap-1 font-medium text-emerald-600">
                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                <span>
                                                    {item.jumlah_dukungan} dukungan warga
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

RiwayatLaporanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Riwayat Laporan & Dukungan" breadcrumb="Warga > Riwayat">
        {page}
    </InternalLayout>
);

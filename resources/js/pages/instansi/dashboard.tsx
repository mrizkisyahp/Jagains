import { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    ArrowUpRight,
    Calendar,
    ChevronRight,
    MapPin,
    Tag,
} from 'lucide-react';

interface StatistikKinerja {
    total_tiket: number;
    tiket_berjalan: number;
    tiket_lewat_sla: number;
    tiket_menunggu_verifikasi: number;
    tiket_selesai: number;
}

interface TiketPrioritas {
    id: number;
    nomor_tiket: string;
    judul: string;
    kategori: string | null;
    kelurahan: string | null;
    status: string;
    sla_jatuh_tempo: string | null;
    created_at: string;
}

interface DashboardInstansiProps {
    statistik: StatistikKinerja;
    distribusiTahap: Record<string, number>;
    tiketPrioritas: TiketPrioritas[];
}

const NAMA_STATUS: Record<string, string> = {
    DITERUSKAN: 'Diteruskan ke Unit',
    DITERIMA: 'Diterima Disposisi',
    DISURVEI: 'Tahap Survei Lapangan',
    TERJADWAL_ANGGARAN: 'Terjadwal Anggaran',
    DIKERJAKAN: 'Sedang Dikerjakan',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    DISENGKETAKAN: 'Dalam Sengketa',
    TERTUTUP_WARGA: 'Selesai & Tertutup',
};

const WARNA_STATUS: Record<string, string> = {
    DITERUSKAN: 'bg-amber-100 text-amber-800 border-amber-200',
    DITERIMA: 'bg-blue-100 text-blue-800 border-blue-200',
    DISURVEI: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    TERJADWAL_ANGGARAN: 'bg-purple-100 text-purple-800 border-purple-200',
    DIKERJAKAN: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    MENUNGGU_VERIFIKASI: 'bg-orange-100 text-orange-800 border-orange-200',
    DISENGKETAKAN: 'bg-rose-100 text-rose-800 border-rose-200',
    TERTUTUP_WARGA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function DashboardInstansiPage({
    statistik,
    distribusiTahap,
    tiketPrioritas,
}: DashboardInstansiProps) {
    const formatTanggal = (isoString: string | null) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const hitungSisaHari = (isoString: string | null) => {
        if (!isoString) return null;
        const target = new Date(isoString).getTime();
        const sekarang = new Date().getTime();
        const diffMs = target - sekarang;
        const diffHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffHari;
    };

    return (
        <div className="space-y-6">
            <Head title="Dashboard Kinerja Instansi - Jagains" />

            {/* Header Ringkasan */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Dashboard Kinerja Internal
                    </h1>
                    <p className="text-sm text-slate-500">
                        Monitoring beban kerja tiket, pemenuhan standar pelayanan (SLA), dan status penanganan unit.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/instansi/antrean"
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
                    >
                        <span>Buka Antrean Tiket</span>
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Metrik KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Total Tiket Masuk</span>
                        <div className="rounded-md bg-slate-100 p-2 text-slate-600">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                            {statistik.total_tiket.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-400">tiket</span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Sedang Diproses</span>
                        <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                            <Activity className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-700">
                            {statistik.tiket_berjalan.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-blue-500">aktif</span>
                    </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-rose-700">Terlambat SLA</span>
                        <div className="rounded-md bg-rose-100 p-2 text-rose-700">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-rose-800">
                            {statistik.tiket_lewat_sla.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-rose-600">kritis</span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Menunggu Verifikasi</span>
                        <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-orange-700">
                            {statistik.tiket_menunggu_verifikasi.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-orange-500">evaluasi</span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Tuntas Diselesaikan</span>
                        <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-700">
                            {statistik.tiket_selesai.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-emerald-500">selesai</span>
                    </div>
                </div>
            </div>

            {/* Distribusi Tahap & Tiket Prioritas SLA */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Distribusi Beban per Tahap Penanganan */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-base font-semibold text-slate-900">Distribusi Beban Kerja</h2>
                        <p className="text-xs text-slate-500">Sebaran tiket berdasarkan tahapan operasional</p>
                    </div>

                    <div className="mt-4 space-y-3">
                        {Object.entries(distribusiTahap).map(([statusKode, jumlah]) => {
                            const persen =
                                statistik.total_tiket > 0
                                    ? Math.round((jumlah / statistik.total_tiket) * 100)
                                    : 0;
                            return (
                                <div key={statusKode} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-700">
                                            {NAMA_STATUS[statusKode] || statusKode}
                                        </span>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                            <span>{jumlah}</span>
                                            <span className="text-[10px] font-normal text-slate-400">
                                                ({persen}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-teal-500 transition-all duration-300"
                                            style={{ width: `${Math.min(persen, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tiket Prioritas & SLA */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Tiket Prioritas Batas Waktu SLA
                            </h2>
                            <p className="text-xs text-slate-500">
                                Tiket aktif dengan batas waktu penanganan terdekat atau terlambat
                            </p>
                        </div>
                        <Link
                            href="/instansi/antrean"
                            className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
                        >
                            Lihat Semua
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100">
                        {tiketPrioritas.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">
                                Tidak ada tiket aktif yang memerlukan perhatian khusus saat ini.
                            </div>
                        ) : (
                            tiketPrioritas.map((tiket) => {
                                const sisaHari = hitungSisaHari(tiket.sla_jatuh_tempo);
                                const isLewatSla = sisaHari !== null && sisaHari < 0;
                                const isKritis = sisaHari !== null && sisaHari >= 0 && sisaHari <= 2;

                                return (
                                    <div
                                        key={tiket.id}
                                        className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-semibold text-slate-900">
                                                    {tiket.nomor_tiket}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium ${
                                                        WARNA_STATUS[tiket.status] || 'bg-slate-100 text-slate-800'
                                                    }`}
                                                >
                                                    {NAMA_STATUS[tiket.status] || tiket.status}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-800 line-clamp-1">
                                                {tiket.judul}
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
                                                        {tiket.kelurahan}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                    {formatTanggal(tiket.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                            <div className="text-right">
                                                <div className="text-[11px] font-medium text-slate-500">
                                                    Batas Waktu SLA
                                                </div>
                                                <div className="text-xs font-semibold">
                                                    {tiket.sla_jatuh_tempo ? (
                                                        <span
                                                            className={
                                                                isLewatSla
                                                                    ? 'text-rose-600 font-bold'
                                                                    : isKritis
                                                                    ? 'text-amber-600 font-bold'
                                                                    : 'text-slate-700'
                                                            }
                                                        >
                                                            {isLewatSla
                                                                ? `Lewat ${Math.abs(sisaHari)} Hari`
                                                                : `Sisa ${sisaHari} Hari`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </div>
                                            </div>

                                            <Link
                                                href={`/tiket/${tiket.nomor_tiket}`}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-teal-600 transition"
                                            >
                                                Detail
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

DashboardInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Dashboard Kinerja" breadcrumb="Instansi > Analitik">
        {page}
    </InternalLayout>
);

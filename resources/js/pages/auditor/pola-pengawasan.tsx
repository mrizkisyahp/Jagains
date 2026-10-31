import { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { PolaPengawasanData } from '@/types/auditor';
import {
    Activity,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    RotateCcw,
    Scale,
    TrendingDown,
    Building2,
    AlertTriangle,
} from 'lucide-react';

interface PolaPengawasanProps {
    analitik: PolaPengawasanData;
}

export default function PolaPengawasanPage({ analitik }: PolaPengawasanProps) {
    const { ringkasan, pengalihan, performa_instansi } = analitik;

    return (
        <>
            <Head title="Pola Pengawasan & Analitik Auditor" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-2xl border border-zinc-200 bg-linear-to-r from-teal-900 via-zinc-900 to-zinc-900 p-6 text-white shadow-sm dark:border-zinc-800">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
                                <Activity className="size-3.5" />
                                Monitoring Integritas Kedinasan
                            </span>
                        </div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                            Pola Pengawasan & Analitik Kepatuhan
                        </h1>
                        <p className="max-w-2xl text-xs text-zinc-300 leading-relaxed">
                            Pemantauan pola pengalihan tiket (*inter-agency bounce*), evaluasi tingkat sengketa warga, komitmen penyerapan anggaran, dan riwayat intervensi putusan Auditor Independen.
                        </p>
                    </div>
                </div>

                {/* 4 Kartu Metrik Kunci */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500">Eskalasi Aktif Terbuka</span>
                            <Scale className="size-4 text-teal-800 dark:text-teal-400" />
                        </div>
                        <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 font-numeric dark:text-zinc-100">
                            {ringkasan.eskalasi_aktif}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">Kasus membutuhkan tindak lanjut</p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500">Perintah SLA Diterbitkan</span>
                            <Clock className="size-4 text-rose-500" />
                        </div>
                        <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 font-numeric dark:text-zinc-100">
                            {ringkasan.perintah_diterbitkan}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">Instruksi percepatan resmi dinas</p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500">Perbaikan Sah Diputus</span>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 font-numeric dark:text-zinc-100">
                            {ringkasan.perbaikan_sah}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">Status TERTUTUP_AUDITOR</p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500">Perintah Kerjakan Ulang</span>
                            <RotateCcw className="size-4 text-amber-500" />
                        </div>
                        <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 font-numeric dark:text-zinc-100">
                            {ringkasan.perintah_kerja_ulang}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">Status dikembalikan ke DIKERJAKAN</p>
                    </div>
                </div>

                {/* Bagian 1: Tabel Performa & Rasio Sengketa Antar-Instansi */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                        <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Evaluasi Kepatuhan & Rasio Penolakan Warga per Instansi
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            Indikator komparatif transparansi pekerjaan fisik dan kepatuhan waktu penanganan laporan publik.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                                <tr>
                                    <th className="px-6 py-3">Instansi Pelaksana</th>
                                    <th className="px-4 py-3 text-right">Total Tiket</th>
                                    <th className="px-4 py-3 text-right">Tiket Selesai</th>
                                    <th className="px-4 py-3 text-right">Sengketa Warga</th>
                                    <th className="px-4 py-3 text-right">Rasio Sengketa</th>
                                    <th className="px-4 py-3 text-right">Pelanggaran SLA</th>
                                    <th className="px-4 py-3 text-right">Anggaran Tertahan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {performa_instansi.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-xs text-zinc-400">
                                            Belum ada data tiket penanganan fisik tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    performa_instansi.map((item) => (
                                        <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                                            <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-3.5 text-zinc-400" />
                                                    <span>{item.nama}</span>
                                                    {item.singkatan && (
                                                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                            {item.singkatan}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric text-zinc-700 dark:text-zinc-300">
                                                {item.total_tiket}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {item.tiket_selesai}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric text-amber-600 dark:text-amber-400 font-semibold">
                                                {item.tiket_sengketa}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric">
                                                <span
                                                    className={`inline-block rounded px-1.5 py-0.5 font-semibold ${
                                                        item.rasio_sengketa > 30
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                            : item.rasio_sengketa > 10
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {item.rasio_sengketa}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric text-rose-600 dark:text-rose-400 font-semibold">
                                                {item.eskalasi_sla}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-numeric text-zinc-600 dark:text-zinc-400">
                                                {item.anggaran_tertahan}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bagian 2: Pola Pengalihan Antar-Instansi (Inter-Agency Bounce) */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="size-4 text-teal-800 dark:text-teal-400" />
                        <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Matriks Pengalihan Tiket Antar-Instansi (*Inter-Agency Bounce*)
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                        Mendeteksi instansi asal yang kerap mengalihkan tanggung jawab tiket ke instansi tujuan lain, sebagai indikator perlunya penyesuaian aturan routing otomatis atau penegasan tupoksi.
                    </p>

                    <div className="mt-4">
                        {pengalihan.length === 0 ? (
                            <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 py-8 text-xs text-zinc-400 dark:border-zinc-800">
                                Belum ada riwayat pengalihan tiket tercatat antar-instansi.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {pengalihan.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {p.asal}
                                            </span>
                                            <span className="text-zinc-400">→</span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {p.tujuan}
                                            </span>
                                        </div>
                                        <span className="rounded-full bg-teal-50 px-2 py-0.5 font-mono text-xs font-bold text-teal-800 font-numeric dark:bg-teal-950/50 dark:text-teal-300">
                                            {p.total} kali
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

PolaPengawasanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Pola Pengawasan" breadcrumb="Auditor > Analitik">
        {page}
    </InternalLayout>
);

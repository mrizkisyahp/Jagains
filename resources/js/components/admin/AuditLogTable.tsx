import { useState } from 'react';
import { AuditLogItem, PaginatedData } from '@/types/audit';
import { Eye } from 'lucide-react';
import { router } from '@inertiajs/react';
import ModalDetailAuditLog from './ModalDetailAuditLog';

interface AuditLogTableProps {
    logs: PaginatedData<AuditLogItem>;
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatJam = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatAksiBadge = (aksi: string) => {
        if (aksi.includes('BUKA_IDENTITAS')) {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }
        if (aksi.includes('MODERASI') || aksi.includes('SEMBUNYIKAN')) {
            return 'bg-rose-100 text-rose-800 border-rose-200';
        }
        if (aksi.includes('ROUTING') || aksi.includes('DISPOSISI')) {
            return 'bg-blue-100 text-blue-800 border-blue-200';
        }
        if (aksi.includes('GANTI_SANDI') || aksi.includes('BUAT_AKUN')) {
            return 'bg-teal-100 text-teal-800 border-teal-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="space-y-4 w-full min-w-0">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full min-w-0">
                <div className="overflow-x-auto w-full max-w-full">
                    <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Waktu (WIB)</th>
                                <th className="p-3.5 font-semibold">Pelaku</th>
                                <th className="p-3.5 font-semibold">Jenis Aksi</th>
                                <th className="p-3.5 font-semibold">Objek / Entitas</th>
                                <th className="p-3.5 font-semibold">Tiket Terkait</th>
                                <th className="p-3.5 font-semibold">Alasan Tindakan</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Rincian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        Tidak ada catatan log audit yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                                        <td className="p-3.5 pl-4 whitespace-nowrap">
                                            <div className="font-mono font-bold text-slate-900">
                                                {formatTanggal(log.waktu)}
                                            </div>
                                            <div className="font-mono text-[11px] text-slate-500">
                                                {formatJam(log.waktu)} WIB
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <div className="font-bold text-slate-900">
                                                {log.pelaku?.username ?? 'Sistem'}
                                            </div>
                                            {log.pelaku?.peran && (
                                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {log.pelaku.peran}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-mono font-medium ${formatAksiBadge(
                                                    log.aksi
                                                )}`}
                                            >
                                                {log.aksi}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-700">
                                            {log.objek_tipe ? (
                                                <span>
                                                    <strong className="text-slate-800 font-semibold">
                                                        {log.objek_tipe}
                                                    </strong>
                                                    {log.objek_id && (
                                                        <span className="text-slate-400 ml-1">
                                                            #{log.objek_id}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 font-mono">
                                            {log.laporan ? (
                                                <a
                                                    href={`/laporan/${log.laporan.nomor_tiket}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-bold text-teal-600 hover:text-teal-700 hover:underline"
                                                >
                                                    {log.laporan.nomor_tiket}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td
                                            className="p-3.5 max-w-xs truncate text-slate-600"
                                            title={log.alasan ?? '-'}
                                        >
                                            {log.alasan || <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLog(log)}
                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition shadow-sm font-medium"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>Lihat</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                        <div>
                            Menampilkan <strong className="text-slate-700">{logs.from ?? 0}</strong> -{' '}
                            <strong className="text-slate-700">{logs.to ?? 0}</strong> dari total{' '}
                            <strong className="text-slate-700">{logs.total}</strong> rekaman
                        </div>
                        {logs.links && logs.links.length > 3 && (
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url || link.active}
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {},
                                                { preserveState: true, replace: true }
                                            )
                                        }
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                                            link.active
                                                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                                                : link.url
                                                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-sm'
                                                : 'text-slate-300 border border-transparent cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalDetailAuditLog
                log={selectedLog}
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}

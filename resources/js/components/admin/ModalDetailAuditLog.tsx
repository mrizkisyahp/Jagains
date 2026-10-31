import { AuditLogItem } from '@/types/audit';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ShieldCheck, User, Calendar, Globe, Monitor, FileText } from 'lucide-react';

interface ModalDetailAuditLogProps {
    log: AuditLogItem | null;
    open: boolean;
    onClose: () => void;
}

export default function ModalDetailAuditLog({
    log,
    open,
    onClose,
}: ModalDetailAuditLogProps) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-6">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-xs font-semibold text-teal-800">
                            ID #{log.id}
                        </span>
                        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                            {log.aksi}
                        </span>
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 pt-2">
                        Rincian Log Forensik Audit
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Rekaman append-only terlindungi pemicu integritas basis data.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-3">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Pelaku:</span>
                            <strong className="text-slate-900 font-semibold">
                                {log.pelaku?.username ?? 'Sistem / Anonim'}
                            </strong>
                            {log.pelaku?.peran && (
                                <span className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.2 text-[10px] font-bold uppercase text-slate-600">
                                    {log.pelaku.peran}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Waktu:</span>
                            <span className="font-mono text-slate-900 font-medium">
                                {new Date(log.waktu).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'medium',
                                })}
                            </span>
                        </div>

                        {log.laporan && (
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="text-slate-500">Tiket Terkait:</span>
                                <a
                                    href={`/laporan/${log.laporan.nomor_tiket}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono font-bold text-teal-600 hover:underline"
                                >
                                    {log.laporan.nomor_tiket}
                                </a>
                                <span className="text-slate-500 truncate max-w-xs">
                                    ({log.laporan.judul})
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Alamat IP:</span>
                            <code className="font-mono text-xs text-slate-800">{log.konteks?.ip ?? '-'}</code>
                        </div>

                        <div className="flex items-center gap-2 truncate">
                            <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Perangkat:</span>
                            <span className="truncate text-slate-700" title={log.konteks?.user_agent ?? '-'}>
                                {log.konteks?.user_agent ?? '-'}
                            </span>
                        </div>
                    </div>

                    {/* Alasan Aksi */}
                    {log.alasan && (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Alasan / Catatan Tindakan
                            </h4>
                            <p className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                                &ldquo;{log.alasan}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Komparasi Nilai Lama vs Nilai Baru */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Nilai Sebelum Diubah (Old Value)
                            </h4>
                            <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs overflow-x-auto text-slate-800 max-h-48">
                                {log.nilai_lama ? JSON.stringify(log.nilai_lama, null, 2) : '(Kosong / Objek Baru)'}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                                Nilai Sesudah Diubah (New Value)
                            </h4>
                            <pre className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 font-mono text-xs overflow-x-auto text-teal-950 max-h-48">
                                {log.nilai_baru ? JSON.stringify(log.nilai_baru, null, 2) : '(Kosong / Dihapus)'}
                            </pre>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

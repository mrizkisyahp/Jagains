import { EskalasiItem, PemicuEskalasi } from '@/types/auditor';
import { AlertCircle, ArrowRight, Clock, Building2, MapPin, Scale, ShieldAlert, AlertTriangle } from 'lucide-react';

interface KartuEskalasiProps {
    eskalasi: EskalasiItem;
    onBukaPerkara: (eskalasiId: number) => void;
}

export function getPemicuBadge(pemicu: PemicuEskalasi) {
    switch (pemicu) {
        case 'SLA':
            return {
                label: 'Keterlambatan SLA',
                icon: Clock,
                classes: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800',
            };
        case 'SANGGAHAN':
            return {
                label: 'Sanggahan Instansi',
                icon: ShieldAlert,
                classes: 'bg-violet-500/10 text-violet-700 border-violet-300 dark:text-violet-400 dark:border-violet-800',
            };
        case 'RONDE':
            return {
                label: 'Sengketa Ronde 4x (Buntu)',
                icon: AlertTriangle,
                classes: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800',
            };
        case 'TANPA_KUORUM':
            return {
                label: '14 Hari Tanpa Kuorum',
                icon: AlertCircle,
                classes: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-800',
            };
    }
}

export default function KartuEskalasi({ eskalasi, onBukaPerkara }: KartuEskalasiProps) {
    const badge = getPemicuBadge(eskalasi.pemicu);
    const BadgeIcon = badge.icon;
    const { laporan } = eskalasi;

    const formattedDate = new Date(eskalasi.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <div>
                {/* Header: Pemicu Badge & Waktu Masuk */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
                            <BadgeIcon className="size-3.5" />
                            {badge.label}
                        </span>
                        {eskalasi.tahap && (
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Tahap {eskalasi.tahap}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-400 font-numeric dark:text-zinc-500">
                        Masuk {formattedDate}
                    </span>
                </div>

                {/* Nomor Tiket & Judul */}
                <div className="mt-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold tracking-tight text-teal-800 dark:text-teal-400">
                            {laporan.nomor_tiket}
                        </span>
                        {laporan.kategori && (
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {laporan.kategori.nama}
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 line-clamp-1 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {laporan.judul}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {laporan.keterangan}
                    </p>
                </div>

                {/* Lokasi & Instansi */}
                <div className="mt-4 space-y-1.5 rounded-lg bg-zinc-50/80 p-2.5 text-xs dark:bg-zinc-800/40">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Building2 className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-medium">
                            {laporan.instansi?.nama || 'Instansi Terkait'}
                        </span>
                        {laporan.instansi?.singkatan && (
                            <span className="rounded bg-zinc-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                                {laporan.instansi.singkatan}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <MapPin className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">
                            Kelurahan {laporan.kelurahan?.nama || '-'}
                        </span>
                    </div>
                </div>

                {/* Keterlambatan SLA Info Bar (jika SLA) */}
                {eskalasi.pemicu === 'SLA' && eskalasi.hari_terlambat > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400">
                        <Clock className="size-3.5 shrink-0 text-rose-500" />
                        <span>Terlambat <strong className="font-numeric">{eskalasi.hari_terlambat} hari kerja</strong> dari batas SLA resmi.</span>
                    </div>
                )}
            </div>

            {/* Tombol Aksi */}
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => onBukaPerkara(eskalasi.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    <Scale className="size-4" />
                    <span>Telaah Perkara & Putuskan</span>
                    <ArrowRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

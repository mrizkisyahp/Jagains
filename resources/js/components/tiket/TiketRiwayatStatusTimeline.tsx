import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Building2, FileText, GitFork, ShieldCheck, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InstansiStatusBadge, {
    formatInstansiMessage,
} from '@/components/instansi/InstansiStatusBadge';
import { cn } from '@/lib/utils';
import type {
    LampiranFoto,
    PengalihanItem,
    RiwayatStatusItem,
} from '@/types/tiket';

interface TiketRiwayatStatusTimelineProps {
    riwayatStatus: RiwayatStatusItem[];
    pengalihan?: PengalihanItem[];
    tiketStatus?: string;
    nomorTiket?: string;
    onBeriSuara?: () => void;
    onPreviewPhoto?: (photo: LampiranFoto) => void;
    className?: string;
}

export default function TiketRiwayatStatusTimeline({
    riwayatStatus,
    pengalihan,
    tiketStatus,
    nomorTiket,
    onBeriSuara,
    onPreviewPhoto,
    className,
}: TiketRiwayatStatusTimelineProps) {
    // 2. Timeline Ordering: Selalu Descending Kronologis (Terbaru di Atas, Terlama di Bawah)
    const sortedRiwayat = useMemo(() => {
        if (!riwayatStatus || riwayatStatus.length === 0) {
            return [];
        }

        return [...riwayatStatus].sort((a, b) => {
            const timeA = new Date(a.waktu).getTime();
            const timeB = new Date(b.waktu).getTime();

            // Primary order: timestamp descending (terbaru paling atas)
            if (timeB !== timeA) {
                return timeB - timeA;
            }

            // Secondary order: deterministik berdasarkan ID descending
            return b.id - a.id;
        });
    }, [riwayatStatus]);

    const formatDateTime = (isoString?: string | null) => {
        if (!isoString) return '-';
        try {
            const d = new Date(isoString);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(d);
        } catch {
            return isoString;
        }
    };

    const handleBeriSuara = () => {
        if (onBeriSuara) {
            onBeriSuara();
            return;
        }
        if (nomorTiket) {
            router.visit(`/warga/verifikasi/${nomorTiket}?from=tiket`);
        }
    };

    if (sortedRiwayat.length === 0 && (!pengalihan || pengalihan.length === 0)) {
        return (
            <div
                className={cn(
                    'rounded-2xl border border-dashed border-border/80 bg-card p-6 sm:p-8 text-center text-muted-foreground text-body-sm shadow-2xs',
                    className,
                )}
            >
                Belum ada riwayat penanganan status untuk tiket ini.
            </div>
        );
    }

    return (
        <div
            className={cn(
                'rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xs space-y-6',
                className,
            )}
        >
            {/* Riwayat Pengalihan Antar-Dinas (jika ada) */}
            {pengalihan && pengalihan.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-caption-xs sm:text-body-sm">
                        <GitFork className="size-4 shrink-0" />
                        <span>Catatan Pengalihan Kewenangan Dinas ({pengalihan.length})</span>
                    </div>
                    <div className="space-y-2">
                        {pengalihan.map((p) => (
                            <div
                                key={p.id}
                                className="rounded-lg bg-card/90 p-3 border border-border/60 text-caption-xs space-y-1 shadow-2xs"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        {p.instansi_asal} &rarr; {p.instansi_tujuan}
                                    </span>
                                    <time className="font-mono">{formatDateTime(p.waktu)}</time>
                                </div>
                                {p.alasan && (
                                    <p className="italic text-muted-foreground">
                                        &ldquo;{p.alasan}&rdquo;
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Vertikal: Garis & Dot Marker di Sisi Kiri, Konten di Kanan */}
            {sortedRiwayat.length > 0 ? (
                <ol className="relative">
                    {sortedRiwayat.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === sortedRiwayat.length - 1;
                        const komparasi = item.detail?.komparasi_foto;
                        const beritaAcara = item.detail?.berita_acara?.terkini;

                        // Verifikasi Warga di backend direpresentasikan oleh 'MENUNGGU_VERIFIKASI'
                        const isVerifikasiWarga = item.status_baru === 'MENUNGGU_VERIFIKASI';
                        // Hanya aktif jika status saat ini pada tiket masih 'MENUNGGU_VERIFIKASI'
                        const isVerifikasiAktif = isVerifikasiWarga && tiketStatus === 'MENUNGGU_VERIFIKASI';

                        return (
                            <li
                                key={item.id}
                                className="relative pl-7 sm:pl-9 pb-7 sm:pb-8 last:pb-1 group"
                            >
                                {/* Garis Vertikal (Connector Line) */}
                                {!isLast && (
                                    <span
                                        className="absolute left-[5px] top-[14px] -bottom-[14px] w-[2px] bg-border transition-colors group-hover:bg-muted-foreground/30"
                                        aria-hidden="true"
                                    />
                                )}

                                {/* Dot / Circle Marker (Tepat di atas Garis Vertikal) */}
                                <span
                                    className={cn(
                                        'absolute left-0 top-[7px] size-3 rounded-full ring-4 ring-card z-10 transition-all',
                                        isFirst
                                            ? 'bg-foreground shadow-xs'
                                            : 'bg-muted-foreground/70',
                                    )}
                                    aria-hidden="true"
                                />

                                {/* Konten Riwayat di Sisi Kanan Garis */}
                                <div className="space-y-2.5 min-w-0">
                                    {/* Baris 1: Status Badge & Waktu */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <InstansiStatusBadge status={item.status_baru} />
                                            {isFirst && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                    Status Terkini
                                                </span>
                                            )}
                                        </div>
                                        <time
                                            dateTime={item.waktu}
                                            className="text-caption-xs sm:text-body-sm font-mono text-muted-foreground"
                                        >
                                            {formatDateTime(item.waktu)}
                                        </time>
                                    </div>

                                    {/* Baris 2: Instansi Penanggung Jawab & Aktor */}
                                    <div className="flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                                        <Building2 className="size-4 text-muted-foreground shrink-0" />
                                        <span>
                                            {item.instansi_nama ??
                                                (item.peran_pelaku === 'sistem'
                                                    ? 'Sistem Jagains'
                                                    : `Petugas ${item.peran_pelaku}`)}
                                        </span>
                                    </div>

                                    {/* Baris 3: Catatan / Deskripsi Perubahan Status */}
                                    {item.catatan && (
                                        <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {formatInstansiMessage(item.catatan)}
                                        </p>
                                    )}

                                    {/* Baris 4: Informasi Tambahan (Ringkasan Berita Acara jika ada) */}
                                    {beritaAcara && (
                                        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-3.5 space-y-1.5 text-caption-xs sm:text-body-sm">
                                            <div className="flex items-center justify-between text-muted-foreground font-semibold">
                                                <span className="flex items-center gap-1.5 text-foreground">
                                                    <FileText className="size-3.5 text-primary" />
                                                    <span>
                                                        Berita Acara Pengerjaan (Versi {beritaAcara.versi})
                                                    </span>
                                                </span>
                                                <span>{beritaAcara.instansi_nama}</span>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-2">
                                                <strong className="text-foreground font-medium">Hasil: </strong>
                                                {beritaAcara.hasil}
                                            </p>
                                        </div>
                                    )}

                                    {/* Baris 5: Dokumentasi Foto (Sebelum / Sesudah jika tersedia) */}
                                    {komparasi && (komparasi.sebelum || komparasi.sesudah) && (
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            {komparasi.sebelum && (
                                                <figure
                                                    onClick={() =>
                                                        onPreviewPhoto?.(komparasi.sebelum!)
                                                    }
                                                    className="group/photo relative size-16 sm:size-20 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-foreground/40 transition-all shrink-0"
                                                    title="Lihat Foto Sebelum Pengerjaan"
                                                >
                                                    <img
                                                        src={komparasi.sebelum.url}
                                                        alt="Foto Sebelum Pengerjaan"
                                                        className="size-full object-cover transition duration-200 group-hover/photo:scale-105"
                                                    />
                                                    <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                        Sebelum
                                                    </span>
                                                    <span className="absolute top-1 right-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition group-hover/photo:opacity-100">
                                                        <ZoomIn className="size-3" />
                                                    </span>
                                                </figure>
                                            )}
                                            {komparasi.sesudah && (
                                                <figure
                                                    onClick={() =>
                                                        onPreviewPhoto?.(komparasi.sesudah!)
                                                    }
                                                    className="group/photo relative size-16 sm:size-20 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-foreground/40 transition-all shrink-0"
                                                    title="Lihat Foto Sesudah Pengerjaan"
                                                >
                                                    <img
                                                        src={komparasi.sesudah.url}
                                                        alt="Foto Sesudah Pengerjaan"
                                                        className="size-full object-cover transition duration-200 group-hover/photo:scale-105"
                                                    />
                                                    <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                        Sesudah
                                                    </span>
                                                    <span className="absolute top-1 right-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition group-hover/photo:opacity-100">
                                                        <ZoomIn className="size-3" />
                                                    </span>
                                                </figure>
                                            )}
                                        </div>
                                    )}

                                    {/* Baris 6: Tombol Beri Suara (HANYA muncul jika Verifikasi Warga masih aktif) */}
                                    {isVerifikasiAktif && (
                                        <div className="pt-1">
                                            <Button
                                                type="button"
                                                onClick={handleBeriSuara}
                                                className="h-9 px-4 rounded-xl text-body-sm font-bold gap-2 cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                                            >
                                                <ShieldCheck className="size-4" />
                                                <span>Beri Suara</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            ) : null}
        </div>
    );
}

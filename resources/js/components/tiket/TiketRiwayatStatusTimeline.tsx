import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    FileText,
    GitFork,
    ShieldCheck,
    XCircle,
    ZoomIn,
} from 'lucide-react';
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

    if (
        sortedRiwayat.length === 0 &&
        (!pengalihan || pengalihan.length === 0)
    ) {
        return (
            <div
                className={cn(
                    'rounded-2xl border border-dashed border-border/80 bg-card p-6 text-center text-body-sm text-muted-foreground shadow-2xs sm:p-8',
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
                'space-y-6 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-7',
                className,
            )}
        >
            {/* Riwayat Pengalihan Antar-Dinas (jika ada) */}
            {pengalihan && pengalihan.length > 0 && (
                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-caption-xs font-bold text-amber-700 sm:text-body-sm dark:text-amber-400">
                        <GitFork className="size-4 shrink-0" />
                        <span>
                            Catatan Pengalihan Kewenangan Dinas (
                            {pengalihan.length})
                        </span>
                    </div>
                    <div className="space-y-2">
                        {pengalihan.map((p) => (
                            <div
                                key={p.id}
                                className="space-y-1 rounded-lg border border-border/60 bg-card/90 p-3 text-caption-xs shadow-2xs"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        {p.instansi_asal} &rarr;{' '}
                                        {p.instansi_tujuan}
                                    </span>
                                    <time className="font-mono">
                                        {formatDateTime(p.waktu)}
                                    </time>
                                </div>
                                {p.alasan && (
                                    <p className="text-muted-foreground italic">
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
                        const verifikasi = item.detail?.verifikasi_ringkasan;

                        // Verifikasi Warga di backend direpresentasikan oleh 'MENUNGGU_VERIFIKASI'
                        const isVerifikasiWarga =
                            item.status_baru === 'MENUNGGU_VERIFIKASI';
                        // Hanya aktif jika status saat ini pada tiket masih 'MENUNGGU_VERIFIKASI'
                        const isVerifikasiAktif =
                            isVerifikasiWarga &&
                            tiketStatus === 'MENUNGGU_VERIFIKASI';

                        return (
                            <li
                                key={item.id}
                                className="group relative pb-7 pl-7 last:pb-1 sm:pb-8 sm:pl-9"
                            >
                                {/* Garis Vertikal (Connector Line) */}
                                {!isLast && (
                                    <span
                                        className="absolute top-[14px] -bottom-[14px] left-[5px] w-[2px] bg-border transition-colors group-hover:bg-muted-foreground/30"
                                        aria-hidden="true"
                                    />
                                )}

                                {/* Dot / Circle Marker (Tepat di atas Garis Vertikal) */}
                                <span
                                    className={cn(
                                        'absolute top-[7px] left-0 z-10 size-3 rounded-full ring-4 ring-card transition-all',
                                        isFirst
                                            ? 'bg-foreground shadow-xs'
                                            : 'bg-muted-foreground/70',
                                    )}
                                    aria-hidden="true"
                                />

                                {/* Konten Riwayat di Sisi Kanan Garis */}
                                <div className="min-w-0 space-y-2.5">
                                    {/* Baris 1: Status Badge & Waktu */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <InstansiStatusBadge
                                                status={item.status_baru}
                                            />
                                            {isFirst && (
                                                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    Status Terkini
                                                </span>
                                            )}
                                        </div>
                                        <time
                                            dateTime={item.waktu}
                                            className="text-caption-xs font-mono text-muted-foreground sm:text-body-sm"
                                        >
                                            {formatDateTime(item.waktu)}
                                        </time>
                                    </div>

                                    {/* Baris 2: Instansi Penanggung Jawab & Aktor */}
                                    <div className="flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                        <span>
                                            {item.instansi_nama ??
                                                (item.peran_pelaku === 'sistem'
                                                    ? 'Sistem Jagains'
                                                    : `Petugas ${item.peran_pelaku}`)}
                                        </span>
                                    </div>

                                    {/* Baris 3: Catatan / Deskripsi Perubahan Status */}
                                    {item.catatan && (
                                        <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                            {formatInstansiMessage(
                                                item.catatan,
                                            )}
                                        </p>
                                    )}

                                    {/* Baris 4: Informasi Tambahan (Ringkasan Berita Acara jika ada) */}
                                    {beritaAcara && (
                                        <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-caption-xs sm:p-3.5 sm:text-body-sm">
                                            <div className="flex items-center justify-between font-semibold text-muted-foreground">
                                                <span className="flex items-center gap-1.5 text-foreground">
                                                    <FileText className="size-3.5 text-primary" />
                                                    <span>
                                                        Berita Acara Pengerjaan
                                                        (Versi{' '}
                                                        {beritaAcara.versi})
                                                    </span>
                                                </span>
                                                <span>
                                                    {beritaAcara.instansi_nama}
                                                </span>
                                            </div>
                                            <p className="line-clamp-2 text-muted-foreground">
                                                <strong className="font-medium text-foreground">
                                                    Hasil:{' '}
                                                </strong>
                                                {beritaAcara.hasil}
                                            </p>
                                        </div>
                                    )}

                                    {/* Baris 5: Dokumentasi Foto (Sebelum / Sesudah jika tersedia) */}
                                    {komparasi &&
                                        (komparasi.sebelum ||
                                            komparasi.sesudah) && (
                                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                                {komparasi.sebelum && (
                                                    <figure
                                                        onClick={() =>
                                                            onPreviewPhoto?.(
                                                                komparasi.sebelum!,
                                                            )
                                                        }
                                                        className="group/photo relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-muted transition-all hover:border-foreground/40 sm:size-20"
                                                        title="Lihat Foto Sebelum Pengerjaan"
                                                    >
                                                        <img
                                                            src={
                                                                komparasi
                                                                    .sebelum.url
                                                            }
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
                                                            onPreviewPhoto?.(
                                                                komparasi.sesudah!,
                                                            )
                                                        }
                                                        className="group/photo relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-muted transition-all hover:border-foreground/40 sm:size-20"
                                                        title="Lihat Foto Sesudah Pengerjaan"
                                                    >
                                                        <img
                                                            src={
                                                                komparasi
                                                                    .sesudah.url
                                                            }
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

                                    {/* Baris 6: Penghitungan Suara Verifikasi (Count Verif) */}
                                    {verifikasi && (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-caption-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3.5" />
                                                <span>
                                                    +
                                                    {
                                                        verifikasi.suara_setuju_bobot
                                                    }{' '}
                                                    Sesuai
                                                </span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-caption-xs font-semibold text-destructive">
                                                <XCircle className="size-3.5" />
                                                <span>
                                                    -
                                                    {
                                                        verifikasi.suara_tolak_bobot
                                                    }{' '}
                                                    Tidak Sesuai
                                                </span>
                                            </span>
                                            <span className="text-caption-xs font-medium text-muted-foreground">
                                                ({verifikasi.total_pemilih}{' '}
                                                suara · Target{' '}
                                                {verifikasi.target_k} K)
                                            </span>
                                        </div>
                                    )}

                                    {/* Baris 7: Tombol Beri Suara (HANYA muncul jika Verifikasi Warga masih aktif) */}
                                    {isVerifikasiAktif && (
                                        <div className="pt-1">
                                            <Button
                                                type="button"
                                                onClick={handleBeriSuara}
                                                className="h-9 cursor-pointer gap-2 rounded-xl bg-primary px-4 text-body-sm font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
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

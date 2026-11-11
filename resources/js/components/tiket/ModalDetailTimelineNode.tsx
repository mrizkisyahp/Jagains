import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    XCircle,
    Camera,
    MapPin,
    FileText,
    History,
    ShieldCheck,
    ZoomIn,
    ImageIcon,
    Clock,
    Scale,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    LampiranFoto,
    RiwayatStatusItem,
    BeritaAcaraItem,
    PemilihVerifikasiItem,
} from '@/types/tiket';
import InstansiStatusBadge from '@/components/instansi/InstansiStatusBadge';

interface ModalDetailTimelineNodeProps {
    open: boolean;
    onClose: () => void;
    item: RiwayatStatusItem | null;
    nomorTiket: string;
    onPreviewPhoto?: (photo: LampiranFoto) => void;
}

export default function ModalDetailTimelineNode({
    open,
    onClose,
    item,
    nomorTiket,
    onPreviewPhoto,
}: ModalDetailTimelineNodeProps) {
    const [selectedTab, setSelectedTab] = useState<'dokumen' | 'verifikasi'>(
        'dokumen',
    );
    const [openRevisiId, setOpenRevisiId] = useState<number | null>(null);

    if (!item) return null;

    const detail = item.detail;
    const komparasi = detail?.komparasi_foto;
    const fotoSebelum = komparasi?.sebelum;
    const fotoSesudah = komparasi?.sesudah;
    const isFotoSebelumAsli = Boolean(komparasi?.sebelum_asli);

    const beritaAcaraTerkini = detail?.berita_acara?.terkini;
    const riwayatVersi = detail?.berita_acara?.riwayat_versi ?? [];
    const versiLama = riwayatVersi.filter(
        (v) => v.id !== beritaAcaraTerkini?.id,
    );

    const verifikasi = detail?.verifikasi_ringkasan;
    const daftarPemilih: PemilihVerifikasiItem[] =
        verifikasi?.daftar_pemilih ?? [];
    const catatanAuditor = detail?.catatan_auditor ?? [];

    const formatDate = (isoString?: string | null) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-2xl">
                {/* Header Modal */}
                <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 pr-14 sm:pr-16">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <InstansiStatusBadge status={item.status_baru} />
                            <span className="text-caption-xs font-mono text-muted-foreground">
                                #{nomorTiket}
                            </span>
                        </div>
                        <time className="flex shrink-0 items-center gap-1 text-caption-xs text-muted-foreground">
                            <Clock className="size-3.5" />
                            {formatDate(item.waktu)}
                        </time>
                    </div>
                    <DialogTitle className="mt-2 text-title-lg font-semibold text-foreground">
                        {item.tipe_detail === 'auditor'
                            ? 'Detail Putusan & Hasil Arbitrase Auditor'
                            : 'Detail Hasil Pekerjaan & Verifikasi Warga'}
                    </DialogTitle>
                    <DialogDescription className="text-body-sm text-muted-foreground">
                        {item.catatan ||
                            'Dokumentasi komparasi foto fisik, berita acara, dan progres kuorum verifikasi.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Body Modal dengan Tab */}
                {item.tipe_detail === 'verifikasi' ? (
                    <Tabs
                        value={selectedTab}
                        onValueChange={(val) =>
                            setSelectedTab(val as 'dokumen' | 'verifikasi')
                        }
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="shrink-0 border-b border-border bg-background px-5 pt-3">
                            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
                                <TabsTrigger
                                    value="dokumen"
                                    className="gap-2 text-body-sm"
                                >
                                    <FileText className="size-4" />
                                    <span>Hasil & Berita Acara</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="verifikasi"
                                    className="gap-2 text-body-sm"
                                >
                                    <ShieldCheck className="size-4" />
                                    <span>
                                        Daftar Verifikasi Warga
                                        {daftarPemilih.length > 0 && (
                                            <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                                {daftarPemilih.length}
                                            </span>
                                        )}
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB 1: Berita Acara & Komparasi Foto */}
                        <TabsContent
                            value="dokumen"
                            className="m-0 flex-1 space-y-6 overflow-y-auto p-5"
                        >
                            {/* Komparasi Foto Sebelum vs Sesudah */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-body-base font-semibold text-foreground">
                                        <Camera className="size-4 text-primary" />
                                        <span>
                                            Komparasi Foto Fisik Lapangan
                                        </span>
                                    </h4>
                                    <span className="text-caption-xs text-muted-foreground">
                                        Sebelum vs Sesudah
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Card Foto Sebelum */}
                                    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3.5 py-2.5">
                                            <span className="text-caption-xs font-semibold text-foreground">
                                                Kondisi Sebelum
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="px-1.5 py-0 text-[10px]"
                                            >
                                                {isFotoSebelumAsli
                                                    ? 'Foto Petugas (Sebelum)'
                                                    : 'Foto Laporan Awal Warga'}
                                            </Badge>
                                        </div>
                                        <div className="group relative flex aspect-video items-center justify-center overflow-hidden bg-muted/20">
                                            {fotoSebelum ? (
                                                <>
                                                    <img
                                                        src={fotoSebelum.url}
                                                        alt="Foto sebelum pengerjaan"
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="size-full object-cover"
                                                    />
                                                    {onPreviewPhoto && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onPreviewPhoto(
                                                                    fotoSebelum,
                                                                )
                                                            }
                                                            className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <ZoomIn className="size-4" />
                                                            <span>
                                                                Perbesar Foto
                                                            </span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-4 text-center text-muted-foreground">
                                                    <ImageIcon className="mx-auto mb-1 size-8 opacity-40" />
                                                    <p className="text-caption-xs">
                                                        Foto belum tersedia
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {fotoSebelum && (
                                            <div className="space-y-1 border-t border-border bg-muted/10 p-2.5 text-[11px] text-muted-foreground">
                                                <p>
                                                    Waktu:{' '}
                                                    {formatDate(
                                                        fotoSebelum.created_at,
                                                    )}
                                                </p>
                                                {fotoSebelum.jarak_m !==
                                                    null && (
                                                    <p className="flex items-center gap-1">
                                                        <MapPin className="size-3 text-primary" />
                                                        <span>
                                                            Radius:{' '}
                                                            {
                                                                fotoSebelum.jarak_m
                                                            }
                                                            m dari titik tiket
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Foto Sesudah */}
                                    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3.5 py-2.5">
                                            <span className="text-caption-xs font-semibold text-foreground">
                                                Hasil Sesudah Perbaikan
                                            </span>
                                            <Badge
                                                variant="default"
                                                className="bg-emerald-600 px-1.5 py-0 text-[10px] hover:bg-emerald-600"
                                            >
                                                Petugas Instansi
                                            </Badge>
                                        </div>
                                        <div className="group relative flex aspect-video items-center justify-center overflow-hidden bg-muted/20">
                                            {fotoSesudah ? (
                                                <>
                                                    <img
                                                        src={fotoSesudah.url}
                                                        alt="Foto sesudah pengerjaan"
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="size-full object-cover"
                                                    />
                                                    {onPreviewPhoto && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onPreviewPhoto(
                                                                    fotoSesudah,
                                                                )
                                                            }
                                                            className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <ZoomIn className="size-4" />
                                                            <span>
                                                                Perbesar Foto
                                                            </span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-4 text-center text-muted-foreground">
                                                    <ImageIcon className="mx-auto mb-1 size-8 opacity-40" />
                                                    <p className="text-caption-xs">
                                                        Foto sesudah belum
                                                        diunggah
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {fotoSesudah && (
                                            <div className="space-y-1 border-t border-border bg-muted/10 p-2.5 text-[11px] text-muted-foreground">
                                                <p>
                                                    Waktu:{' '}
                                                    {formatDate(
                                                        fotoSesudah.created_at,
                                                    )}
                                                </p>
                                                {fotoSesudah.jarak_m !==
                                                    null && (
                                                    <p className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                                        <MapPin className="size-3" />
                                                        <span>
                                                            Geofence GPS Cocok (
                                                            {
                                                                fotoSesudah.jarak_m
                                                            }
                                                            m)
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Dokumen Berita Acara (1 Berita Acara per Pengerjaan & Tracking Revisi) */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-body-base font-semibold text-foreground">
                                        <FileText className="size-4 text-primary" />
                                        <span>
                                            Berita Acara Pengerjaan Fisik
                                        </span>
                                    </h4>
                                    {beritaAcaraTerkini && (
                                        <Badge
                                            variant="outline"
                                            className="text-caption-xs"
                                        >
                                            Versi {beritaAcaraTerkini.versi}{' '}
                                            (Aktif)
                                        </Badge>
                                    )}
                                </div>

                                {beritaAcaraTerkini ? (
                                    <div className="space-y-3.5 rounded-xl border border-border bg-card p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                            <div>
                                                <p className="text-body-sm font-semibold text-foreground">
                                                    {
                                                        beritaAcaraTerkini.instansi_nama
                                                    }
                                                </p>
                                                <p className="text-caption-xs text-muted-foreground">
                                                    Diterbitkan:{' '}
                                                    {formatDate(
                                                        beritaAcaraTerkini.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="text-[11px]"
                                            >
                                                Versi {beritaAcaraTerkini.versi}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 text-body-sm">
                                            <div>
                                                <dt className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    Uraian Kegiatan Fisik
                                                </dt>
                                                <dd className="mt-1 leading-relaxed whitespace-pre-wrap text-foreground">
                                                    {
                                                        beritaAcaraTerkini.kegiatan
                                                    }
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    Hasil Capaian Pekerjaan
                                                </dt>
                                                <dd className="mt-1 leading-relaxed whitespace-pre-wrap text-foreground">
                                                    {beritaAcaraTerkini.hasil}
                                                </dd>
                                            </div>

                                            {beritaAcaraTerkini.hambatan && (
                                                <div>
                                                    <dt className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                        Kendala Lapangan
                                                    </dt>
                                                    <dd className="mt-1 leading-relaxed whitespace-pre-wrap text-foreground">
                                                        {
                                                            beritaAcaraTerkini.hambatan
                                                        }
                                                    </dd>
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Revisi (Tracking Revisi Draf Lama) */}
                                        {versiLama.length > 0 && (
                                            <div className="space-y-2 border-t border-border/70 pt-3">
                                                <div className="flex items-center gap-1.5 text-caption-xs font-semibold text-muted-foreground">
                                                    <History className="size-3.5 text-primary" />
                                                    <span>
                                                        Riwayat Revisi (
                                                        {versiLama.length}{' '}
                                                        revisi sebelumnya)
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {versiLama.map((ba) => (
                                                        <div
                                                            key={ba.id}
                                                            className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-3 text-caption-xs"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-foreground">
                                                                    Versi{' '}
                                                                    {ba.versi}{' '}
                                                                    (Revisi
                                                                    Sebelumnya)
                                                                </span>
                                                                <time className="text-muted-foreground">
                                                                    {formatDate(
                                                                        ba.created_at,
                                                                    )}
                                                                </time>
                                                            </div>
                                                            <p className="line-clamp-2 text-muted-foreground">
                                                                <strong className="text-foreground">
                                                                    Kegiatan:
                                                                </strong>{' '}
                                                                {ba.kegiatan}
                                                            </p>
                                                            <p className="line-clamp-2 text-muted-foreground">
                                                                <strong className="text-foreground">
                                                                    Hasil:
                                                                </strong>{' '}
                                                                {ba.hasil}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                        <FileText className="mx-auto mb-2 size-8 opacity-40" />
                                        <p className="text-body-sm font-medium">
                                            Belum ada Berita Acara yang
                                            diterbitkan
                                        </p>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 2: Daftar Verifikasi Warga */}
                        <TabsContent
                            value="verifikasi"
                            className="m-0 flex-1 space-y-5 overflow-y-auto p-5"
                        >
                            {/* Banner Ringkasan Kuorum */}
                            {verifikasi ? (
                                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h5 className="flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                                                <Scale className="size-4 text-primary" />
                                                <span>
                                                    Kuorum Verifikasi Ronde #
                                                    {verifikasi.nomor_ronde}
                                                </span>
                                            </h5>
                                            <p className="text-caption-xs text-muted-foreground">
                                                Batas Akhir:{' '}
                                                {formatDate(
                                                    verifikasi.batas_waktu,
                                                )}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                verifikasi.hasil === 'setuju'
                                                    ? 'default'
                                                    : verifikasi.hasil ===
                                                        'tolak'
                                                      ? 'destructive'
                                                      : 'secondary'
                                            }
                                            className="text-caption-xs capitalize"
                                        >
                                            {verifikasi.hasil
                                                ? `Hasil: ${verifikasi.hasil}`
                                                : 'Sedang Berlangsung'}
                                        </Badge>
                                    </div>

                                    {/* Progress Bar Kuorum */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-caption-xs">
                                            <span className="text-muted-foreground">
                                                Capaian Kuorum:{' '}
                                                <strong>
                                                    {
                                                        verifikasi.suara_setuju_bobot
                                                    }
                                                </strong>{' '}
                                                / {verifikasi.target_k} Bobot
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {verifikasi.persentase_setuju}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-emerald-600 transition-all duration-500 dark:bg-emerald-500"
                                                style={{
                                                    width: `${Math.min(100, verifikasi.persentase_setuju)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Grid Statistik Bobot */}
                                    <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2 text-center text-caption-xs">
                                        <div className="rounded-lg border border-border/60 bg-background p-2">
                                            <p className="text-muted-foreground">
                                                Total Pemilih
                                            </p>
                                            <p className="text-body-base font-bold text-foreground">
                                                {verifikasi.total_pemilih}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/60 bg-background p-2">
                                            <p className="text-muted-foreground">
                                                Bobot Setuju
                                            </p>
                                            <p className="text-body-base font-bold text-emerald-600">
                                                {verifikasi.suara_setuju_bobot}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/60 bg-background p-2">
                                            <p className="text-muted-foreground">
                                                Bobot Menolak
                                            </p>
                                            <p className="text-body-base font-bold text-destructive">
                                                {verifikasi.suara_tolak_bobot}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-border p-4 text-center text-caption-xs text-muted-foreground">
                                    Data kuorum verifikasi belum dibuka.
                                </div>
                            )}

                            {/* Daftar Suara Warga (Zero-Knowledge Privacy: Warga #1, #2, dll) */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-body-base font-semibold text-foreground">
                                        <ShieldCheck className="size-4 text-primary" />
                                        <span>Daftar Suara Masuk</span>
                                    </h4>
                                    <span className="text-caption-xs text-muted-foreground">
                                        Privasi Terjamin (Anonim)
                                    </span>
                                </div>

                                {daftarPemilih.length > 0 ? (
                                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                                        {daftarPemilih.map((voter) => (
                                            <div
                                                key={voter.id}
                                                className="space-y-2.5 p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-body-sm font-semibold text-foreground">
                                                            {voter.label_warga}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'px-1.5 py-0 text-[10px] font-medium',
                                                                voter.jalur ===
                                                                    'A'
                                                                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                                    : 'border-muted-foreground/30 text-muted-foreground',
                                                            )}
                                                        >
                                                            {voter.jalur === 'A'
                                                                ? 'Jarak Dekat dengan Foto'
                                                                : 'Jarak Jauh'}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-caption-xs font-mono text-muted-foreground">
                                                            Bobot: {voter.bobot}
                                                        </span>
                                                        {voter.setuju ? (
                                                            <Badge
                                                                variant="default"
                                                                className="gap-1 bg-emerald-600 text-[11px] hover:bg-emerald-600"
                                                            >
                                                                <CheckCircle2 className="size-3" />
                                                                <span>
                                                                    Sudah Sesuai
                                                                </span>
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="destructive"
                                                                className="gap-1 text-[11px]"
                                                            >
                                                                <XCircle className="size-3" />
                                                                <span>
                                                                    Belum Sesuai
                                                                </span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Alasan penolakan jika tidak setuju (Max 256 Karakter) */}
                                                {!voter.setuju &&
                                                    voter.alasan && (
                                                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-caption-xs text-foreground">
                                                            <span className="mb-0.5 block font-semibold text-destructive">
                                                                Catatan
                                                                Keberatan Warga:
                                                            </span>
                                                            <p className="leading-relaxed whitespace-pre-wrap">
                                                                {voter.alasan}
                                                            </p>
                                                        </div>
                                                    )}

                                                {/* Lampiran Foto Verifikasi Jalur A jika ada */}
                                                {voter.foto_verifikasi && (
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                                            <img
                                                                src={
                                                                    voter
                                                                        .foto_verifikasi
                                                                        .url
                                                                }
                                                                alt="Bukti verifikasi warga"
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="size-full object-cover"
                                                            />
                                                            {onPreviewPhoto && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onPreviewPhoto(
                                                                            voter.foto_verifikasi!,
                                                                        )
                                                                    }
                                                                    className="absolute inset-0 flex items-center justify-center bg-black/30 text-white hover:bg-black/50"
                                                                >
                                                                    <ZoomIn className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                                            <p className="font-medium text-foreground">
                                                                Foto Bukti
                                                                Lapangan Warga
                                                            </p>
                                                            {voter
                                                                .foto_verifikasi
                                                                .jarak_m !==
                                                                null && (
                                                                <p>
                                                                    Jarak GPS:{' '}
                                                                    {
                                                                        voter
                                                                            .foto_verifikasi
                                                                            .jarak_m
                                                                    }
                                                                    m
                                                                </p>
                                                            )}
                                                            <p>
                                                                {formatDate(
                                                                    voter
                                                                        .foto_verifikasi
                                                                        .created_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-[10px] text-muted-foreground">
                                                    Waktu:{' '}
                                                    {formatDate(voter.waktu)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                        <ShieldCheck className="mx-auto mb-2 size-8 opacity-40" />
                                        <p className="text-body-sm font-medium">
                                            Belum ada suara verifikasi yang
                                            tercatat
                                        </p>
                                        <p className="mt-1 text-caption-xs">
                                            Warga sekitar lokasi dapat
                                            memberikan suara konfirmasi saat
                                            periode verifikasi dibuka.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </TabsContent>
                    </Tabs>
                ) : (
                    /* Content untuk Node Auditor / Sengketa */
                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        <section className="space-y-3">
                            <h4 className="flex items-center gap-2 text-body-base font-semibold text-foreground">
                                <Scale className="size-4 text-primary" />
                                <span>
                                    Putusan Arbitrase Auditor Independen
                                </span>
                            </h4>

                            {catatanAuditor.length > 0 ? (
                                <div className="space-y-3">
                                    {catatanAuditor.map((ka) => (
                                        <div
                                            key={ka.id}
                                            className="space-y-3 rounded-xl border border-border bg-card p-4"
                                        >
                                            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-caption-xs font-semibold"
                                                >
                                                    Putusan:{' '}
                                                    {ka.jenis.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                                <time className="text-caption-xs text-muted-foreground">
                                                    {formatDate(ka.waktu)}
                                                </time>
                                            </div>

                                            {ka.alasan && (
                                                <div>
                                                    <dt className="text-caption-xs font-semibold text-muted-foreground">
                                                        Pertimbangan Auditor
                                                    </dt>
                                                    <dd className="mt-1 text-body-sm whitespace-pre-wrap text-foreground">
                                                        {ka.alasan}
                                                    </dd>
                                                </div>
                                            )}

                                            {ka.perintah && (
                                                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                                                    <dt className="text-caption-xs font-semibold text-primary">
                                                        Perintah / Instruksi
                                                        Resmi
                                                    </dt>
                                                    <dd className="mt-1 text-body-sm font-medium whitespace-pre-wrap text-foreground">
                                                        {ka.perintah}
                                                    </dd>
                                                </div>
                                            )}

                                            {ka.tenggat && (
                                                <p className="text-caption-xs text-muted-foreground">
                                                    Tenggat Waktu Kepatuhan:{' '}
                                                    <strong>
                                                        {formatDate(ka.tenggat)}
                                                    </strong>
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                    <AlertCircle className="mx-auto mb-2 size-8 opacity-40" />
                                    <p className="text-body-sm font-medium">
                                        Belum ada putusan tertulis dari auditor.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Footer Modal */}
                <div className="flex shrink-0 items-center justify-end border-t border-border bg-muted/20 p-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl px-5"
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

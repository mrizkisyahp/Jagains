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
import type { LampiranFoto, RiwayatStatusItem, BeritaAcaraItem, PemilihVerifikasiItem } from '@/types/tiket';
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
    const [selectedTab, setSelectedTab] = useState<'dokumen' | 'verifikasi'>('dokumen');
    const [openRevisiId, setOpenRevisiId] = useState<number | null>(null);

    if (!item) return null;

    const detail = item.detail;
    const komparasi = detail?.komparasi_foto;
    const fotoSebelum = komparasi?.sebelum;
    const fotoSesudah = komparasi?.sesudah;
    const isFotoSebelumAsli = Boolean(komparasi?.sebelum_asli);

    const beritaAcaraTerkini = detail?.berita_acara?.terkini;
    const riwayatVersi = detail?.berita_acara?.riwayat_versi ?? [];
    const versiLama = riwayatVersi.filter((v) => v.id !== beritaAcaraTerkini?.id);

    const verifikasi = detail?.verifikasi_ringkasan;
    const daftarPemilih: PemilihVerifikasiItem[] = verifikasi?.daftar_pemilih ?? [];
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl bg-card border-border">
                {/* Header Modal */}
                <DialogHeader className="p-5 border-b border-border bg-muted/20 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <InstansiStatusBadge status={item.status_baru} />
                            <span className="text-caption-xs font-mono text-muted-foreground">
                                #{nomorTiket}
                            </span>
                        </div>
                        <time className="text-caption-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {formatDate(item.waktu)}
                        </time>
                    </div>
                    <DialogTitle className="text-title-lg font-semibold text-foreground mt-2">
                        {item.tipe_detail === 'auditor'
                            ? 'Detail Putusan & Hasil Arbitrase Auditor'
                            : 'Detail Hasil Pekerjaan & Verifikasi Warga'}
                    </DialogTitle>
                    <DialogDescription className="text-body-sm text-muted-foreground">
                        {item.catatan || 'Dokumentasi komparasi foto fisik, berita acara, dan progres kuorum verifikasi.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Body Modal dengan Tab */}
                {item.tipe_detail === 'verifikasi' ? (
                    <Tabs
                        value={selectedTab}
                        onValueChange={(val) => setSelectedTab(val as 'dokumen' | 'verifikasi')}
                        className="flex-1 flex flex-col min-h-0 overflow-hidden"
                    >
                        <div className="px-5 pt-3 border-b border-border bg-background shrink-0">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl">
                                <TabsTrigger value="dokumen" className="text-body-sm gap-2">
                                    <FileText className="size-4" />
                                    <span>Hasil & Berita Acara</span>
                                </TabsTrigger>
                                <TabsTrigger value="verifikasi" className="text-body-sm gap-2">
                                    <ShieldCheck className="size-4" />
                                    <span>
                                        Daftar Verifikasi Warga
                                        {daftarPemilih.length > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-bold">
                                                {daftarPemilih.length}
                                            </span>
                                        )}
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB 1: Berita Acara & Komparasi Foto */}
                        <TabsContent value="dokumen" className="flex-1 overflow-y-auto p-5 space-y-6 m-0">
                            {/* Komparasi Foto Sebelum vs Sesudah */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-body-base font-semibold text-foreground flex items-center gap-2">
                                        <Camera className="size-4 text-primary" />
                                        <span>Komparasi Foto Fisik Lapangan</span>
                                    </h4>
                                    <span className="text-caption-xs text-muted-foreground">
                                        Sebelum vs Sesudah
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Card Foto Sebelum */}
                                    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                                        <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
                                            <span className="text-caption-xs font-semibold text-foreground">
                                                Kondisi Sebelum
                                            </span>
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                {isFotoSebelumAsli ? 'Foto Petugas (Sebelum)' : 'Foto Laporan Awal Warga'}
                                            </Badge>
                                        </div>
                                        <div className="relative aspect-video bg-muted/20 flex items-center justify-center overflow-hidden group">
                                            {fotoSebelum ? (
                                                <>
                                                    <img
                                                        src={fotoSebelum.url}
                                                        alt="Foto sebelum pengerjaan"
                                                        className="size-full object-cover"
                                                    />
                                                    {onPreviewPhoto && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onPreviewPhoto(fotoSebelum)}
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5"
                                                        >
                                                            <ZoomIn className="size-4" />
                                                            <span>Perbesar Foto</span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center p-4 text-muted-foreground">
                                                    <ImageIcon className="size-8 mx-auto mb-1 opacity-40" />
                                                    <p className="text-caption-xs">Foto belum tersedia</p>
                                                </div>
                                            )}
                                        </div>
                                        {fotoSebelum && (
                                            <div className="p-2.5 text-[11px] text-muted-foreground space-y-1 bg-muted/10 border-t border-border">
                                                <p>Waktu: {formatDate(fotoSebelum.created_at)}</p>
                                                {fotoSebelum.jarak_m !== null && (
                                                    <p className="flex items-center gap-1">
                                                        <MapPin className="size-3 text-primary" />
                                                        <span>Radius: {fotoSebelum.jarak_m}m dari titik tiket</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Foto Sesudah */}
                                    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                                        <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
                                            <span className="text-caption-xs font-semibold text-foreground">
                                                Hasil Sesudah Perbaikan
                                            </span>
                                            <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-emerald-600 hover:bg-emerald-600">
                                                Petugas Instansi
                                            </Badge>
                                        </div>
                                        <div className="relative aspect-video bg-muted/20 flex items-center justify-center overflow-hidden group">
                                            {fotoSesudah ? (
                                                <>
                                                    <img
                                                        src={fotoSesudah.url}
                                                        alt="Foto sesudah pengerjaan"
                                                        className="size-full object-cover"
                                                    />
                                                    {onPreviewPhoto && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onPreviewPhoto(fotoSesudah)}
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5"
                                                        >
                                                            <ZoomIn className="size-4" />
                                                            <span>Perbesar Foto</span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center p-4 text-muted-foreground">
                                                    <ImageIcon className="size-8 mx-auto mb-1 opacity-40" />
                                                    <p className="text-caption-xs">Foto sesudah belum diunggah</p>
                                                </div>
                                            )}
                                        </div>
                                        {fotoSesudah && (
                                            <div className="p-2.5 text-[11px] text-muted-foreground space-y-1 bg-muted/10 border-t border-border">
                                                <p>Waktu: {formatDate(fotoSesudah.created_at)}</p>
                                                {fotoSesudah.jarak_m !== null && (
                                                    <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <MapPin className="size-3" />
                                                        <span>Geofence GPS Cocok ({fotoSesudah.jarak_m}m)</span>
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
                                    <h4 className="text-body-base font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        <span>Berita Acara Pengerjaan Fisik</span>
                                    </h4>
                                    {beritaAcaraTerkini && (
                                        <Badge variant="outline" className="text-caption-xs">
                                            Versi {beritaAcaraTerkini.versi} (Aktif)
                                        </Badge>
                                    )}
                                </div>

                                {beritaAcaraTerkini ? (
                                    <div className="rounded-xl border border-border bg-card p-4 space-y-3.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                                            <div>
                                                <p className="text-body-sm font-semibold text-foreground">
                                                    {beritaAcaraTerkini.instansi_nama}
                                                </p>
                                                <p className="text-caption-xs text-muted-foreground">
                                                    Diterbitkan: {formatDate(beritaAcaraTerkini.created_at)}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="text-[11px]">
                                                Versi {beritaAcaraTerkini.versi}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 text-body-sm">
                                            <div>
                                                <dt className="text-caption-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Uraian Kegiatan Fisik
                                                </dt>
                                                <dd className="mt-1 text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {beritaAcaraTerkini.kegiatan}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-caption-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Hasil Capaian Pekerjaan
                                                </dt>
                                                <dd className="mt-1 text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {beritaAcaraTerkini.hasil}
                                                </dd>
                                            </div>

                                            {beritaAcaraTerkini.hambatan && (
                                                <div>
                                                    <dt className="text-caption-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Kendala Lapangan
                                                    </dt>
                                                    <dd className="mt-1 text-foreground whitespace-pre-wrap leading-relaxed">
                                                        {beritaAcaraTerkini.hambatan}
                                                    </dd>
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Revisi (Tracking Revisi Draf Lama) */}
                                        {versiLama.length > 0 && (
                                            <div className="pt-3 border-t border-border/70 space-y-2">
                                                <div className="flex items-center gap-1.5 text-caption-xs font-semibold text-muted-foreground">
                                                    <History className="size-3.5 text-primary" />
                                                    <span>Riwayat Revisi ({versiLama.length} revisi sebelumnya)</span>
                                                </div>

                                                <div className="space-y-2">
                                                    {versiLama.map((ba) => (
                                                        <div
                                                            key={ba.id}
                                                            className="rounded-lg border border-border/80 bg-muted/20 p-3 text-caption-xs space-y-1.5"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-foreground">
                                                                    Versi {ba.versi} (Revisi Sebelumnya)
                                                                </span>
                                                                <time className="text-muted-foreground">
                                                                    {formatDate(ba.created_at)}
                                                                </time>
                                                            </div>
                                                            <p className="text-muted-foreground line-clamp-2">
                                                                <strong className="text-foreground">Kegiatan:</strong> {ba.kegiatan}
                                                            </p>
                                                            <p className="text-muted-foreground line-clamp-2">
                                                                <strong className="text-foreground">Hasil:</strong> {ba.hasil}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                        <FileText className="size-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-body-sm font-medium">Belum ada Berita Acara yang diterbitkan</p>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 2: Daftar Verifikasi Warga */}
                        <TabsContent value="verifikasi" className="flex-1 overflow-y-auto p-5 space-y-5 m-0">
                            {/* Banner Ringkasan Kuorum */}
                            {verifikasi ? (
                                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h5 className="text-body-sm font-semibold text-foreground flex items-center gap-1.5">
                                                <Scale className="size-4 text-primary" />
                                                <span>Kuorum Verifikasi Ronde #{verifikasi.nomor_ronde}</span>
                                            </h5>
                                            <p className="text-caption-xs text-muted-foreground">
                                                Batas Akhir: {formatDate(verifikasi.batas_waktu)}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                verifikasi.hasil === 'setuju'
                                                    ? 'default'
                                                    : verifikasi.hasil === 'tolak'
                                                      ? 'destructive'
                                                      : 'secondary'
                                            }
                                            className="text-caption-xs capitalize"
                                        >
                                            {verifikasi.hasil ? `Hasil: ${verifikasi.hasil}` : 'Sedang Berlangsung'}
                                        </Badge>
                                    </div>

                                    {/* Progress Bar Kuorum */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-caption-xs">
                                            <span className="text-muted-foreground">
                                                Capaian Kuorum: <strong>{verifikasi.suara_setuju_bobot}</strong> / {verifikasi.target_k} Bobot
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {verifikasi.persentase_setuju}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, verifikasi.persentase_setuju)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Grid Statistik Bobot */}
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center text-caption-xs">
                                        <div className="p-2 rounded-lg bg-background border border-border/60">
                                            <p className="text-muted-foreground">Total Pemilih</p>
                                            <p className="text-body-base font-bold text-foreground">
                                                {verifikasi.total_pemilih}
                                            </p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-background border border-border/60">
                                            <p className="text-muted-foreground">Bobot Setuju</p>
                                            <p className="text-body-base font-bold text-emerald-600">
                                                {verifikasi.suara_setuju_bobot}
                                            </p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-background border border-border/60">
                                            <p className="text-muted-foreground">Bobot Menolak</p>
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
                                    <h4 className="text-body-base font-semibold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-primary" />
                                        <span>Daftar Suara Masuk</span>
                                    </h4>
                                    <span className="text-caption-xs text-muted-foreground">
                                        Privasi Terjamin (Anonim)
                                    </span>
                                </div>

                                {daftarPemilih.length > 0 ? (
                                    <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                                        {daftarPemilih.map((voter) => (
                                            <div key={voter.id} className="p-4 space-y-2.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-body-sm font-semibold text-foreground">
                                                            {voter.label_warga}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px] py-0 px-1.5 font-medium',
                                                                voter.jalur === 'A'
                                                                    ? 'border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/10'
                                                                    : 'border-muted-foreground/30 text-muted-foreground'
                                                            )}
                                                        >
                                                            {voter.jalur === 'A' ? 'Jalur A (Kamera GPS)' : 'Jalur B (Jarak Jauh)'}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-caption-xs font-mono text-muted-foreground">
                                                            Bobot: {voter.bobot}
                                                        </span>
                                                        {voter.setuju ? (
                                                            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[11px] gap-1">
                                                                <CheckCircle2 className="size-3" />
                                                                <span>Sudah Sesuai</span>
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-[11px] gap-1">
                                                                <XCircle className="size-3" />
                                                                <span>Belum Sesuai</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Alasan penolakan jika tidak setuju (Max 256 Karakter) */}
                                                {!voter.setuju && voter.alasan && (
                                                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-caption-xs text-foreground">
                                                        <span className="font-semibold text-destructive block mb-0.5">
                                                            Catatan Keberatan Warga:
                                                        </span>
                                                        <p className="whitespace-pre-wrap leading-relaxed">
                                                            {voter.alasan}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Lampiran Foto Verifikasi Jalur A jika ada */}
                                                {voter.foto_verifikasi && (
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="relative size-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                                                            <img
                                                                src={voter.foto_verifikasi.url}
                                                                alt="Bukti verifikasi warga"
                                                                className="size-full object-cover"
                                                            />
                                                            {onPreviewPhoto && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onPreviewPhoto(voter.foto_verifikasi!)}
                                                                    className="absolute inset-0 bg-black/30 hover:bg-black/50 flex items-center justify-center text-white"
                                                                >
                                                                    <ZoomIn className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                                                            <p className="font-medium text-foreground">Foto Bukti Lapangan Warga</p>
                                                            {voter.foto_verifikasi.jarak_m !== null && (
                                                                <p>Jarak GPS: {voter.foto_verifikasi.jarak_m}m</p>
                                                            )}
                                                            <p>{formatDate(voter.foto_verifikasi.created_at)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-[10px] text-muted-foreground">
                                                    Waktu: {formatDate(voter.waktu)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                        <ShieldCheck className="size-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-body-sm font-medium">Belum ada suara verifikasi yang tercatat</p>
                                        <p className="text-caption-xs mt-1">
                                            Warga sekitar lokasi dapat memberikan suara konfirmasi saat periode verifikasi dibuka.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </TabsContent>
                    </Tabs>
                ) : (
                    /* Content untuk Node Auditor / Sengketa */
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <section className="space-y-3">
                            <h4 className="text-body-base font-semibold text-foreground flex items-center gap-2">
                                <Scale className="size-4 text-primary" />
                                <span>Putusan Arbitrase Auditor Independen</span>
                            </h4>

                            {catatanAuditor.length > 0 ? (
                                <div className="space-y-3">
                                    {catatanAuditor.map((ka) => (
                                        <div
                                            key={ka.id}
                                            className="rounded-xl border border-border bg-card p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                                <Badge variant="outline" className="text-caption-xs font-semibold">
                                                    Putusan: {ka.jenis.replace(/_/g, ' ')}
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
                                                    <dd className="mt-1 text-body-sm text-foreground whitespace-pre-wrap">
                                                        {ka.alasan}
                                                    </dd>
                                                </div>
                                            )}

                                            {ka.perintah && (
                                                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                                                    <dt className="text-caption-xs font-semibold text-primary">
                                                        Perintah / Instruksi Resmi
                                                    </dt>
                                                    <dd className="mt-1 text-body-sm text-foreground whitespace-pre-wrap font-medium">
                                                        {ka.perintah}
                                                    </dd>
                                                </div>
                                            )}

                                            {ka.tenggat && (
                                                <p className="text-caption-xs text-muted-foreground">
                                                    Tenggat Waktu Kepatuhan: <strong>{formatDate(ka.tenggat)}</strong>
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                    <AlertCircle className="size-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-body-sm font-medium">Belum ada putusan tertulis dari auditor.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Footer Modal */}
                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end shrink-0">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl px-5">
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

